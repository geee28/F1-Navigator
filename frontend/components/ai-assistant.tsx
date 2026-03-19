"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, Send, User, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { chatStream, type SourceItem } from "@/lib/api"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  sources?: SourceItem[]
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

const defaultWelcome: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hello! I'm your F1 immigration assistant. Ask me anything about OPT, STEM OPT, CPT, H-1B, or any F1 question.",
  timestamp: new Date(),
}

function formatContent(content: string) {
  return content.split("\n").map((line, i) => {
    const html = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    return (
      <p key={i} className="mb-1 last:mb-0 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }} />
    )
  })
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([defaultWelcome])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [expandedMsgs, setExpandedMsgs] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)

  const toggleExpand = (id: string) =>
    setExpandedMsgs((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

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

  const handleSend = async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed || isTyping) return

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: trimmed, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)
    isNearBottomRef.current = true

    const assistantId = `a-${Date.now()}`
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", timestamp: new Date() }])

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }))

      for await (const event of chatStream(trimmed, history)) {
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
          m.id === assistantId ? { ...m, content: "Sorry, something went wrong. Please try again." } : m
        )
      )
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex h-full flex-col">

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-border px-6 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">F1 Navigator AI</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Grounded in USCIS, DHS &amp; Federal policies</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="text-xs text-muted-foreground">Online</span>
        </div>
      </div>

      {/* ── Messages ──────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto px-6 py-6
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-border
          hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
      >
        <div className="mx-auto max-w-3xl space-y-6">
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
                    const isLong = isAssistant && msg.content.length > COLLAPSE_THRESHOLD
                    const isExpanded = expandedMsgs.has(msg.id)
                    const streaming = isTyping && msg.id === messages[messages.length - 1]?.id
                    const display = isLong && !isExpanded && !streaming
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

                {/* Source links — always shown below the bubble */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-1">
                    {msg.sources.map((s, i) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
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

      {/* ── Quick questions ───────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-border px-6 py-2">
        <div className="mx-auto max-w-3xl flex flex-wrap gap-1.5">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              disabled={isTyping}
              className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── Input ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-border bg-card px-6 py-4">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(input) }}
          className="mx-auto flex max-w-3xl gap-2"
        >
          <Input
            placeholder="Ask about OPT, STEM OPT, CPT, H-1B, or any F1 question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            className="flex-1 bg-secondary/50"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground/60">
          For informational purposes only. Always verify with your DSO or an immigration attorney.
        </p>
      </div>

    </div>
  )
}
