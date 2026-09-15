"""Filling in the image and video URLs a generated lesson asks for.

The lesson agent used to hold `search_educational_image` and
`search_youtube_videos` and was expected to call them, then paste the returned
URL into the block it was writing. It could not do it. Every attempt produced
blocks that were correct right up to the media key, then inlined the call as
the value::

    {"type": "image", "data": {"imageKey": "<function=search_educational_image{...

which the provider rejects outright. The pattern is the same one that took the
eighteen lesson-builder tools out of that agent: a tool whose *result* has to
appear inside the structured answer invites the model to write the call where
the result belongs.

So the model no longer searches. It states what the picture should be --
`imageQuery` / `videoQuery`, which it can write as ordinary JSON -- and the
search happens here afterwards, where it is deterministic, cached per lesson,
and cannot fail the generation.

Images are looked for in order, and the first that fits is used:

  1. Serper image search -- the best-scoring candidate that actually loads.
  2. Wikipedia and Wikimedia Commons (see `wikimedia_images`).
  3. A figure drawn from the lesson's own words and stored (see
     `lesson_figures`), so a lesson that asked for a picture always gets one.
"""

from __future__ import annotations

import logging
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any
from urllib.parse import urlparse

import httpx

from app.domain.lesson_figures import draw_and_store_figure
from app.domain.wikimedia_images import find_image as find_wikimedia_image
from app.tools.certification.web_search import serper_image_search, youtube_search

logger = logging.getLogger(__name__)

#: How many image candidates to fetch per query before picking one. Serper's
#: #1 result is frequently a generic stock/social repost that merely ranks
#: well, not the best match for the query -- asking for a few and scoring them
#: catches that without a second network round-trip per block.
_IMAGE_CANDIDATES = 5

_DIAGRAM_HINTS = {"diagram", "chart", "graph", "architecture", "illustration", "infographic", "schematic"}

#: Domains that routinely surface in image search but are reposts/social
#: shares rather than the original educational source -- rarely a good match
#: for a lesson's technical query.
_LOW_SIGNAL_DOMAINS = {
    "pinterest.com", "pinimg.com", "tumblr.com", "imgur.com",
    "facebook.com", "instagram.com", "twitter.com", "x.com", "reddit.com",
}

_STOPWORDS = {"the", "a", "an", "of", "for", "and", "or", "to", "in", "on", "with", "vs"}

#: A browser-shaped request, because hotlink blocks answer anything else
#: differently -- and it is a browser that will load the image in the lesson.
_IMAGE_CHECK_HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
}
_MIN_IMAGE_BYTES = 3000


def _keywords(text: str) -> set[str]:
    return {w for w in re.findall(r"[a-z0-9]+", text.lower()) if len(w) > 2 and w not in _STOPWORDS}


def _domain(url: str) -> str:
    try:
        return urlparse(url).netloc.removeprefix("www.")
    except Exception:
        return ""


def _search_terms(query: str) -> str:
    """Appends a diagram hint only when the query doesn't already carry one.

    The old code always appended " diagram architecture chart", which for a
    query the model already wrote as e.g. "requirement management diagram"
    produced "requirement management diagram diagram architecture chart" --
    a duplicated, unfocused query that pulled in generic architecture-diagram
    results with nothing to do with the actual lesson topic.
    """
    if _DIAGRAM_HINTS & _keywords(query):
        return query
    return f"{query} diagram"


def _ranked_candidates(query: str, candidates: list[dict]) -> list[dict]:
    """Candidates best first by title overlap with the query, known low-signal
    sources last -- an unranked image still beats no image."""
    query_words = _keywords(query)
    preferred = [image for image in candidates if _domain(image.get("link", "")) not in _LOW_SIGNAL_DOMAINS]
    preferred.sort(key=lambda image: len(query_words & _keywords(image.get("title", ""))), reverse=True)
    return preferred + [image for image in candidates if image not in preferred]


def _image_loads(url: str) -> bool:
    """True only when the URL returns real image bytes.

    Serper returns whatever ranks, and many of those hosts block hotlinking --
    answering 403, or 200 with an HTML page. Storing such a URL is how lessons
    ended up with empty image boxes, so a candidate is kept only after this.
    """
    if not url:
        return False
    try:
        with httpx.Client(timeout=15.0, follow_redirects=True, headers=_IMAGE_CHECK_HEADERS) as client:
            response = client.get(url)
    except httpx.HTTPError:
        return False
    content_type = response.headers.get("content-type", "").split(";")[0].strip()
    return response.status_code == 200 and content_type.startswith("image/") and len(response.content) > _MIN_IMAGE_BYTES


def _search_serper_image(query: str) -> dict | None:
    """The best-scoring Serper image that actually loads, or None."""
    try:
        candidates = serper_image_search(_search_terms(query), num=_IMAGE_CANDIDATES)
    except Exception as error:  # no key, no credits, network
        logger.warning("Serper image search for %r failed: %s", query, error)
        return None
    for image in _ranked_candidates(query, candidates or []):
        url = image.get("imageUrl", "")
        if _image_loads(url):
            source_url = image.get("link", "")
            return {"url": url, "sourceUrl": source_url, "sourceName": image.get("source") or _domain(source_url)}
    return None

#: `data` key holding the request -> (resolved URL key, source page URL key,
#: source name key). The source keys let the renderer credit where a picture
#: came from instead of showing an unattributed image.
MEDIA_REQUESTS = {
    "imageQuery": ("imageKey", "imageSourceUrl", "imageSourceName"),
    "videoQuery": ("videoKey", "videoSourceUrl", "videoSourceName"),
}

_EMPTY_RESULT = {"url": "", "sourceUrl": "", "sourceName": ""}

#: Block fields a drawn figure can be written from, besides the query itself.
_CONTEXT_FIELDS = ("title", "description", "smallHeader", "supportingTitle", "supportingDescription")


def _search_image(query: str, context: dict | None = None) -> dict:
    """Serper first, then Wikimedia, and a drawn figure when neither has one."""
    found = _search_serper_image(query) or find_wikimedia_image(query)
    if found:
        return {"url": found["url"], "sourceUrl": found["sourceUrl"], "sourceName": found["sourceName"]}

    key = draw_and_store_figure(query, context)
    # A drawn figure is ours, so it carries no source to credit.
    return {"url": key or "", "sourceUrl": "", "sourceName": ""}


def _search_video(query: str, context: dict | None = None) -> dict:
    items = youtube_search(query, max_results=1)
    if not items:
        return dict(_EMPTY_RESULT)

    video_id = items[0]["id"]["videoId"]
    url = f"https://www.youtube.com/watch?v={video_id}"
    channel = items[0].get("snippet", {}).get("channelTitle", "")
    return {"url": url, "sourceUrl": url, "sourceName": channel or "YouTube"}


_SEARCHERS = {"imageQuery": _search_image, "videoQuery": _search_video}


#: How many media lookups run at once for one lesson.
#:
#: A lesson asks for five to seven pictures and each search is a round trip of
#: a second or two, so resolving them one at a time spent ten to fifteen
#: seconds per lesson waiting -- minutes across a curriculum, for work that has
#: no order to it. Kept modest because the search provider rate-limits, and
#: because a burst that trips the limit costs illustrations rather than saving
#: time.
_MEDIA_WORKERS = 5


def _resolve_one(request_key: str, query: str, context: dict | None = None) -> dict:
    """One media lookup, never raising.

    A failed search is a lesson without a picture, which an admin can fill in.
    A raised exception would be a lesson lost after it was already paid for.
    """
    try:
        return _SEARCHERS[request_key](query, context)
    except Exception as error:  # network, quota, malformed response
        logger.warning("Media search for %r failed: %s", query, error)
        return dict(_EMPTY_RESULT)


#: List fields whose entries a drawn figure lays out as labelled boxes, and the
#: keys an entry's name and explanation live under in each block type.
_ITEM_FIELDS = ("gridItems", "items", "cards")
_ITEM_NAME_KEYS = ("title", "frontTitle", "label", "text")
_ITEM_DETAIL_KEYS = ("description", "content", "backTitle")


def _items_of(data: dict) -> list[dict]:
    items = []
    for field in _ITEM_FIELDS:
        for entry in data.get(field) or []:
            if not isinstance(entry, dict):
                continue
            name = next((entry[k] for k in _ITEM_NAME_KEYS if isinstance(entry.get(k), str) and entry[k].strip()), "")
            detail = next((entry[k] for k in _ITEM_DETAIL_KEYS if isinstance(entry.get(k), str) and entry[k].strip()), "")
            if name:
                items.append({"title": name, "description": detail})
    return items


def _block_context(sections: list[Any], index: int) -> dict:
    """The words a drawn figure for block `index` can use.

    Its own title, description and items first; for a bare image block, the
    paragraph or list just before it, which is what the picture illustrates.
    """
    data = sections[index].get("data") or {}
    context: dict = {field: data[field] for field in _CONTEXT_FIELDS
                     if isinstance(data.get(field), str) and data[field].strip()}
    items = _items_of(data)
    if items:
        context["items"] = items

    for previous in reversed(sections[:index]):
        previous_data = previous.get("data") if isinstance(previous, dict) else None
        if not isinstance(previous_data, dict):
            continue
        if previous.get("type") == "description" and isinstance(previous_data.get("text"), str):
            context.setdefault("nearbyText", previous_data["text"])
            break
        if previous.get("type") in ("unordered-list", "ordered-list"):
            texts = [entry.get("text") for entry in previous_data.get("items") or []
                     if isinstance(entry, dict) and isinstance(entry.get("text"), str) and entry["text"].strip()]
            if texts:
                context.setdefault("nearbyList", texts)
                break
    return context


def _collect_requests(sections: list[dict]) -> dict[tuple[str, str], dict]:
    """Every distinct (kind, query) the lesson asks for, with the first block's context.

    Deduplicating up front is what makes the searches parallelisable: the
    serial version deduplicated as it walked, which meant it could not know
    what to dispatch until it had already dispatched most of it.
    """
    wanted: dict[tuple[str, str], dict] = {}
    for index, block in enumerate(sections):
        if not isinstance(block, dict) or not isinstance(block.get("data"), dict):
            continue
        for request_key in MEDIA_REQUESTS:
            query = block["data"].get(request_key)
            if isinstance(query, str) and query.strip() and (request_key, query) not in wanted:
                wanted[(request_key, query)] = _block_context(sections, index)
    return wanted


def resolve_media(sections: list[dict]) -> list[dict]:
    """Replaces each block's media *request* with a real URL, plus who it
    came from.

    Never raises and never invents a URL: an image nobody could find or draw,
    or a video search that failed, leaves the key blank, which renders as a
    block without media and is exactly what an admin can fill in later. Losing
    an illustration must not lose the lesson.

    Searches run concurrently and are deduplicated first, so a diagram
    requested by three blocks costs one search rather than three, and a lesson
    wanting six pictures waits for the slowest rather than the sum.
    """
    wanted = _collect_requests(sections)
    resolved: dict[tuple[str, str], dict] = {}

    if wanted:
        with ThreadPoolExecutor(max_workers=min(_MEDIA_WORKERS, len(wanted))) as pool:
            futures = {
                pool.submit(_resolve_one, request_key, query, context): (request_key, query)
                for (request_key, query), context in wanted.items()
            }
            for future in as_completed(futures):
                # _resolve_one swallows its own failures, so this cannot raise
                # -- but a pool that died would, and that must not lose the
                # lesson either.
                try:
                    resolved[futures[future]] = future.result()
                except Exception as error:
                    logger.warning("Media lookup pool failed for %r: %s",
                                   futures[future], error)
                    resolved[futures[future]] = dict(_EMPTY_RESULT)

    out = []

    for block in sections:
        if not isinstance(block, dict) or not isinstance(block.get("data"), dict):
            out.append(block)
            continue

        data = dict(block["data"])
        for request_key, (url_key, source_url_key, source_name_key) in MEDIA_REQUESTS.items():
            query = data.pop(request_key, None)
            if not isinstance(query, str) or not query.strip():
                continue

            result = resolved.get((request_key, query)) or dict(_EMPTY_RESULT)
            data[url_key] = result["url"] or data.get(url_key, "")
            if result["url"] and result["sourceUrl"]:
                data[source_url_key] = result["sourceUrl"]
                data[source_name_key] = result["sourceName"]
            data.setdefault("file", None)

        out.append({**block, "data": data})

    return out
