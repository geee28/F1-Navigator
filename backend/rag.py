"""
RAG pipeline — async version for FastAPI streaming.
Extracted from f1_navigator.py, adapted for server use.
"""

import os
import re
import hashlib
from dataclasses import dataclass
from typing import AsyncGenerator

from openai import AsyncOpenAI, OpenAI
from pinecone import Pinecone
from rank_bm25 import BM25Okapi

# ── Config ────────────────────────────────────────────────────────────────────

PINECONE_INDEX  = os.getenv("PINECONE_INDEX_NAME", "edtech")
PINECONE_HOST   = os.getenv("PINECONE_HOST", "https://edtech-pfofxdz.svc.aped-4627-b74a.pinecone.io")
PINECONE_NS     = os.getenv("PINECONE_NAMESPACE", "")

EMBED_MODEL     = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-large")
CHAT_MODEL      = os.getenv("OPENAI_CHAT_MODEL",  "gpt-4o")

TOP_K_SEMANTIC  = int(os.getenv("TOP_K_SEMANTIC", "30"))
TOP_N_TO_LLM    = int(os.getenv("TOP_N_TO_LLM",   "7"))
SEMANTIC_WEIGHT = float(os.getenv("SEMANTIC_WEIGHT", "0.6"))
BM25_WEIGHT     = 1.0 - SEMANTIC_WEIGHT

# ── Singletons ────────────────────────────────────────────────────────────────

_sync_oai:  OpenAI | None      = None
_async_oai: AsyncOpenAI | None = None
_pc_index                       = None


def _sync_client() -> OpenAI:
    global _sync_oai
    if _sync_oai is None:
        _sync_oai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _sync_oai


def _async_client() -> AsyncOpenAI:
    global _async_oai
    if _async_oai is None:
        _async_oai = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _async_oai


def _index():
    global _pc_index
    if _pc_index is None:
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        _pc_index = pc.Index(name=PINECONE_INDEX, host=PINECONE_HOST)
    return _pc_index


# ── Data class ────────────────────────────────────────────────────────────────

@dataclass
class Chunk:
    id: str
    text: str
    title: str
    section: str
    source_url: str
    category: str
    category_label: str
    score: float = 0.0


# ── Retrieval ─────────────────────────────────────────────────────────────────

def get_embedding(text: str) -> list[float]:
    resp = _sync_client().embeddings.create(input=text, model=EMBED_MODEL)
    return resp.data[0].embedding


def semantic_search(query: str) -> list[Chunk]:
    vec    = get_embedding(query)
    kwargs = dict(vector=vec, top_k=TOP_K_SEMANTIC, include_metadata=True)
    if PINECONE_NS:
        kwargs["namespace"] = PINECONE_NS
    resp = _index().query(**kwargs)

    chunks = []
    for m in resp.matches:
        meta = m.metadata or {}
        chunks.append(Chunk(
            id             = m.id,
            text           = meta.get("text", ""),
            title          = meta.get("title", ""),
            section        = meta.get("section", ""),
            source_url     = meta.get("source_url", ""),
            category       = meta.get("category", ""),
            category_label = meta.get("category_label", ""),
            score          = float(m.score),
        ))
    return chunks


def _minmax(values: list[float]) -> list[float]:
    mn, mx = min(values), max(values)
    if mx == mn:
        return [0.0] * len(values)
    return [(v - mn) / (mx - mn) for v in values]


def deduplicate(chunks: list[Chunk]) -> list[Chunk]:
    seen_hashes:  set[str] = set()
    seen_url_sec: set[str] = set()
    unique: list[Chunk]    = []
    for c in chunks:
        h   = hashlib.md5(re.sub(r"\s+", " ", c.text).strip().lower().encode()).hexdigest()
        key = f"{c.source_url}||{c.section}"
        if h in seen_hashes or key in seen_url_sec:
            continue
        seen_hashes.add(h)
        seen_url_sec.add(key)
        unique.append(c)
    return unique


def hybrid_search(query: str) -> list[Chunk]:
    """Semantic search → BM25 rerank → deduplicate → top-N."""
    candidates = semantic_search(query)
    if not candidates:
        return []

    tokenized = [c.text.lower().split() for c in candidates]
    bm25      = BM25Okapi(tokenized)
    raw_bm25  = bm25.get_scores(query.lower().split()).tolist()

    sem_norm  = _minmax([c.score for c in candidates])
    bm25_norm = _minmax(raw_bm25)

    for i, chunk in enumerate(candidates):
        chunk.score = SEMANTIC_WEIGHT * sem_norm[i] + BM25_WEIGHT * bm25_norm[i]

    candidates.sort(key=lambda c: c.score, reverse=True)
    return deduplicate(candidates)[:TOP_N_TO_LLM]


# ── Prompt builders ───────────────────────────────────────────────────────────

def build_system_prompt(profile: dict) -> str:
    return f"""You are F1 Navigator, an expert on F-1 student visa, OPT, CPT, STEM OPT, and US immigration.

Student: {profile.get("name") or "Student"} | {profile.get("visa_status") or "F-1"} | \
{profile.get("major") or ""} {profile.get("degree_level") or ""} at {profile.get("university") or "university"}

## Rules
1. Answer ONLY from the provided documents. Never invent rules, dates, or procedures.
2. Be DIRECT — answer the question in detail. Answer every single question that the user asks in a single query.
3. Use bullet points when listing 3+ distinct items.
4. Use ⚠️ only for critical status-jeopardising warnings.
5. If documents lack the answer, DO NOT INVENT ANSWER. Say so and point to uscis.gov or their DSO.
6. Personalise when the student's profile is relevant.

## Format
- Lead with direct detailed answers.
- Follow with key details only if essential.
- Bold critical deadlines/numbers.
- ONLY ADD ANSWERS BASED ON THE DOCUMENTS.
- Do NOT add a Sources section — sources are handled separately.
"""


def build_user_message(query: str, chunks: list[Chunk]) -> str:
    docs = []
    for i, c in enumerate(chunks, 1):
        docs.append(
            f"### [Doc {i}] {c.title}\n"
            f"- **Category:** {c.category_label}\n"
            f"- **Section:** {c.section}\n"
            f"- **URL:** {c.source_url}\n\n"
            f"{c.text}"
        )
    return (
        "## Official F-1 Documentation (retrieved)\n\n"
        + "\n\n---\n\n".join(docs)
        + "\n\n---\n\n"
        "## Student Question\n\n"
        + query
        + "\n\n**Reminder:** Base your answer on the documents above and include the mandatory "
        "'Sources' section at the end."
    )


# ── Streaming chat ────────────────────────────────────────────────────────────

async def stream_chat(
    query: str,
    chunks: list[Chunk],
    profile: dict,
    history: list[dict],
) -> AsyncGenerator[str, None]:
    """Yield text tokens from GPT-4o, grounded in retrieved chunks."""
    messages = (
        [{"role": "system", "content": build_system_prompt(profile)}]
        + history[-16:]   # keep last 8 exchanges
        + [{"role": "user", "content": build_user_message(query, chunks)}]
    )

    stream = await _async_client().chat.completions.create(
        model       = CHAT_MODEL,
        messages    = messages,
        stream      = True,
        max_tokens  = 2048,
        temperature = 0.2,
    )

    async for event in stream:
        delta = event.choices[0].delta.content
        if delta:
            yield delta
