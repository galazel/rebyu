"""Media URLs are attached after generation, not during it.

The lesson agent held `search_educational_image` / `search_youtube_videos` and
was expected to call them and paste the result into the block it was writing.
Twelve live attempts produced the same failure: correct blocks up to the media
key, then the call inlined as the value::

    {"type": "image", "data": {"imageKey": "<function=search_educational_image{...

which Groq rejects with `tool_use_failed`. Same shape as the eighteen
lesson-builder tools removed before it, one layer down. The model now writes a
plain `imageQuery` string and the search runs here.

Images come from Wikimedia, and a block Wikimedia has nothing for gets a figure
drawn from its own words. Both are faked here; no test touches the network.
"""

from __future__ import annotations

import pytest

from app.domain import lesson_media, wikimedia_images
from app.domain.lesson_media import resolve_media


@pytest.fixture()
def media(monkeypatch):
    """Records every lookup instead of hitting the network.

    Serper and Wikimedia find nothing by default; a test adds results to
    `serper` / `found`. Every image URL "loads" unless listed in `broken`.
    """
    calls = {"serper": [], "wikimedia": [], "figures": [], "video": []}
    found, serper, broken = {}, {}, set()

    def serper_search(query, num=1):
        calls["serper"].append(query)
        return serper.get(query, [])

    def wikimedia(query):
        calls["wikimedia"].append(query)
        return found.get(query)

    def figure(query, context=None):
        calls["figures"].append((query, context or {}))
        return f"lesson-figures/{len(calls['figures'])}.svg"

    def video(query, max_results=1):
        calls["video"].append(query)
        return [{"id": {"videoId": "abc123"}, "snippet": {"channelTitle": "Example Channel"}}]

    monkeypatch.setattr(lesson_media, "serper_image_search", serper_search)
    monkeypatch.setattr(lesson_media, "_image_loads", lambda url: bool(url) and url not in broken)
    monkeypatch.setattr(lesson_media, "find_wikimedia_image", wikimedia)
    monkeypatch.setattr(lesson_media, "draw_and_store_figure", figure)
    monkeypatch.setattr(lesson_media, "youtube_search", video)
    calls.update(found=found, serper_results=serper, broken=broken)
    return calls


def _image_block(query="requirement management diagram", **extra):
    return {"type": "image", "data": {"imageQuery": query, **extra}}


REAL = {"url": "https://upload.wikimedia.org/diagram.svg",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Diagram.svg",
        "sourceName": "Wikimedia Commons"}


# --- Serper first ---------------------------------------------------------

def _serper_hit(url, title="requirement management diagram", link="https://reference.example/article"):
    return {"imageUrl": url, "link": link, "title": title, "source": "Reference Example"}


def test_serper_is_asked_first_and_its_image_used_with_its_source(media):
    media["serper_results"]["requirement management diagram"] = [_serper_hit("https://img.example/1.png")]
    media["found"]["requirement management diagram"] = REAL

    block = resolve_media([_image_block()])[0]

    assert block["data"]["imageKey"] == "https://img.example/1.png"
    assert block["data"]["imageSourceUrl"] == "https://reference.example/article"
    assert block["data"]["imageSourceName"] == "Reference Example"
    assert media["wikimedia"] == [], "Wikimedia is not needed when Serper found one"
    assert media["figures"] == []


def test_a_query_without_a_diagram_hint_gets_one_for_serper(media):
    resolve_media([_image_block("common requirement management mistakes")])
    assert media["serper"] == ["common requirement management mistakes diagram"]


def test_the_best_scoring_serper_candidate_beats_the_top_result(media):
    media["serper_results"]["database normalization diagram"] = [
        _serper_hit("https://img.example/generic.png", title="Random architecture wallpaper"),
        _serper_hit("https://img.example/match.png", title="Database normalization diagram"),
    ]
    block = resolve_media([_image_block("database normalization diagram")])[0]
    assert block["data"]["imageKey"] == "https://img.example/match.png"


def test_a_serper_image_that_does_not_load_is_skipped(media):
    media["serper_results"]["normal forms diagram"] = [
        _serper_hit("https://blocked.example/403.png", title="normal forms diagram"),
        _serper_hit("https://img.example/ok.png", title="forms"),
    ]
    media["broken"].add("https://blocked.example/403.png")

    block = resolve_media([_image_block("normal forms diagram")])[0]

    assert block["data"]["imageKey"] == "https://img.example/ok.png"


def test_wikimedia_is_used_when_serper_has_nothing_that_loads(media):
    media["serper_results"]["binary search diagram"] = [_serper_hit("https://blocked.example/x.png")]
    media["broken"].add("https://blocked.example/x.png")
    media["found"]["binary search diagram"] = REAL

    block = resolve_media([_image_block("binary search diagram")])[0]

    assert block["data"]["imageKey"] == REAL["url"]
    assert block["data"]["imageSourceName"] == "Wikimedia Commons"


def test_a_serper_failure_falls_through_instead_of_raising(monkeypatch, media):
    def boom(query, num=1):
        raise RuntimeError("SERPER_API_KEY missing")

    monkeypatch.setattr(lesson_media, "serper_image_search", boom)
    block = resolve_media([_image_block()])[0]
    assert block["data"]["imageKey"] == "lesson-figures/1.svg"


# --- then Wikimedia -------------------------------------------------------

def test_a_relevant_wikimedia_image_is_used_with_its_credit(media):
    media["found"]["binary search"] = REAL

    block = resolve_media([_image_block("binary search")])[0]

    assert block["data"]["imageKey"] == REAL["url"]
    assert block["data"]["imageSourceUrl"] == REAL["sourceUrl"]
    assert block["data"]["imageSourceName"] == "Wikimedia Commons"
    assert media["figures"] == [], "no figure is drawn when a real image exists"


# --- a drawn figure when there is none ------------------------------------

def test_a_block_with_no_real_image_gets_a_drawn_figure(media):
    block = resolve_media([_image_block("capacity planning horizon")])[0]

    assert block["data"]["imageKey"] == "lesson-figures/1.svg"
    assert "imageSourceUrl" not in block["data"], "a figure we drew credits nobody"


def test_the_figure_is_drawn_from_the_blocks_own_words(media):
    resolve_media([{"type": "image-left-text",
                    "data": {"imageQuery": "cache hierarchy", "title": "Memory hierarchy",
                             "description": "Faster memory is smaller. Slower memory is larger."}}])

    query, context = media["figures"][0]
    assert query == "cache hierarchy"
    assert context["title"] == "Memory hierarchy"
    assert context["description"].startswith("Faster memory")


def test_a_bare_image_block_borrows_the_description_before_it(media):
    resolve_media([
        {"type": "description", "data": {"text": "Normalisation removes update anomalies."}},
        _image_block("normal forms"),
    ])

    assert media["figures"][0][1]["nearbyText"] == "Normalisation removes update anomalies."


def test_a_grid_blocks_items_reach_the_figure_as_labelled_boxes(media):
    resolve_media([{"type": "image-feature-grid",
                    "data": {"imageQuery": "cloud models", "smallHeader": "Who manages what",
                             "gridItems": [{"title": "IaaS", "description": "You manage the OS up."},
                                           {"title": "PaaS", "description": "You manage the app."},
                                           {"title": "SaaS", "description": "You manage nothing."}]}}])

    context = media["figures"][0][1]
    assert [item["title"] for item in context["items"]] == ["IaaS", "PaaS", "SaaS"]
    assert context["items"][0]["description"] == "You manage the OS up."


def test_a_bare_image_block_borrows_the_list_before_it(media):
    resolve_media([
        {"type": "ordered-list", "data": {"items": [{"text": "Plan"}, {"text": "Build"}, {"text": "Test"}]}},
        _image_block("development life cycle"),
    ])

    assert media["figures"][0][1]["nearbyList"] == ["Plan", "Build", "Test"]


def test_a_figure_that_could_not_be_drawn_leaves_the_key_blank(monkeypatch, media):
    monkeypatch.setattr(lesson_media, "draw_and_store_figure", lambda query, context=None: None)

    assert resolve_media([_image_block()])[0]["data"]["imageKey"] == ""


# --- videos, dedupe and pass-through --------------------------------------

def test_a_video_request_becomes_a_watch_url_with_its_channel(media):
    block = resolve_media([{"type": "video", "data": {"videoQuery": "requirements tutorial"}}])[0]

    assert block["data"]["videoKey"] == "https://www.youtube.com/watch?v=abc123"
    assert block["data"]["videoSourceName"] == "Example Channel"
    assert block["data"]["videoSourceUrl"] == block["data"]["videoKey"]


def test_the_request_key_does_not_survive_into_the_stored_block(media):
    """`imageQuery` is a message to this module, not something the renderer
    should ever see."""
    assert "imageQuery" not in resolve_media([_image_block()])[0]["data"]


def test_resolved_blocks_get_the_file_slot_the_renderer_reads(media):
    assert resolve_media([_image_block()])[0]["data"]["file"] is None


def test_a_block_carrying_both_kinds_resolves_both(media):
    block = resolve_media(
        [{"type": "media-text-block",
          "data": {"imageQuery": "erd", "videoQuery": "erd walkthrough", "layout": "image-left"}}]
    )[0]

    assert block["data"]["imageKey"] == "lesson-figures/1.svg"
    assert block["data"]["videoKey"].startswith("https://www.youtube.com/")
    assert block["data"]["layout"] == "image-left", "other fields must be untouched"


def test_the_same_request_is_looked_up_once_per_lesson(media):
    """Three blocks wanting the same diagram is one lookup and one figure, not three."""
    resolve_media([_image_block("normalization"), _image_block("normalization"),
                   _image_block("normalization")])

    assert media["wikimedia"] == ["normalization"]
    assert len(media["figures"]) == 1


def test_a_failure_does_not_stop_later_blocks_resolving(monkeypatch, media):
    def flaky(query):
        if query == "first":
            raise RuntimeError("transient")
        return REAL

    monkeypatch.setattr(lesson_media, "find_wikimedia_image", flaky)

    blocks = resolve_media([_image_block("first"), _image_block("second")])
    assert blocks[0]["data"]["imageKey"] == ""
    assert blocks[1]["data"]["imageKey"] == REAL["url"]


def test_blocks_without_media_are_returned_unchanged(media):
    heading = {"type": "heading", "data": {"text": "Overview"}}
    assert resolve_media([heading]) == [heading]
    assert media["wikimedia"] == []


def test_a_blank_query_is_not_searched(media):
    resolve_media([{"type": "image", "data": {"imageQuery": "   "}}])
    assert media["wikimedia"] == [] and media["figures"] == []


def test_malformed_blocks_are_left_for_the_schema_to_judge(media):
    assert resolve_media([{"type": "heading"}, "not a block"]) == [{"type": "heading"}, "not a block"]


# --- choosing among Wikimedia candidates, offline ---------------------------

def _page(title):
    return {"title": title, "imageinfo": [{"thumburl": f"https://upload.wikimedia.org/{title}.png",
                                           "descriptionurl": f"https://commons.wikimedia.org/wiki/{title}"}]}


def test_logos_icons_and_photographs_are_not_candidates():
    assert wikimedia_images.usable(_page("File:Wikibooks-logo.svg")) is None
    assert wikimedia_images.usable(_page("File:Journal Icon.svg")) is None
    assert wikimedia_images.usable(_page("File:Binary search photo.jpg")) is None
    assert wikimedia_images.usable(_page("File:Binary search depiction.svg"))["title"] == "File:Binary search depiction.svg"


def test_a_candidate_must_share_words_with_the_query():
    words = wikimedia_images.keywords("binary search tree")
    candidates = [{"title": "File:Butterfly in Siem Reap.svg"},
                  {"title": "File:Binary search tree search 4.svg"},
                  {"title": "File:Search engine.svg"}]

    ranked = wikimedia_images.rank(candidates, words, minimum=2)

    assert [c["title"] for c in ranked] == ["File:Binary search tree search 4.svg"]


def test_a_query_with_no_real_words_is_not_searched():
    assert wikimedia_images.find_image("the diagram of an") is None


# --- the prompt must not ask for what it cannot produce -------------------

def test_the_prompt_never_asks_the_model_for_a_media_url():
    """The regression guard: reintroducing `imageKey` to the block catalogue
    would invite the inlined tool call straight back."""
    from app.agents.certification.lesson_agent import build_system_prompt

    SYSTEM_PROMPT = build_system_prompt()

    catalogue = SYSTEM_PROMPT[SYSTEM_PROMPT.index("CONTENT BLOCKS"):]
    assert "imageKey" not in catalogue
    assert "videoKey" not in catalogue
    assert "imageQuery" in catalogue


def test_the_agent_is_given_no_tool_whose_result_belongs_in_the_answer():
    from app.tools.certification.lesson_tools import lesson_research_tools

    assert [tool.name for tool in lesson_research_tools] == ["search_more_lesson_info"]
