"""Related videos and reading for an AI tutor answer.

The tutor decides whether outside material would help (it sets
`resource_search` on its answer); this module does the looking up, so the
links a learner is given are real search results rather than URLs a model
wrote from memory, which are often dead or invented.

Every search is scoped to the lesson: the lesson name leads the query, so a
learner who asks for "videos" gets videos about what they are studying.
Lookups fail soft -- a missing key or a search outage costs the extras, never
the answer.
"""

from __future__ import annotations

import html
import logging
import re
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote, urlparse

import httpx

from app.tools.certification.web_search import serper_search, youtube_search

logger = logging.getLogger(__name__)

MAX_VIDEOS = 3
MAX_LINKS = 4

#: A learner asking for outside material in so many words. Used when the model
#: did not set a search itself, so an explicit request is never ignored.
RESOURCE_REQUEST = re.compile(
    r"\b(videos?|youtube|watch|links?|resources?|articles?|websites?|sites?|"
    r"read(ing)? more|further reading|references?|tutorials?|courses?)\b",
    re.IGNORECASE,
)


#: A learner saying the explanation did not land. Another explanation in the
#: same voice often will not either, so these also bring videos and reading.
CONFUSION = re.compile(
    r"(\bi\s*(still\s+)?(do\s*n[o']?t|dont|cannot|can'?t)\s+(understand|get\s+it|get\s+this|follow)|"
    r"\bstill\s+(confused|lost|don'?t\s+get)|\bi'?m\s+(confused|lost)|\bconfusing\b|"
    r"\bnot\s+clear\b|\bmakes?\s+no\s+sense\b|\bexplain\s+(it\s+)?again\b|\bhuh\b|"
    r"\bdi\s*ko\s+(gets|ma\s*gets|maintindihan)\b)",
    re.IGNORECASE,
)


def asks_for_resources(question: str | None) -> bool:
    return bool(question and RESOURCE_REQUEST.search(question))


def signals_confusion(message: str | None) -> bool:
    return bool(message and CONFUSION.search(message))


def _topic(query: str, lesson_name: str | None) -> str:
    query = " ".join((query or "").split())
    lesson = " ".join((lesson_name or "").split())
    if lesson and lesson.lower() not in query.lower():
        return f"{lesson} {query}".strip()
    return query or lesson


def _videos(topic: str) -> list[dict]:
    try:
        items = youtube_search(topic, max_results=MAX_VIDEOS)
    except Exception as error:  # noqa: BLE001 -- extras, never the answer
        logger.warning("Tutor video search failed: %s", error)
        return []
    videos = []
    for item in items:
        video_id = (item.get("id") or {}).get("videoId")
        snippet = item.get("snippet") or {}
        if not video_id:
            continue
        thumbnails = snippet.get("thumbnails") or {}
        thumbnail = (thumbnails.get("medium") or thumbnails.get("default") or {}).get("url")
        videos.append({
            "kind": "video",
            "title": html.unescape(snippet.get("title") or "YouTube video"),
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "source": html.unescape(snippet.get("channelTitle") or "YouTube"),
            "thumbnail": thumbnail,
        })
    return videos


#: Wikimedia refuses requests without an identifying User-Agent.
_WIKI_HEADERS = {"User-Agent": "REBYU-AI-Tutor/1.0 (educational review platform; contact via rebyu.app)"}


#: Words that make sense to a web search but sink an encyclopedia search.
_HOW_TO_WORDS = re.compile(
    r"\b(tutorials?|explained|explanation|videos?|youtube|guides?|courses?|lessons?|"
    r"examples?|basics|introduction|intro|how to|for beginners|step by step)\b",
    re.IGNORECASE,
)


def _wikipedia(topic: str, limit: int) -> list[dict]:
    """Free, keyless fallback for reading links when web search is unavailable."""
    topic = " ".join(_HOW_TO_WORDS.sub(" ", topic).split())
    try:
        with httpx.Client(timeout=httpx.Timeout(8.0, connect=4.0), headers=_WIKI_HEADERS) as client:
            response = client.get("https://en.wikipedia.org/w/api.php", params={
                "action": "query", "list": "search", "srsearch": topic,
                "srlimit": limit, "format": "json",
            })
        response.raise_for_status()
        hits = response.json().get("query", {}).get("search", [])
    except Exception as error:  # noqa: BLE001 -- extras, never the answer
        logger.warning("Tutor Wikipedia search failed: %s", error)
        return []
    return [{
        "kind": "link",
        "title": hit["title"],
        "url": "https://en.wikipedia.org/wiki/" + quote(hit["title"].replace(" ", "_")),
        "source": "wikipedia.org",
        "snippet": re.sub(r"<[^>]+>", "", html.unescape(hit.get("snippet", ""))),
    } for hit in hits if hit.get("title")]


def _links(topic: str, lesson_name: str | None = None) -> list[dict]:
    try:
        results = serper_search(topic, num=8)
    except Exception as error:  # noqa: BLE001 -- extras, never the answer
        logger.warning("Tutor link search failed (%s); falling back to Wikipedia", error)
        # By the lesson, not the question: an encyclopedia search on a whole
        # sentence ("what does the /26 mean ... explained simply") matches
        # something generic, where the lesson's own name finds its articles.
        return _wikipedia(lesson_name or topic, 3)
    links, seen = [], set()
    for result in results:
        url = result.get("link") or ""
        host = urlparse(url).netloc.lower().removeprefix("www.")
        # Videos come from the YouTube search; one link per site keeps the
        # list varied.
        if not url.startswith(("https://", "http://")) or "youtube.com" in host or host in seen:
            continue
        seen.add(host)
        links.append({
            "kind": "link",
            "title": result.get("title") or host,
            "url": url,
            "source": host,
            "snippet": result.get("snippet") or "",
        })
        if len(links) >= MAX_LINKS:
            break
    return links


def find_resources(query: str, lesson_name: str | None) -> list[dict]:
    """Videos then links for `query`, scoped to the lesson. Blocking (HTTP);
    callers on the event loop run it in a thread."""
    topic = _topic(query, lesson_name)
    if not topic:
        return []
    with ThreadPoolExecutor(max_workers=2) as pool:
        videos = pool.submit(_videos, topic)
        links = pool.submit(_links, topic, lesson_name)
        return videos.result() + links.result()
