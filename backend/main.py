"""
F1 Navigator — FastAPI backend
Endpoints consumed by the Next.js frontend via /api/* rewrites.
"""

import json
import os
from contextlib import asynccontextmanager
from typing import Any, Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from auth import AuthHandler
from database import Database
from news import fetch_f1_news
from rag import hybrid_search, stream_chat

# ── App setup ─────────────────────────────────────────────────────────────────

db   = Database()
auth = AuthHandler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    yield
    await db.close()


app = FastAPI(title="F1 Navigator API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security          = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)

# ── Auth dependencies ──────────────────────────────────────────────────────────

async def current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    user_id = auth.decode_token(creds.credentials)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user_id


async def optional_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
) -> Optional[str]:
    if not creds:
        return None
    return auth.decode_token(creds.credentials)


# ── Request / response models ──────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: str
    password: str
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdate(BaseModel):
    name:             Optional[str] = None
    university:       Optional[str] = None
    major:            Optional[str] = None
    degree_level:     Optional[str] = None
    year_of_study:    Optional[str] = None
    visa_status:      Optional[str] = None
    country_of_origin: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


class DocumentUpload(BaseModel):
    name:      str
    doc_type:  str
    file_data: str   # base64 DataURL
    file_size: int


class MeetingCreate(BaseModel):
    name:           str
    email:          str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    topic:          str = "General Questions"
    details:        Optional[str] = None


# ── Auth endpoints ─────────────────────────────────────────────────────────────

@app.post("/api/auth/signup")
async def signup(req: SignupRequest):
    existing = await db.get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    pw_hash = auth.hash_password(req.password)
    user_id = await db.create_user(req.email, pw_hash)
    await db.create_profile(user_id, req.name)

    token   = auth.create_token(user_id)
    profile = await db.get_profile(user_id)
    return {"token": token, "user": {"id": user_id, "email": req.email, **profile}}


@app.post("/api/auth/login")
async def login(req: LoginRequest):
    user = await db.get_user_by_email(req.email)
    if not user or not auth.verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token   = auth.create_token(user["id"])
    profile = await db.get_profile(user["id"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], **profile}}


@app.get("/api/auth/me")
async def me(user_id: str = Depends(current_user)):
    user    = await db.get_user(user_id)
    profile = await db.get_profile(user_id)
    return {"id": user_id, "email": user["email"], **profile}


# ── Profile ────────────────────────────────────────────────────────────────────

@app.put("/api/profile")
async def update_profile(
    data: ProfileUpdate,
    user_id: str = Depends(current_user),
):
    await db.update_profile(user_id, data.model_dump(exclude_none=True))
    return await db.get_profile(user_id)


# ── Chat (streaming SSE) ───────────────────────────────────────────────────────

@app.post("/api/chat")
async def chat(req: ChatRequest, user_id: Optional[str] = Depends(optional_user)):
    profile = await db.get_profile(user_id) if user_id else {}

    async def generate():
        # Retrieve relevant chunks (runs in thread pool via asyncio — sync call)
        import asyncio

        loop   = asyncio.get_event_loop()
        chunks = await loop.run_in_executor(None, hybrid_search, req.message)

        if not chunks:
            yield (
                "data: "
                + json.dumps({"type": "error", "content": "No relevant documents found. Try rephrasing."})
                + "\n\n"
            )
            yield "data: [DONE]\n\n"
            return

        # Stream tokens
        async for token in stream_chat(req.message, chunks, profile, req.history):
            yield "data: " + json.dumps({"type": "token", "content": token}) + "\n\n"

        # Send sources after streaming finishes
        sources = [
            {
                "title":    c.title,
                "url":      c.source_url,
                "section":  c.section,
                "category": c.category_label,
            }
            for c in chunks
        ]
        yield "data: " + json.dumps({"type": "sources", "content": sources}) + "\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":    "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx buffering
        },
    )


# ── News ───────────────────────────────────────────────────────────────────────

@app.get("/api/news")
async def get_news():
    articles = await fetch_f1_news()
    return {"articles": articles}


# ── Documents ──────────────────────────────────────────────────────────────────

@app.get("/api/documents")
async def list_documents(user_id: str = Depends(current_user)):
    docs = await db.list_documents(user_id)
    return {"documents": docs}


@app.post("/api/documents")
async def upload_document(
    doc: DocumentUpload,
    user_id: str = Depends(current_user),
):
    doc_id = await db.save_document(user_id, doc.model_dump())
    return {"id": doc_id, **doc.model_dump()}


@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str, user_id: str = Depends(current_user)):
    await db.delete_document(user_id, doc_id)
    return {"success": True}


# ── Meetings ───────────────────────────────────────────────────────────────────

@app.get("/api/meetings")
async def list_meetings(user_id: str = Depends(current_user)):
    meetings = await db.list_meetings(user_id)
    return {"meetings": meetings}


@app.post("/api/meetings")
async def create_meeting(
    meeting: MeetingCreate,
    user_id: str = Depends(current_user),
):
    meeting_id = await db.create_meeting(user_id, meeting.model_dump())
    return {"id": meeting_id, **meeting.model_dump(), "status": "pending"}


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}
