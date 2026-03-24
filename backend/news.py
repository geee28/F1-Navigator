"""
F-1 Policy News — fetches recent news via DuckDuckGo, filters and structures
via OpenAI GPT-4o-mini.

Cache strategy:
  - Persisted to disk (news_cache.json) so it survives server restarts.
  - Served instantly from cache on every request.
  - Background refresh triggered when cache is older than CACHE_TTL.
  - Only one background refresh runs at a time (_is_fetching flag).
"""

import asyncio
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from openai import AsyncOpenAI

# ── Cache config ───────────────────────────────────────────────────────────────
_CACHE_FILE = Path(__file__).parent / "news_cache.json"
_cache: dict[str, Any] = {"articles": None, "fetched_at": None}
CACHE_TTL   = timedelta(hours=6)
_is_fetching = False

# ── Search queries ─────────────────────────────────────────────────────────────
SEARCH_QUERIES = [
    "F1 student visa OPT authorization USCIS update 2026",
    "STEM OPT extension F1 student DHS rule 2026",
    "CPT curricular practical training F1 student 2026",
    "H-1B lottery cap registration F1 student 2026",
    "USCIS F1 student immigration policy change 2026",
    "SEVIS F1 student visa fee rule update 2026",
    "international student visa policy news 2026",
]


# ── Disk cache helpers ─────────────────────────────────────────────────────────

def _load_disk_cache() -> None:
    """Load persisted cache from disk into memory on startup."""
    try:
        if _CACHE_FILE.exists():
            data = json.loads(_CACHE_FILE.read_text(encoding="utf-8"))
            _cache["articles"]  = data.get("articles")
            raw_ts = data.get("fetched_at")
            if raw_ts:
                _cache["fetched_at"] = datetime.fromisoformat(raw_ts)
    except Exception:
        pass


def _save_disk_cache(articles: list) -> None:
    """Persist cache to disk so it survives server restarts."""
    try:
        _CACHE_FILE.write_text(
            json.dumps({"articles": articles, "fetched_at": datetime.now().isoformat()}),
            encoding="utf-8",
        )
    except Exception:
        pass


# Load from disk immediately when the module is imported
_load_disk_cache()


# ── DuckDuckGo fetch (sync, runs in thread executor) ─────────────────────────

def _fetch_ddg_sync() -> list[dict]:
    from ddgs import DDGS

    raw: list[dict] = []
    seen_urls: set[str] = set()

    with DDGS() as ddgs:
        for query in SEARCH_QUERIES:
            try:
                results = ddgs.news(query, max_results=10, timelimit="w")
                for r in results:
                    url = r.get("url", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        raw.append(r)
            except Exception:
                continue

    return raw


# ── Date parser ────────────────────────────────────────────────────────────────

def _parse_date(a: dict) -> datetime:
    raw = a.get("date", "")
    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return parsed.astimezone(timezone.utc).replace(tzinfo=None)
    except Exception:
        pass
    for fmt in ("%Y-%m-%d", "%B %d, %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(raw[:10], fmt)
        except Exception:
            continue
    return datetime.min


# ── Core fetch + structure ────────────────────────────────────────────────────

async def _do_fetch() -> None:
    """Fetch fresh articles, structure via OpenAI, update cache."""
    global _is_fetching
    if _is_fetching:
        return
    _is_fetching = True
    try:
        loop = asyncio.get_event_loop()
        raw = await asyncio.wait_for(
            loop.run_in_executor(None, _fetch_ddg_sync),
            timeout=30.0,
        )
        if not raw:
            return

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

        result      = json.loads(resp.choices[0].message.content)
        new_articles: list[dict] = result.get("articles", [])

        # Merge with existing cache so we never lose newer articles
        existing     = _cache["articles"] or []
        seen_urls    = {a.get("sourceUrl", "") for a in new_articles}
        merged       = new_articles + [a for a in existing if a.get("sourceUrl", "") not in seen_urls]
        merged.sort(key=_parse_date, reverse=True)

        # Keep the 25 most recent
        merged = merged[:25]
        for i, a in enumerate(merged):
            a["id"] = str(i + 1)

        _cache["articles"]   = merged
        _cache["fetched_at"] = datetime.now()
        _save_disk_cache(merged)

    except Exception:
        pass
    finally:
        _is_fetching = False


# ── Public API ────────────────────────────────────────────────────────────────

async def fetch_f1_news() -> list[dict]:
    """
    Always returns immediately.
    - If cache has data: return it, and trigger background refresh if stale.
    - If cache is empty (very first run ever): wait for fetch to complete.
    """
    has_data = _cache["articles"] is not None
    is_stale = (
        _cache["fetched_at"] is None
        or datetime.now() - _cache["fetched_at"] >= CACHE_TTL
    )

    if has_data:
        # Return cached data instantly; refresh in background if stale
        if is_stale:
            asyncio.create_task(_do_fetch())
        return _cache["articles"]

    # First-ever run — no disk cache either. Must wait.
    await _do_fetch()
    return _cache["articles"] or []


async def force_refresh() -> list[dict]:
    """Force an immediate re-fetch regardless of cache age. Waits for completion."""
    global _is_fetching
    _is_fetching = False  # reset in case a previous fetch got stuck
    await _do_fetch()
    return _cache["articles"] or []


async def warm_cache() -> None:
    """Called on server startup to pre-warm the cache if empty or stale."""
    has_data = _cache["articles"] is not None
    is_stale = (
        _cache["fetched_at"] is None
        or datetime.now() - _cache["fetched_at"] >= CACHE_TTL
    )
    if not has_data or is_stale:
        asyncio.create_task(_do_fetch())
