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


def youtube_search(query: str, max_results: int = 1) -> list[dict]:
    """Runs a YouTube Data API v3 search and returns the raw `items` results."""
    if not get_youtube_key():
        raise RuntimeError("YOUTUBE_API_KEY not configured.")

    with httpx.Client(timeout=_TIMEOUT) as client:
        response = client.get(
            "https://www.googleapis.com/youtube/v3/search",
            params={
                "part": "snippet",
                "q": query,
                "type": "video",
                "maxResults": max_results,
                "key": get_youtube_key(),
            },
        )
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
