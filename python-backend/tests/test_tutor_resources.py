"""Related videos and links for tutor answers: scoped to the lesson, fail soft."""

from app.domain import tutor_resources as resources


def test_explicit_requests_for_material_are_recognised():
    for said in (
        "Can you give me YouTube videos about this?",
        "any links or further reading?",
        "give me video to watch",
        "where can I learn more about this?",
        "any good material on NFV?",
        "can you recommend a tutorial",
        "videos pls",
        "pakita mo ko ng video",
        "share some articles about subnetting",
        "is there a video about SDN",
    ):
        assert resources.asks_for_resources(said), said


def test_ordinary_questions_are_not_requests_for_material():
    for said in (
        "What is a subnet mask?",
        "what does the data link layer do?",
        "explain link-state routing",
        "how is a linked list stored?",
        "how do branch sites connect over a site-to-site VPN?",
        "what is the source address in this packet?",
        "is open source software allowed here?",
        "why does the controller watch traffic?",
        "explain this part of the lesson",
        "I still don't understand NFV",
    ):
        assert not resources.asks_for_resources(said), said


def test_searches_are_scoped_to_the_lesson(monkeypatch):
    seen = []
    monkeypatch.setattr(resources, "youtube_search", lambda q, max_results: seen.append(q) or [])
    monkeypatch.setattr(resources, "serper_search", lambda q, num: seen.append(q) or [])
    resources.find_resources("cats", "IPv4 Subnetting")
    assert seen and all(q.startswith("IPv4 Subnetting") for q in seen)


def test_a_search_outage_costs_the_extras_not_the_answer(monkeypatch):
    def down(*a, **k):
        raise RuntimeError("out of credits")
    monkeypatch.setattr(resources, "youtube_search", down)
    monkeypatch.setattr(resources, "serper_search", down)
    monkeypatch.setattr(resources, "_wikipedia", lambda topic, limit: [])
    assert resources.find_resources("subnetting", "IPv4") == []


def test_links_skip_youtube_and_repeat_sites(monkeypatch):
    monkeypatch.setattr(resources, "youtube_search", lambda q, max_results: [])
    monkeypatch.setattr(resources, "serper_search", lambda q, num: [
        {"title": "A", "link": "https://www.youtube.com/watch?v=x"},
        {"title": "B", "link": "https://example.com/one"},
        {"title": "C", "link": "https://example.com/two"},
        {"title": "D", "link": "javascript:alert(1)"},
        {"title": "E", "link": "https://other.org/x"},
    ])
    links = resources.find_resources("q", "L")
    assert [l["url"] for l in links] == ["https://example.com/one", "https://other.org/x"]


def test_the_wikipedia_fallback_drops_how_to_words():
    assert resources._HOW_TO_WORDS.sub(" ", "Subnetting CIDR tutorial explained").split() == ["Subnetting", "CIDR"]


def test_confusion_is_recognised_and_ordinary_questions_are_not():
    for said in ["I don't understand", "i still dont get it", "I'm confused", "can you explain again?",
                 "this makes no sense", "di ko gets"]:
        assert resources.signals_confusion(said), said
    for said in ["What is a subnet?", "I understand now, thanks", "Explain CIDR"]:
        assert not resources.signals_confusion(said), said


def test_the_tutor_sees_the_turns_before_the_question():
    from langchain_core.messages import AIMessage, HumanMessage

    from app.graphs.tutor.nodes import _earlier_turns

    state = {"request": "I don't understand", "messages": [
        HumanMessage(content="What is a subnet mask?"),
        AIMessage(content="A subnet mask splits an address into network and host parts."),
        HumanMessage(content="I don't understand"),
    ]}
    turns = _earlier_turns(state)
    assert [m.content for m in turns] == [
        "What is a subnet mask?", "A subnet mask splits an address into network and host parts."]


def _video(n):
    return {"id": {"videoId": f"v{n}"}, "snippet": {"title": f"Video {n}", "channelTitle": "Ch"}}


def _link(n):
    return {"link": f"https://site{n}.example/page", "title": f"Page {n}"}


def test_no_videos_means_more_reading(monkeypatch):
    calls = []
    monkeypatch.setattr(resources, "youtube_search", lambda q, max_results: calls.append(q) or [])
    monkeypatch.setattr(resources, "serper_search", lambda q, num: [_link(n) for n in range(8)])
    found = resources.find_resources("subnetting explained", "IPv4 Addressing")
    assert [r["kind"] for r in found] == ["link"] * resources.MAX_TOTAL
    # The focused search found nothing, so videos were retried on the lesson.
    assert calls[-1] == "IPv4 Addressing explained"


def test_no_reading_means_more_videos(monkeypatch):
    monkeypatch.setattr(resources, "youtube_search", lambda q, max_results: [_video(n) for n in range(max_results)])
    monkeypatch.setattr(resources, "serper_search", lambda q, num: [])
    monkeypatch.setattr(resources, "_wikipedia", lambda topic, limit: [])
    found = resources.find_resources("subnetting explained", "IPv4 Addressing")
    assert [r["kind"] for r in found] == ["video"] * resources.MAX_TOTAL


def test_both_kinds_share_the_list(monkeypatch):
    monkeypatch.setattr(resources, "youtube_search", lambda q, max_results: [_video(n) for n in range(max_results)])
    monkeypatch.setattr(resources, "serper_search", lambda q, num: [_link(n) for n in range(8)])
    found = resources.find_resources("subnetting explained", "IPv4 Addressing")
    kinds = [r["kind"] for r in found]
    assert kinds == ["video"] * resources.MAX_VIDEOS + ["link"] * resources.MAX_LINKS


def test_a_pasted_paragraph_becomes_a_short_topical_query():
    asked = ('I\'m asking about this part of the lesson:\n"""\nNFV runs network functions as '
             'software on general-purpose servers. It is separate from SDN.\n"""\n\nExplain this part of the lesson.')
    topic = resources._topic(asked, "Network Function Virtualization")
    assert len(topic.split()) <= resources.MAX_QUERY_WORDS
    assert "asking" not in topic.lower() and "NFV" in topic
