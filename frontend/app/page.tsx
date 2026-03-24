"use client"

import { useState, useEffect, useCallback } from "react"
import { WorkAuthorizationFlowchart } from "@/components/work-authorization-flowchart"
import { PolicyNews } from "@/components/policy-news"
import { AuthProvider, useAuth } from "@/components/auth-context"
import { LoginSignup } from "@/components/login-signup"
import { StudentProfile } from "@/components/student-profile"
import { DocumentStorage } from "@/components/document-storage"
import { MeetingScheduler } from "@/components/meeting-scheduler"
import { AIAssistant } from "@/components/ai-assistant"
import { I765Form } from "@/components/i765-form"
import { cn } from "@/lib/utils"
import {
  Newspaper, FileText, FolderOpen, Calendar, Plus,
  GraduationCap, MessageSquare, PanelLeftClose, PanelLeftOpen, Trash2,
} from "lucide-react"

type ActiveView = "chat" | "flowchart" | "news" | "profile" | "documents" | "iso" | "i765"

export interface ChatSession {
  id: string
  title: string
  createdAt: string
}

const SESSIONS_KEY = "f1nav-chat-sessions"

const ragSources = [
  { label: "USCIS",               url: "https://www.uscis.gov"            },
  { label: "ICE / SEVP",          url: "https://www.ice.gov/sevis"        },
  { label: "Study in the States", url: "https://studyinthestates.dhs.gov" },
]

const featureNavItems = [
  { id: "flowchart" as ActiveView, icon: FileText,  label: "Process Guides"  },
  { id: "news"      as ActiveView, icon: Newspaper,  label: "Policy Updates"  },
  { id: "documents" as ActiveView, icon: FolderOpen, label: "Documents"       },
  { id: "iso"       as ActiveView, icon: Calendar,   label: "ISO Meeting"     },
]

function groupSessions(sessions: ChatSession[]) {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yday  = new Date(today); yday.setDate(yday.getDate() - 1)
  const week  = new Date(today); week.setDate(week.getDate() - 7)

  const groups: Record<string, ChatSession[]> = {
    Today: [], Yesterday: [], "Previous 7 days": [], Older: [],
  }
  for (const s of sessions) {
    const d = new Date(s.createdAt)
    if      (d >= today) groups["Today"].push(s)
    else if (d >= yday)  groups["Yesterday"].push(s)
    else if (d >= week)  groups["Previous 7 days"].push(s)
    else                 groups["Older"].push(s)
  }
  return groups
}

interface ChatInstance { mountKey: string; sessionId: string | null }

function HomeContent() {
  const { isAuthenticated, student } = useAuth()

  const [activeView,     setActiveView]     = useState<ActiveView>("chat")
  const [sessions,       setSessions]       = useState<ChatSession[]>([])
  const [sidebarOpen,    setSidebarOpen]    = useState(true)
  const [i765Type,       setI765Type]       = useState<"opt" | "stem-opt">("opt")

  // Each chat gets a stable mountKey so the component never unmounts when switching,
  // allowing background streams to complete while the user views other chats.
  const [chatInstances,  setChatInstances]  = useState<ChatInstance[]>([{ mountKey: "init", sessionId: null }])
  const [activeMountKey, setActiveMountKey] = useState<string>("init")

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSIONS_KEY)
      if (stored) setSessions(JSON.parse(stored))
    } catch {}
  }, [])

  const handleNewChat = () => {
    const mountKey = `new-${Date.now()}`
    setChatInstances((prev) => [...prev, { mountKey, sessionId: null }])
    setActiveMountKey(mountKey)
    setActiveView("chat")
  }

  const handleSessionCreate = useCallback((mountKey: string, id: string, title: string) => {
    setChatInstances((prev) =>
      prev.map((i) => (i.mountKey === mountKey ? { ...i, sessionId: id } : i))
    )
    setSessions((prev) => {
      const next = [
        { id, title, createdAt: new Date().toISOString() },
        ...prev.filter((s) => s.id !== id),
      ]
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const handleLoadSession = (id: string) => {
    const existing = chatInstances.find((i) => i.sessionId === id)
    if (existing) {
      setActiveMountKey(existing.mountKey)
    } else {
      const mountKey = `inst-${id}`
      setChatInstances((prev) => [...prev, { mountKey, sessionId: id }])
      setActiveMountKey(mountKey)
    }
    setActiveView("chat")
  }

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(next))
      return next
    })
    localStorage.removeItem(`f1nav-session-${id}`)

    const deletedInst = chatInstances.find((i) => i.sessionId === id)
    const remaining   = chatInstances.filter((i) => i.sessionId !== id)

    if (deletedInst?.mountKey === activeMountKey) {
      const mk = remaining.length > 0 ? remaining[0].mountKey : `new-${Date.now()}`
      setActiveMountKey(mk)
      setActiveView("chat")
      if (remaining.length === 0) {
        setChatInstances([{ mountKey: mk, sessionId: null }])
        return
      }
    }
    setChatInstances(remaining.length > 0 ? remaining : [{ mountKey: `new-${Date.now()}`, sessionId: null }])
  }

  if (!isAuthenticated) return <LoginSignup />

  const groups      = groupSessions(sessions)
  const initials    = student?.name?.[0]?.toUpperCase() ?? "?"
  // Derive activeChatId for sidebar highlighting
  const activeChatId = chatInstances.find((i) => i.mountKey === activeMountKey)?.sessionId ?? null

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={cn(
        "flex flex-col border-r border-border/50 bg-muted/30 transition-all duration-200 print:hidden",
        sidebarOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
      )}>

        {/* Brand */}
        <div className="flex h-14 flex-shrink-0 items-center gap-2.5 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">F1 Navigator</span>
        </div>

        {/* New chat */}
        <div className="px-2 pb-1">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            New chat
          </button>
        </div>

        {/* Tools */}
        <div className="px-2">
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Tools
          </p>
          {featureNavItems.map((item) => {
            const Icon    = item.icon
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Chat history */}
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
          {Object.entries(groups).map(([label, list]) => {
            if (!list.length) return null
            return (
              <div key={label} className="mb-3">
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  {label}
                </p>
                {list.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      activeChatId === session.id && activeView === "chat"
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <button
                      onClick={() => handleLoadSession(session.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
                      <span className="truncate">{session.title}</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      className="invisible flex-shrink-0 rounded p-0.5 opacity-50 hover:opacity-100 group-hover:visible"
                      title="Delete chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Sources */}
        <div className="border-t border-border/40 px-4 py-2">
          <p className="mb-1 text-[9px] font-medium uppercase tracking-widest text-muted-foreground/40">
            Sources
          </p>
          <div className="flex flex-col gap-0.5">
            {ragSources.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors truncate"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* Profile */}
        <div className="border-t border-border/40 p-2">
          <button
            onClick={() => setActiveView("profile")}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              activeView === "profile"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-foreground">{student?.name || "Profile"}</p>
              <p className="truncate text-xs text-muted-foreground">{student?.email}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden print:overflow-visible">

        {/* Top bar (sidebar toggle only) */}
        <div className="flex h-11 flex-shrink-0 items-center border-b border-border/40 px-3 print:hidden">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen
              ? <PanelLeftClose className="h-4 w-4" />
              : <PanelLeftOpen  className="h-4 w-4" />}
          </button>
          {activeView !== "chat" && (
            <span className="ml-2 text-sm font-medium text-muted-foreground">
              {featureNavItems.find((i) => i.id === activeView)?.label ?? "Profile"}
            </span>
          )}
        </div>

        {/* Content */}

        {/* Chat instances — always mounted so background streams keep running */}
        {chatInstances.map((inst) => (
          <div
            key={inst.mountKey}
            className={activeView === "chat" && inst.mountKey === activeMountKey
              ? "flex flex-1 flex-col h-full"
              : "hidden"}
          >
            <AIAssistant
              sessionId={inst.sessionId}
              onSessionCreate={(sid, title) => handleSessionCreate(inst.mountKey, sid, title)}
            />
          </div>
        ))}

        {activeView === "i765" && (
          <I765Form
            formType={i765Type}
            onBack={() => setActiveView("flowchart")}
          />
        )}

        {activeView !== "chat" && activeView !== "i765" && (
          <div className="flex-1 overflow-y-auto px-6 py-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
            <div className="mx-auto max-w-4xl">
              {activeView === "flowchart"  && (
                <WorkAuthorizationFlowchart
                  graduationDate={student?.graduationDate}
                  onOpenI765={(type) => { setI765Type(type); setActiveView("i765") }}
                />
              )}
              {activeView === "news"       && <PolicyNews />}
              {activeView === "profile"    && <StudentProfile />}
              {activeView === "documents"  && <DocumentStorage />}
              {activeView === "iso"        && <MeetingScheduler />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  )
}
