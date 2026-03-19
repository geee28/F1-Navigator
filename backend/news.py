"""
F-1 Policy News — fetches recent news via DuckDuckGo, filters and structures
via OpenAI GPT-4o-mini, caches in memory for 1 hour.
"""

import json
import os
from datetime import datetime, timedelta
from typing import Any

from openai import AsyncOpenAI

# ── In-memory cache ───────────────────────────────────────────────────────────
_cache: dict[str, Any] = {"articles": None, "fetched_at": None}
CACHE_TTL = timedelta(hours=1)

# ── Search queries covering all F-1 relevant topics ───────────────────────────
SEARCH_QUERIES = [
    "F1 student visa OPT authorization 2025 2026 USCIS update",
    "STEM OPT extension F1 student 2025 2026 DHS rule",
    "CPT curricular practical training F1 student 2025 2026",
    "H-1B lottery cap registration F1 student 2025 2026",
    "USCIS F1 student immigration policy change 2025 2026",
    "SEVIS F1 student visa fee rule update 2026",
    "on campus employment F1 student international 2025 2026",
]


def _fetch_ddg_sync() -> list[dict]:
    """Run DuckDuckGo searches synchronously (called via executor)."""
    from ddgs import DDGS

    raw: list[dict] = []
    seen_urls: set[str] = set()

    with DDGS() as ddgs:
        for query in SEARCH_QUERIES:
            try:
                results = ddgs.news(query, max_results=5, timelimit="m")
                for r in results:
                    url = r.get("url", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        raw.append(r)
            except Exception:
                continue

    return raw


async def fetch_f1_news() -> list[dict]:
    """Return structured, filtered F-1 news articles sorted newest-first."""

    # Serve from cache if fresh
    if (
        _cache["articles"] is not None
        and _cache["fetched_at"] is not None
        and datetime.now() - _cache["fetched_at"] < CACHE_TTL
    ):
        return _cache["articles"]

    import asyncio

    try:
        loop = asyncio.get_event_loop()
        raw = await loop.run_in_executor(None, _fetch_ddg_sync)
    except Exception:
        return _cache["articles"] or []

    if not raw:
        return _cache["articles"] or []

    if not raw:
        return _cache["articles"] or []

    # Truncate body to keep prompt manageable
    articles_payload = json.dumps([
        {
            "title":  a.get("title", ""),
            "url":    a.get("url", ""),
            "date":   a.get("date", ""),
            "source": a.get("source", ""),
            "body":   (a.get("body") or "")[:400],
        }
        for a in raw[:30]
    ])

    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    try:
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            max_tokens=3000,
            temperature=0,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a news curator for F-1 international students in the US. "
                        "From the provided articles, keep ONLY those directly relevant to: "
                        "F-1 visa, OPT, STEM OPT, CPT, H-1B lottery, SEVIS, on-campus jobs, "
                        "or US immigration policy affecting international students. "
                        "Return a JSON object with key 'articles' containing an array sorted "
                        "newest-first. Each element must have exactly these keys:\n"
                        "  title (string), date (YYYY-MM-DD or original string), "
                        "source (string), sourceUrl (string), "
                        "summary (2-3 sentence plain-English summary), "
                        "affectedGroups (array, subset of: "
                        '["all-f1","opt","stem-opt","cpt","h1b"]), '
                        'impact ("positive"|"negative"|"neutral"), '
                        "keyPoints (array of 2-4 strings), "
                        "actionRequired (string or null)."
                    ),
                },
                {"role": "user", "content": articles_payload},
            ],
        )

        result = json.loads(resp.choices[0].message.content)
        articles: list[dict] = result.get("articles", [])

        # Add sequential ids
        for i, a in enumerate(articles):
            a["id"] = str(i + 1)

        _cache["articles"]   = articles
        _cache["fetched_at"] = datetime.now()
        return articles

    except Exception:
        return _cache["articles"] or []
