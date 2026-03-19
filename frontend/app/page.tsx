"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { WorkAuthorizationFlowchart } from "@/components/work-authorization-flowchart"
import { AIAssistant } from "@/components/ai-assistant"
import { PolicyNews } from "@/components/policy-news"
import { AuthProvider, useAuth } from "@/components/auth-context"
import { LoginSignup } from "@/components/login-signup"
import { StudentProfile } from "@/components/student-profile"
import { DocumentStorage } from "@/components/document-storage"
import { MeetingScheduler } from "@/components/meeting-scheduler"
import { cn } from "@/lib/utils"
import {
  Bot,
  Newspaper,
  ChevronRight,
  FileText,
  User,
  FolderOpen,
  Calendar,
} from "lucide-react"

type ActiveView = "flowchart" | "assistant" | "news" | "profile" | "documents" | "iso"

const navItems = [
  { id: "flowchart" as ActiveView, icon: FileText,  label: "Process Guides" },
  { id: "assistant" as ActiveView, icon: Bot,        label: "AI Assistant"   },
  { id: "news"      as ActiveView, icon: Newspaper,  label: "Policy Updates" },
  { id: "profile"   as ActiveView, icon: User,       label: "My Profile"     },
  { id: "documents" as ActiveView, icon: FolderOpen, label: "Documents"      },
  { id: "iso"       as ActiveView, icon: Calendar,   label: "ISO Meeting"    },
]

function HomeContent() {
  const { isAuthenticated } = useAuth()
  const [activeView, setActiveView] = useState<ActiveView>("flowchart")

  if (!isAuthenticated) return <LoginSignup />

  const isChat = activeView === "assistant"

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header />

      <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <aside className="hidden w-52 flex-shrink-0 py-6 pl-4 sm:pl-6 lg:pl-8 lg:flex lg:flex-col">
            {/* Nav */}
            <nav className="space-y-0.5">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Navigation
              </p>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeView === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-primary")} />
                    <span className={cn("text-sm font-medium", isActive && "text-primary")}>{item.label}</span>
                    {isActive && <ChevronRight className="ml-auto h-3 w-3 flex-shrink-0 text-primary" />}
                  </button>
                )
              })}
            </nav>

            {/* Official links */}
            <div className="mt-4 rounded-lg border border-border/50 bg-card p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Official Links
              </p>
              <ul className="space-y-1.5">
                {[
                  { label: "USCIS.gov",           href: "https://www.uscis.gov" },
                  { label: "Study in the States", href: "https://studyinthestates.dhs.gov" },
                  { label: "SEVIS Help Hub",       href: "https://www.ice.gov/sevis" },
                  { label: "E-Verify",             href: "https://www.e-verify.gov" },
                ].map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      <span className="h-1 w-1 flex-shrink-0 rounded-full bg-border" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <p className="mt-auto pt-4 px-1 text-[10px] leading-relaxed text-muted-foreground/60">
              © 2026 F1 Navigator. For educational purposes only — not legal advice. Always consult your DSO and immigration attorney.
            </p>
          </aside>

          {/* ── Main content ─────────────────────────────────────────────── */}
          <main className={cn(
            "min-w-0 flex-1",
            isChat
              ? "overflow-hidden flex flex-col"
              : "overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
          )}>
            {/* Mobile tab bar */}
            <div className={cn("flex gap-2 overflow-x-auto pb-1 lg:hidden", isChat ? "flex-shrink-0 py-3 px-4" : "mb-6 px-4 pt-4")}>
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={cn(
                      "flex flex-shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      activeView === item.id
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                )
              })}
            </div>

            {isChat
              ? <AIAssistant />
              : (
                <div className="mx-auto max-w-4xl px-6 py-8 pr-8">
                  {activeView === "flowchart"  && <WorkAuthorizationFlowchart />}
                  {activeView === "news"       && <PolicyNews />}
                  {activeView === "profile"    && <StudentProfile />}
                  {activeView === "documents"  && <DocumentStorage />}
                  {activeView === "iso"        && <MeetingScheduler />}
                </div>
              )
            }
          </main>

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
