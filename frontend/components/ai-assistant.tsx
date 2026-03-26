"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, User, ExternalLink, ChevronDown, ChevronUp, ArrowUp } from "lucide-react"
import { chatStream, type SourceItem } from "@/lib/api"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  sources?: SourceItem[]
}

interface AIAssistantProps {
  sessionId:       string | null
  onSessionCreate: (id: string, title: string) => void
}

const COLLAPSE_THRESHOLD = 400

const quickQuestions = [
  "When can I apply for OPT?",
  "What docs do I need for STEM OPT?",
  "Can I work for multiple employers on OPT?",
  "What is the unemployment limit on OPT?",
  "How does the H-1B lottery work?",
  "Can I do CPT while still in school?",
]

function formatContent(content: string) {
  return content.split("\n").map((line, i) => {
    const html = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    return (
      <p key={i} className="mb-1 last:mb-0 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }} />
    )
  })
}

function loadSessionMessages(sessionId: string | null): Message[] {
  if (!sessionId) return []
  try {
    const stored = localStorage.getItem(`f1nav-session-${sessionId}`)
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

export function AIAssistant({ sessionId, onSessionCreate }: AIAssistantProps) {
  const [messages,          setMessages]         = useState<Message[]>(() => loadSessionMessages(sessionId))
  const [input,             setInput]             = useState("")
  const [isTyping,          setIsTyping]          = useState(false)
  const [expandedMsgs,      setExpandedMsgs]      = useState<Set<string>>(new Set())
  const [internalSessionId, setInternalSessionId] = useState<string | null>(sessionId)

  const scrollRef       = useRef<HTMLDivElement>(null)
  const inputRef        = useRef<HTMLTextAreaElement>(null)
  const isNearBottomRef = useRef(true)
  const messagesRef     = useRef<Message[]>(messages)

  // Auto-focus input on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  // Keep ref in sync so handleSend always reads the latest messages (avoids stale closure)
  useEffect(() => { messagesRef.current = messages }, [messages])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (internalSessionId && messages.length > 0) {
      localStorage.setItem(`f1nav-session-${internalSessionId}`, JSON.stringify(messages))
    }
  }, [messages, internalSessionId])

  // Auto-scroll
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }
  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }
  }, [messages, isTyping])

  const toggleExpand = (id: string) =>
    setExpandedMsgs((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleSend = async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed || isTyping) return

    // Create session on first message
    let sid = internalSessionId
    if (!sid) {
      sid = `session-${Date.now()}`
      setInternalSessionId(sid)
      onSessionCreate(sid, trimmed.length > 45 ? trimmed.slice(0, 45) + "…" : trimmed)
    }

    const userMsg: Message = {
      id: `u-${Date.now()}`, role: "user", content: trimmed, timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)
    isNearBottomRef.current = true

    const assistantId = `a-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", timestamp: new Date() },
    ])

    try {
      const history = messagesRef.current.slice(-6).map((m) => ({ role: m.role, content: m.content }))

      for await (const event of chatStream(trimmed, history, sid)) {
        if (event.type === "token") {
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: m.content + event.content } : m)
          )
        } else if (event.type === "sources") {
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, sources: event.content } : m)
          )
        } else if (event.type === "error") {
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: event.content } : m)
          )
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry, something went wrong. Please try again." }
            : m
        )
      )
    } finally {
      setIsTyping(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = "auto"
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  const hasMessages = messages.length > 0

  // ── Shared input box ────────────────────────────────────────────────────────
  const InputBox = (
    <div className={hasMessages ? "border-t border-border/40 bg-background px-2 sm:px-4 pb-4 pt-3" : ""}>
      <div className={`mx-auto ${hasMessages ? "max-w-3xl" : "w-full max-w-2xl"}`}>
        <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-secondary/40 px-4 py-3 shadow-sm focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Ask about OPT, STEM OPT, CPT, H-1B…"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
            style={{ maxHeight: 160, fontSize: "16px" }}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isTyping}
            className="mb-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground/50">
          For informational purposes only. Always verify with your DSO or an immigration attorney.
        </p>
      </div>
    </div>
  )

  // ── Landing page (no messages yet) ─────────────────────────────────────────
  if (!hasMessages) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-4">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Bot className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">Where should we begin?</h1>
          <p className="mb-8 max-w-sm text-center text-sm text-muted-foreground">
            Ask me anything about F-1 visas, OPT, STEM OPT, CPT, H-1B, or US immigration.
          </p>
          <div className="mb-10 flex max-w-xl flex-wrap justify-center gap-2">
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="w-full max-w-2xl">{InputBox}</div>
        </div>
      </div>
    )
  }

  // ── Active chat ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-6
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-border
          hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
      >
        <div className="mx-auto max-w-3xl space-y-6 px-2 sm:px-0">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>

              {msg.role === "assistant" && (
                <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}

              <div className="flex max-w-[80%] flex-col gap-2">
                <div className={`rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "rounded-tr-sm bg-primary text-primary-foreground"
                    : "rounded-tl-sm bg-secondary text-foreground"
                }`}>
                  {msg.content ? (() => {
                    const isAssistant = msg.role === "assistant"
                    const isLong      = isAssistant && msg.content.length > COLLAPSE_THRESHOLD
                    const isExpanded  = expandedMsgs.has(msg.id)
                    const streaming   = isTyping && msg.id === messages[messages.length - 1]?.id
                    const display     = isLong && !isExpanded && !streaming
                      ? msg.content.slice(0, COLLAPSE_THRESHOLD).trimEnd() + "…"
                      : msg.content
                    return (
                      <>
                        {formatContent(display)}
                        {isLong && !streaming && (
                          <button
                            onClick={() => toggleExpand(msg.id)}
                            className="mt-2 flex items-center gap-1 text-xs font-medium text-primary/70 hover:text-primary"
                          >
                            {isExpanded
                              ? <><ChevronUp className="h-3 w-3" /> Show less</>
                              : <><ChevronDown className="h-3 w-3" /> Show full response</>}
                          </button>
                        )}
                      </>
                    )
                  })() : (
                    <span className="italic text-xs text-muted-foreground">Thinking…</span>
                  )}
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-1">
                    {msg.sources.map((s, i) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        {s.title.length > 40 ? s.title.slice(0, 40) + "…" : s.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3">
              <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {[0, 160, 320].map((delay) => (
                    <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      {InputBox}
    </div>
  )
}
