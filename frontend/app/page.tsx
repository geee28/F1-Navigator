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
import { cn } from "@/lib/utils"
import {
  Newspaper, FileText, FolderOpen, Calendar, Plus,
  GraduationCap, MessageSquare, PanelLeftClose, PanelLeftOpen,
} from "lucide-react"

type ActiveView = "chat" | "flowchart" | "news" | "profile" | "documents" | "iso"

export interface ChatSession {
  id: string
  title: string
  createdAt: string
}

const SESSIONS_KEY = "f1nav-chat-sessions"

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

function HomeContent() {
  const { isAuthenticated, student } = useAuth()

  const [activeView,   setActiveView]   = useState<ActiveView>("chat")
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [newChatKey,   setNewChatKey]   = useState(0)
  const [sessions,     setSessions]     = useState<ChatSession[]>([])
  const [sidebarOpen,  setSidebarOpen]  = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSIONS_KEY)
      if (stored) setSessions(JSON.parse(stored))
    } catch {}
  }, [])

  const handleNewChat = () => {
    setActiveView("chat")
    setActiveChatId(null)
    setNewChatKey((k) => k + 1)
  }

  const handleSessionCreate = useCallback((id: string, title: string) => {
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
    setActiveView("chat")
    setActiveChatId(id)
  }

  if (!isAuthenticated) return <LoginSignup />

  const groups   = groupSessions(sessions)
  const chatKey  = activeChatId ?? `new-${newChatKey}`
  const initials = student?.name?.[0]?.toUpperCase() ?? "?"

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={cn(
        "flex flex-col border-r border-border/50 bg-muted/30 transition-all duration-200",
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
                  <button
                    key={session.id}
                    onClick={() => handleLoadSession(session.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      activeChatId === session.id && activeView === "chat"
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
                    <span className="truncate">{session.title}</span>
                  </button>
                ))}
              </div>
            )
          })}
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
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Top bar (sidebar toggle only) */}
        <div className="flex h-11 flex-shrink-0 items-center border-b border-border/40 px-3">
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
        {activeView === "chat" ? (
          <AIAssistant
            key={chatKey}
            sessionId={activeChatId}
            onSessionCreate={handleSessionCreate}
          />
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
            <div className="mx-auto max-w-4xl">
              {activeView === "flowchart"  && <WorkAuthorizationFlowchart graduationDate={student?.graduationDate} />}
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
