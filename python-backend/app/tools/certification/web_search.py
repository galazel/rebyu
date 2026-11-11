"""Shared, deduplicated web-search helpers for the certification/lesson tool
files. Uses httpx (sync client) instead of `requests` for a more modern,
timeout-safe HTTP client; kept synchronous because the agents that bind these
tools are still invoked via `.invoke()` (async-only tools cannot be called
synchronously in this LangChain version)."""

import httpx

from app.utils.helpers import get_serper_key, get_youtube_key

_TIMEOUT = httpx.Timeout(10.0, connect=5.0)


def serper_search(query: str, num: int = 5) -> list[dict]:
    """Runs a Serper.dev web search and returns the raw `organic` results."""
    if not get_serper_key():
        raise RuntimeError("SERPER_API_KEY not configured.")

    with httpx.Client(timeout=_TIMEOUT) as client:
        response = client.post(
            "https://google.serper.dev/search",
            json={"q": query, "num": num},
            headers={"X-API-KEY": get_serper_key(), "Content-Type": "application/json"},
        )
    response.raise_for_status()
    return response.json().get("organic", [])


def serper_image_search(query: str, num: int = 1) -> list[dict]:
    """Runs a Serper.dev image search and returns the raw `images` results."""
    if not get_serper_key():
        raise RuntimeError("SERPER_API_KEY not configured.")

    with httpx.Client(timeout=_TIMEOUT) as client:
        response = client.post(
            "https://google.serper.dev/images",
            json={"q": query, "num": num},
            headers={"X-API-KEY": get_serper_key(), "Content-Type": "application/json"},
        )
    response.raise_for_status()
    return response.json().get("images", [])


def youtube_search(query: str, max_results: int = 1, *, safe: bool = False) -> list[dict]:
    """Runs a YouTube Data API v3 search and returns the raw `items` results.
    ``safe`` adds strict SafeSearch and English relevance, for results shown to learners."""
    if not get_youtube_key():
        raise RuntimeError("YOUTUBE_API_KEY not configured.")

    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": max_results,
        "key": get_youtube_key(),
    }
    if safe:
        params.update(safeSearch="strict", relevanceLanguage="en")
    with httpx.Client(timeout=_TIMEOUT) as client:
        response = client.get("https://www.googleapis.com/youtube/v3/search", params=params)
    response.raise_for_status()
    return response.json().get("items", [])


def format_organic_results(results: list[dict]) -> str:
    """Formats Serper `organic` results into the Title/Snippet/Source block every search tool returns."""
    if not results:
        return ""
    blocks = [
        f"Title: {item.get('title', '')}\nSnippet: {item.get('snippet', '')}\nSource: {item.get('link', '')}"
        for item in results
    ]
    return "\n\n---\n\n".join(blocks)


_DDG_HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"),
}
_DDG_RESULT = None


def duckduckgo_search(query: str, num: int = 10) -> list[dict]:
    """Keyless web search (DuckDuckGo's HTML endpoint), in Serper's `organic` shape:
    [{title, link, snippet}]. The fallback when Serper has no key or no credit left.
    Ads are skipped; links are unwrapped from DuckDuckGo's redirect."""
    import html as html_lib
    import re
    from urllib.parse import parse_qs, urlparse

    global _DDG_RESULT
    if _DDG_RESULT is None:
        _DDG_RESULT = re.compile(
            r'class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>'
            r'(?:.*?class="result__snippet"[^>]*>(.*?)</a>)?',
            re.DOTALL,
        )
    with httpx.Client(timeout=_TIMEOUT, headers=_DDG_HEADERS, follow_redirects=True) as client:
        response = client.get("https://html.duckduckgo.com/html/", params={"q": query})
    response.raise_for_status()

    def text(fragment: str | None) -> str:
        return " ".join(html_lib.unescape(re.sub(r"<[^>]+>", "", fragment or "")).split())

    results: list[dict] = []
    for href, title, snippet in _DDG_RESULT.findall(response.text):
        href = html_lib.unescape(href)
        if "duckduckgo.com/y.js" in href:  # sponsored result
            continue
        if href.startswith("//"):
            href = "https:" + href
        target = parse_qs(urlparse(href).query).get("uddg", [href])[0]
        if not target.startswith(("https://", "http://")):
            continue
        results.append({"title": text(title), "link": target, "snippet": text(snippet)})
        if len(results) >= num:
            break
    return results


import threading as _threading

_DDG_LOCK = _threading.Lock()
_DDG_MIN_GAP = 2.0
_DDG_LAST_CALL = 0.0


def duckduckgo_image_search(query: str, num: int = 10) -> list[dict]:
    """Keyless image search (DuckDuckGo), in Serper's `images` shape:
    [{imageUrl, title, link, source, imageWidth, imageHeight}]. The fallback when
    Serper has no key or no credit. DuckDuckGo needs a per-query token (vqd) from
    its search page and the headers its own page sends, or it answers 202."""
    import re
    import time
    from urllib.parse import urlparse

    global _DDG_LAST_CALL
    with _DDG_LOCK:  # one at a time, at most one every _DDG_MIN_GAP seconds
        wait = _DDG_LAST_CALL + _DDG_MIN_GAP - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        _DDG_LAST_CALL = time.monotonic()
    with httpx.Client(timeout=_TIMEOUT, headers={**_DDG_HEADERS, "Accept-Language": "en-US,en;q=0.9"},
                      follow_redirects=True) as client:
        page = client.post("https://duckduckgo.com/", data={"q": query})
        page.raise_for_status()
        token = re.search(r"vqd=[\"']?([\d-]+)", page.text)
        if not token:
            raise RuntimeError("DuckDuckGo did not return a search token")
        response = None
        for attempt in range(3):
            response = client.get(
                "https://duckduckgo.com/i.js",
                params={"l": "wt-wt", "o": "json", "q": query, "vqd": token.group(1), "f": ",,,,,", "p": "1"},
                headers={
                    "Referer": "https://duckduckgo.com/",
                    "Accept": "application/json, text/javascript, */*; q=0.01",
                    "X-Requested-With": "XMLHttpRequest",
                    "Sec-Fetch-Mode": "cors", "Sec-Fetch-Site": "same-origin", "Sec-Fetch-Dest": "empty",
                },
            )
            if response.status_code == 200:
                break
            time.sleep(1.5 * (attempt + 1))
        response.raise_for_status()
        if response.status_code != 200:
            raise RuntimeError(f"DuckDuckGo image search answered {response.status_code}")
    results = []
    for item in (response.json().get("results") or [])[:num]:
        image = item.get("image") or ""
        if not image.startswith(("https://", "http://")):
            continue
        results.append({
            "imageUrl": image,
            "title": item.get("title") or "",
            "link": item.get("url") or "",
            # `source` is the engine behind DuckDuckGo ("Bing"); credit the page's site instead.
            "source": urlparse(item.get("url") or "").netloc.removeprefix("www."),
            "imageWidth": item.get("width"),
            "imageHeight": item.get("height"),
        })
    return results


def bing_image_search(query: str, num: int = 10) -> list[dict]:
    """Keyless image search (Bing's image results page), in Serper's `images` shape.
    One request, no token, SafeSearch strict. Each result's `m` attribute is JSON with
    the image URL (murl), the page it is on (purl) and its title (t)."""
    import html as html_lib
    import json
    import re
    from urllib.parse import urlparse

    with httpx.Client(timeout=_TIMEOUT, headers={**_DDG_HEADERS, "Accept-Language": "en-US,en;q=0.9"},
                      follow_redirects=True) as client:
        response = client.get("https://www.bing.com/images/async",
                              params={"q": query, "first": 0, "count": max(num, 10), "mmasync": 1, "adlt": "strict"})
    response.raise_for_status()
    results = []
    for raw in re.findall(r'class="iusc"[^>]*\sm="([^"]+)"', response.text):
        try:
            item = json.loads(html_lib.unescape(raw))
        except ValueError:
            continue
        image, page = item.get("murl") or "", item.get("purl") or ""
        if not image.startswith(("https://", "http://")):
            continue
        results.append({
            "imageUrl": image,
            "title": item.get("t") or "",
            "link": page,
            "source": urlparse(page).netloc.removeprefix("www."),
        })
        if len(results) >= num:
            break
    return results
