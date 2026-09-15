"""Real lesson images from Wikipedia and Wikimedia Commons, proven to load.

Replaces the Serper image search for generated lessons. Serper returned
whatever ranked, on whatever host, under whatever licence: images that 403'd
hotlinks within weeks, and keyword matches with nothing to do with the topic
("STRIDE" found a grave, "SIEM" butterflies photographed in Siem Reap).

Wikimedia fixes the three problems together. It allows hotlinking, its URLs
are stable, and every file carries an open licence. Search is anchored two ways
so that an ambiguous word does not win:

  1. Resolve the query to an English Wikipedia article and prefer the images
     that article uses -- people chose them to illustrate exactly this subject.
  2. Fall back to a Commons file search, accepting only a file whose name
     shares at least two words with the query.

Only drawings (SVG and PNG) are eligible, because the word-matching wrong hit
is almost always a photograph, and a candidate is kept only once its URL has
returned real image bytes.
"""

from __future__ import annotations

import logging
import re
from functools import lru_cache
from urllib.parse import urlparse, urlunparse

import httpx

logger = logging.getLogger(__name__)

WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"

#: Wikimedia's robot policy requires a named client with a way to reach it.
#: Anything else -- including a browser disguise -- is answered 403.
USER_AGENT = "REBYU-lesson-media/1.0 (https://rebyu.online)"

MIN_BYTES = 3000
THUMB_WIDTH = 1200
MIN_COMMONS_OVERLAP = 2
ALLOWED_EXTENSIONS = (".svg", ".png")

STOPWORDS = {
    "the", "a", "an", "of", "for", "and", "or", "to", "in", "on", "with", "vs",
    "how", "what", "why", "it", "its", "is", "are", "that", "this", "by", "from",
    "diagram", "chart", "model", "overview", "introduction", "example", "works",
    "process", "illustration", "infographic",
}

#: File names that are page chrome, not content.
JUNK = re.compile(
    r"(icon|logo|wiki|commons|edit|padlock|ambox|question book|crystal|nuvola|"
    r"symbol|flag of|stub|disambig|portal|emblem|barnstar|folder|magnify|"
    r"text document|merge|split arrows|red pencil|office building|access)",
    re.IGNORECASE,
)


def keywords(text: str | None) -> set[str]:
    return {word for word in re.findall(r"[a-z0-9]+", (text or "").lower())
            if len(word) > 2 and word not in STOPWORDS}


def _strip_tracking(url: str) -> str:
    parts = urlparse(url)
    return urlunparse(parts._replace(query="", fragment=""))


def _client() -> httpx.Client:
    return httpx.Client(
        timeout=20.0,
        follow_redirects=True,
        headers={"User-Agent": USER_AGENT,
                 "Accept": "image/avif,image/webp,image/svg+xml,image/*,*/*;q=0.8"},
    )


def _api(client: httpx.Client, endpoint: str, params: dict) -> dict:
    params = dict(params, action="query", format="json", formatversion="2")
    response = client.get(endpoint, params=params)
    if response.status_code != 200:
        logger.warning("Wikimedia API %s answered %s", endpoint, response.status_code)
        return {}
    return response.json()


def usable(page: dict) -> dict | None:
    """The candidate a Wikimedia page describes, or None when it is not a drawing."""
    title = page.get("title", "")
    if not title.lower().endswith(ALLOWED_EXTENSIONS):
        return None
    if JUNK.search(re.sub(r"[-_]", " ", title)):
        return None
    info = (page.get("imageinfo") or [{}])[0]
    url = info.get("thumburl") or info.get("url")
    if not url:
        return None
    return {"title": title, "url": _strip_tracking(url), "descriptionUrl": info.get("descriptionurl", "")}


def rank(candidates: list[dict], query_words: set[str], minimum: int) -> list[dict]:
    """Candidates sharing at least `minimum` words with the query, best first."""
    scored = []
    for candidate in candidates:
        overlap = len(query_words & keywords(candidate["title"]))
        if overlap >= min(minimum, len(query_words)) and overlap > 0:
            scored.append((overlap, candidate))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [candidate for _overlap, candidate in scored]


def _article_images(client: httpx.Client, query: str) -> tuple[str, list[dict]]:
    search = _api(client, WIKIPEDIA_API, {"list": "search", "srsearch": query, "srlimit": 1})
    hits = search.get("query", {}).get("search", [])
    if not hits:
        return "", []
    title = hits[0]["title"]
    data = _api(client, WIKIPEDIA_API, {
        "titles": title, "generator": "images", "gimlimit": 40,
        "prop": "imageinfo", "iiprop": "url|size", "iiurlwidth": THUMB_WIDTH,
    })
    pages = data.get("query", {}).get("pages", []) or []
    return title, [item for item in (usable(page) for page in pages) if item]


def _commons_images(client: httpx.Client, query: str) -> list[dict]:
    data = _api(client, COMMONS_API, {
        "generator": "search", "gsrsearch": "filetype:bitmap|drawing " + query,
        "gsrnamespace": 6, "gsrlimit": 20,
        "prop": "imageinfo", "iiprop": "url|size", "iiurlwidth": THUMB_WIDTH,
    })
    pages = data.get("query", {}).get("pages", []) or []
    return [item for item in (usable(page) for page in pages) if item]


def _loads_as_image(client: httpx.Client, url: str) -> bool:
    try:
        response = client.get(url)
    except httpx.HTTPError:
        return False
    content_type = response.headers.get("content-type", "").split(";")[0].strip()
    return response.status_code == 200 and content_type.startswith("image/") and len(response.content) > MIN_BYTES


@lru_cache(maxsize=512)
def find_image(query: str) -> dict | None:
    """A relevant Wikimedia image that loads, as {url, sourceUrl, sourceName}, or None.

    Never raises: a lookup that fails is a lesson that gets a drawn figure
    instead, not a lesson that is lost.
    """
    query_words = keywords(query)
    if not query_words:
        return None
    try:
        with _client() as client:
            article, article_images = _article_images(client, query)
            ordered = rank(article_images, query_words, minimum=1)
            ordered += rank(_commons_images(client, query), query_words, minimum=MIN_COMMONS_OVERLAP)
            seen = set()
            for candidate in ordered:
                if candidate["url"] in seen:
                    continue
                seen.add(candidate["url"])
                if not _loads_as_image(client, candidate["url"]):
                    continue
                source = candidate.get("descriptionUrl") or (
                    "https://en.wikipedia.org/wiki/" + article.replace(" ", "_") if article
                    else "https://commons.wikimedia.org/")
                return {"url": candidate["url"], "sourceUrl": source, "sourceName": "Wikimedia Commons"}
    except Exception as error:  # network, JSON, anything: fall back to a drawing
        logger.warning("Wikimedia image lookup for %r failed: %s", query, error)
    return None
