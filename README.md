# Backend Overview

This backend is built using **FastAPI**, with async-first design, streaming responses, and a hybrid RAG pipeline.


### 🚀 `How to run repo`
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```
#### Start the backend server
```bash
cd backend
uvicorn main:app --reload --port 8000
```

#### Start the frontend server
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at: http://localhost:3000

---

### 📁 `main.py`
- Defines all HTTP endpoints.
- Uses FastAPI **lifespan events** to initialize and close the database connection pool on startup/shutdown.
- The `/api/chat` endpoint returns a **StreamingResponse** that streams Server-Sent Events (SSE) as the LLM generates tokens in real time.

---

### 🗄️ `database.py`
- Manages the **PostgreSQL database (hosted on Render)** using `asyncpg`.
- Implements a connection pool for efficient concurrent access.
- Handles all SQL queries related to:
  - Users
  - Profiles
  - Documents
  - Meeting requests

- Pinecone - stored document chunks.

---

### 🔐 `auth.py`
- Handles authentication and authorization.
- Uses:
  - `bcrypt` for password hashing
  - `PyJWT` for token creation and verification

---

### 🤖 `How RAG Works`
The system uses a **hybrid Retrieval-Augmented Generation (RAG)** pipeline to answer user queries with high relevance and low hallucination.
### Flow
1. **Embed Query** - The user’s question is converted into a vector using `text-embedding-3-large`.
2. **Semantic Search** - The query vector is used to retrieve the **top 30 relevant chunks** from Pinecone.
3. **BM25 Re-ranking** - These 30 results are re-ranked using **BM25 keyword scoring** to prioritize exact term matches.
4. **Deduplication** - Duplicate chunks are removed using:
     - Text hash
     - (URL + section) key
5. **Context Selection** - The top **7 most relevant chunks** are selected as final context.
6. **LLM Generation** - The selected context + query is sent to `GPT-4o` with a concise system prompt.
7. **Streaming Response** - The response is streamed token-by-token using an `AsyncGenerator` via SSE.

---

### 📰 `How News Pipeline Works`
The system fetches and processes **real-time external news data** using a lightweight pipeline.
### Flow
1. **Parallel Searches** - Runs **7 DuckDuckGo searches** in parallel using a thread executor (to avoid blocking async execution).
2. **Aggregate Results** - Collects all results from the searches.
3. **Deduplicate** - Removes duplicate articles based on URL.
4. **LLM Filtering & Structuring** - Uses `gpt-4o-mini` to:
     - Filter irrelevant articles
     - Keep only domain-specific content (e.g., F1)
     - Structure the output

---