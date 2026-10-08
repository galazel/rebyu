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
MAX_LINKS = 3
MAX_TOTAL = 5
MAX_QUERY_WORDS = 12

_RESOURCE_NOUN = (
    r"(videos?|vids?|youtube|yt|clips?|links?|urls?|articles?|readings?|reads|"
    r"tutorials?|guides?|sources?|resources?|materials?|websites?|sites?|blogs?|"
    r"docs|documentation|references?|courses?|lectures?|podcasts?|books?)"
)

_REQUEST_WORD = (
    r"(give|show|send|share|recommend|suggest|find|search|look\s+up|get|got|need|want|"
    r"have|any|some|good|best|more|other|extra|additional|where|link\s+me|"
    r"pakita|pahingi|bigyan|hanapan|paki)"
)

_RESOURCE_PHRASE = re.compile(
    r"\b(further\s+reading|read(ing)?\s+more|learn\s+more|study\s+more|more\s+info(rmation)?|"
    r"where\s+can\s+i\s+(learn|read|study|watch|find)|something\s+to\s+(watch|read)|"
    r"(video|youtube)\s+(about|on|of|for)|(watch|read)\s+(about|up\s+on))\b",
    re.IGNORECASE,
)

_RESOURCE_REQUEST = re.compile(
    r"\b" + _REQUEST_WORD + r"\b(\W+\w+){0,5}?\W+" + _RESOURCE_NOUN + r"\b"
    r"|^\W*" + _RESOURCE_NOUN + r"\W*(pls|please|po)?\W*$",
    re.IGNORECASE,
)

_NOT_A_REQUEST = re.compile(
    r"\b(data[\s-]?links?|link[\s-]?(layer|state|local|aggregation|budget)|linked\s+lists?|"
    r"site[\s-]?to[\s-]?site|(web|remote|branch|cell|dr)\s+sites?|source\s+(code|address|port|ip)|"
    r"open[\s-]?source|resource\s+(allocation|records?|sharing|pool|management))\b",
    re.IGNORECASE,
)


CONFUSION = re.compile(
    r"(\bi\s*(still\s+)?(do\s*n[o']?t|dont|cannot|can'?t)\s+(understand|get\s+it|get\s+this|follow)|"
    r"\bstill\s+(confused|lost|don'?t\s+get)|\bi'?m\s+(confused|lost)|\bconfusing\b|"
    r"\bnot\s+clear\b|\bmakes?\s+no\s+sense\b|\bexplain\s+(it\s+)?again\b|\bhuh\b|"
    r"\bdi\s*ko\s+(gets|ma\s*gets|maintindihan)\b)",
    re.IGNORECASE,
)


def asks_for_resources(question: str | None) -> bool:
    """Whether the learner is asking for videos, links or reading -- not just
    using a word like "link" in a question about the lesson."""
    if not question:
        return False
    text = _NOT_A_REQUEST.sub(" ", question)
    return bool(_RESOURCE_PHRASE.search(text) or _RESOURCE_REQUEST.search(text))


def signals_confusion(message: str | None) -> bool:
    return bool(message and CONFUSION.search(message))


_FILLER = re.compile(
    r"\b(i'?m asking about this part of the lesson|explain( this)?( part of the lesson)?|"
    r"can you|could you|please|what is|what are|what does|how does|how do|why does|why do|"
    r"tell me( about)?|give me|show me|i (still )?(do ?n[o']?t|cannot|can'?t) (understand|get)( it| this)?|"
    r"i'?m (confused|lost)|again|simply|videos?|youtube|watch|links?|resources?|articles?|sites?|websites?|to|for|on|of|is|are|this|that|it|the|a|an|me|about|lesson|part)\b",
    re.IGNORECASE,
)


def concise(text: str | None, limit: int = 8) -> str:
    """The topic words of a question or quote: its first sentence, without
    filler, at most `limit` words."""
    text = " ".join((text or "").replace('"', " ").split())
    first = re.split(r"(?<=[.!?])\s", text, maxsplit=1)[0]
    words = _FILLER.sub(" ", first).split()
    return " ".join(words[:limit]).strip(" ,.;:?!-")


def _topic(query: str, lesson_name: str | None) -> str:
    query = concise(query, MAX_QUERY_WORDS)
    lesson = " ".join((lesson_name or "").split())
    if lesson and lesson.lower() not in query.lower():
        query = f"{lesson} {query}".strip()
    return " ".join(query.split()[:MAX_QUERY_WORDS]) or lesson


def _videos(topic: str, limit: int = MAX_VIDEOS) -> list[dict]:
    try:
        items = youtube_search(topic, max_results=limit)
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


_WIKI_HEADERS = {"User-Agent": "REBYU-AI-Tutor/1.0 (educational review platform; contact via rebyu.app)"}


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


def _links(topic: str, lesson_name: str | None = None, limit: int = MAX_LINKS) -> list[dict]:
    try:
        results = serper_search(topic, num=8)
    except Exception as error:  # noqa: BLE001 -- extras, never the answer
        logger.warning("Tutor link search failed (%s); falling back to Wikipedia", error)
        return _wikipedia(lesson_name or topic, limit)
    links, seen = [], set()
    for result in results:
        url = result.get("link") or ""
        host = urlparse(url).netloc.lower().removeprefix("www.")
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
        if len(links) >= limit:
            break
    return links or _wikipedia(lesson_name or topic, limit)


def find_resources(query: str, lesson_name: str | None) -> list[dict]:
    """Videos then links for `query`, scoped to the lesson. Blocking (HTTP);
    callers on the event loop run it in a thread.

    Each kind stands in for the other: no videos means more reading, no
    reading means more videos -- the learner asked for help and gets as much
    of it as there is. A focused video search that finds nothing is retried on
    the lesson as a whole before giving up on videos.
    """
    topic = _topic(query, lesson_name)
    if not topic:
        return []
    with ThreadPoolExecutor(max_workers=2) as pool:
        videos_job = pool.submit(_videos, topic, MAX_TOTAL)
        links_job = pool.submit(_links, topic, lesson_name, MAX_TOTAL)
        videos, links = videos_job.result(), links_job.result()
    if not videos and lesson_name and topic != lesson_name:
        videos = _videos(f"{lesson_name} explained", MAX_TOTAL)
    if videos and links:
        return videos[:MAX_VIDEOS] + links[:MAX_LINKS]
    return (videos or links)[:MAX_TOTAL]
