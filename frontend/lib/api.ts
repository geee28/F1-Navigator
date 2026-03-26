/**
 * API client — all requests go to /api/* which Next.js rewrites
 * to the FastAPI backend (see next.config.mjs).
 */

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("f1_token")
}

function authHeaders(): HeadersInit {
  const token = getToken()
  const base: HeadersInit = { "Content-Type": "application/json" }
  return token ? { ...base, Authorization: `Bearer ${token}` } : base
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers ?? {}) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Request failed" }))
    throw new Error(body.detail ?? "Request failed")
  }
  return res.json() as Promise<T>
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  signup: (email: string, password: string, name: string) =>
    request<{ token: string; user: UserData }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: UserData }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<UserData>("/api/auth/me"),
}

// ── Profile ───────────────────────────────────────────────────────────────────

export const profileApi = {
  update: (data: Partial<ProfileData>) =>
    request<ProfileData>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
}

// ── Progress (completed steps) ────────────────────────────────────────────────

export const progressApi = {
  get: () => request<{ steps: string[] }>("/api/progress"),

  update: (steps: string[]) =>
    request<{ steps: string[] }>("/api/progress", {
      method: "PUT",
      body: JSON.stringify({ steps }),
    }),
}

// ── Documents ─────────────────────────────────────────────────────────────────

export const documentsApi = {
  list: () => request<{ documents: DocumentRecord[] }>("/api/documents"),

  upload: (data: {
    name: string
    doc_type: string
    file_data: string
    file_size: number
  }) =>
    request<DocumentRecord>("/api/documents", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/api/documents/${id}`, { method: "DELETE" }),
}

// ── Meetings ──────────────────────────────────────────────────────────────────

export const meetingsApi = {
  list: () => request<{ meetings: MeetingRecord[] }>("/api/meetings"),

  create: (data: {
    name: string
    email: string
    preferred_date?: string
    preferred_time?: string
    topic: string
    details?: string
  }) =>
    request<MeetingRecord>("/api/meetings", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationsApi = {
  get: () =>
    request<{ guides: string[] }>("/api/notifications"),

  update: (guides: string[]) =>
    request<{ guides: string[] }>("/api/notifications", {
      method: "PUT",
      body: JSON.stringify({ guides }),
    }),
}

// ── News ──────────────────────────────────────────────────────────────────────

export const newsApi = {
  get:     () => request<{ articles: NewsArticle[] }>("/api/news"),
  refresh: () => request<{ status: string }>("/api/news/refresh", { method: "POST" }),
}

// ── Chat (streaming SSE) ──────────────────────────────────────────────────────

export type ChatEvent =
  | { type: "token";   content: string }
  | { type: "sources"; content: SourceItem[] }
  | { type: "error";   content: string }

export interface SourceItem {
  title:    string
  url:      string
  section:  string
  category: string
}

export async function* chatStream(
  message:   string,
  history:   { role: string; content: string }[],
  sessionId: string | null = null,
): AsyncGenerator<ChatEvent> {
  const token = getToken()
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, history, session_id: sessionId }),
  })

  if (!res.ok) {
    throw new Error("Chat request failed")
  }

  const reader  = res.body!.getReader()
  const decoder = new TextDecoder()
  let   buffer  = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const raw = line.slice(6)
      if (raw === "[DONE]") return
      try {
        yield JSON.parse(raw) as ChatEvent
      } catch {
        // skip malformed line
      }
    }
  }
}

// ── Shared types ──────────────────────────────────────────────────────────────

export interface UserData {
  id:                      string
  email:                   string
  name?:                   string
  university?:             string
  major?:                  string
  degree_level?:           string
  year_of_study?:          string
  visa_status?:            string
  country_of_origin?:      string
  country_of_citizenship?: string
  graduation_date?:        string
  middle_name?:            string
  date_of_birth?:          string
  birth_city?:             string
  birth_country?:          string
  sex?:                    string
  marital_status?:         string
  phone_number?:           string
  mailing_street?:         string
  mailing_apt?:            string
  mailing_city?:           string
  mailing_state?:          string
  mailing_zip?:            string
  sevis_number?:           string
}

export interface ProfileData {
  name?:                   string
  university?:             string
  major?:                  string
  degree_level?:           string
  year_of_study?:          string
  visa_status?:            string
  country_of_origin?:      string
  country_of_citizenship?: string
  graduation_date?:        string
  middle_name?:            string
  date_of_birth?:          string
  birth_city?:             string
  birth_country?:          string
  sex?:                    string
  marital_status?:         string
  phone_number?:           string
  mailing_street?:         string
  mailing_apt?:            string
  mailing_city?:           string
  mailing_state?:          string
  mailing_zip?:            string
  sevis_number?:           string
}

export interface DocumentRecord {
  id:          string
  name:        string
  doc_type:    string
  file_data?:  string   // base64 DataURL
  file_size:   number
  uploaded_at: string
}

export interface MeetingRecord {
  id:             string
  name:           string
  email:          string
  preferred_date?: string
  preferred_time?: string
  topic:          string
  details?:       string
  status:         "pending" | "confirmed"
  created_at?:    string
}

export interface NewsArticle {
  id:             string
  title:          string
  date:           string
  source:         string
  sourceUrl:      string
  summary:        string
  affectedGroups: string[]
  impact:         "positive" | "negative" | "neutral"
  keyPoints:      string[]
  actionRequired?: string
  deadline?:      string
}
