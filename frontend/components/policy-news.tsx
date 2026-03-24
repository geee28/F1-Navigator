"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronRight,
  Calendar,
  Users,
  AlertCircle,
  ExternalLink,
  Filter,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { newsApi, type NewsArticle } from "@/lib/api"

type ImpactType = "positive" | "negative" | "neutral"

function formatDate(raw: string): string {
  if (!raw) return ""
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return raw
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return raw
  }
}

const groupLabels: Record<string, string> = {
  "all-f1": "All F1 Students",
  opt: "OPT",
  "stem-opt": "STEM OPT",
  h1b: "H-1B",
  cpt: "CPT",
}

const impactConfig: Record<ImpactType, { icon: typeof TrendingUp; label: string; colorClass: string }> = {
  positive: { icon: TrendingUp, label: "Positive Impact", colorClass: "text-accent bg-accent/10" },
  negative: { icon: TrendingDown, label: "Negative Impact", colorClass: "text-destructive bg-destructive/10" },
  neutral: { icon: Minus, label: "Informational", colorClass: "text-muted-foreground bg-muted" },
}

export function PolicyNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedPolicies, setExpandedPolicies] = useState<string[]>([])
  const [filterGroup, setFilterGroup] = useState<string>("all")

  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout>

    const load = (isRetry = false) => {
      if (isRetry) setLoading(true)
      newsApi.get()
        .then(({ articles }) => {
          if (articles.length === 0 && !isRetry) {
            // Backend still warming up — retry once after 8 seconds
            retryTimer = setTimeout(() => load(true), 8000)
          } else {
            setArticles(articles)
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }

    load()
    return () => clearTimeout(retryTimer)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await newsApi.refresh()  // returns immediately, backend fetches in background
      // Poll every 4s until we get new articles (backend takes ~25-35s)
      const firstTitle = articles[0]?.title ?? ""
      let attempts = 0
      const poll = async () => {
        try {
          const { articles: fresh } = await newsApi.get()
          if (fresh.length > 0 && fresh[0]?.title !== firstTitle) {
            setArticles(fresh)
            setRefreshing(false)
          } else if (attempts < 12) {
            attempts++
            setTimeout(poll, 4000)
          } else {
            setRefreshing(false)
          }
        } catch {
          setRefreshing(false)
        }
      }
      setTimeout(poll, 10000) // first poll after 10s
    } catch (e) {
      console.error(e)
      setRefreshing(false)
    }
  }

  const togglePolicy = (id: string) => {
    setExpandedPolicies((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const filteredArticles =
    filterGroup === "all"
      ? articles
      : articles.filter((a) =>
          a.affectedGroups.some((g) => g.toLowerCase() === filterGroup)
        )

  return (
    <section id="news" className="py-2">
      {/* Section header */}
      <div className="mb-8">
        <Badge variant="outline" className="mb-3">Policy Intelligence</Badge>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Immigration Policy Updates
            </h2>
            <p className="mt-3 text-muted-foreground">
              Stay informed about policy changes that affect F1 students — summarized and analyzed for clarity
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Fetch latest news"
            className="mt-1 flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Fetching…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filter by:</span>
        <Button
          variant={filterGroup === "all" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setFilterGroup("all")}
        >
          All Updates
        </Button>
        {Object.entries(groupLabels).map(([key, label]) => (
          <Button
            key={key}
            variant={filterGroup === key ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilterGroup(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading latest policy updates…</span>
        </div>
      )}

      {/* Policy cards */}
      {!loading && (
        <div className="space-y-4">
          {filteredArticles.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No articles found for this filter.</p>
          )}
          {filteredArticles.map((article) => {
            const impact = (article.impact ?? "neutral") as ImpactType
            const cfg = impactConfig[impact] ?? impactConfig.neutral
            const ImpactIcon = cfg.icon
            const isExpanded = expandedPolicies.includes(article.id)

            return (
              <Collapsible
                key={article.id}
                open={isExpanded}
                onOpenChange={() => togglePolicy(article.id)}
              >
                <Card className="border-border/50 transition-all hover:border-primary/30">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${cfg.colorClass}`}
                        >
                          <ImpactIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <CardTitle className="text-base leading-tight">{article.title}</CardTitle>
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(article.date)}
                            </div>
                            {article.affectedGroups?.length > 0 && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  {article.affectedGroups.join(", ")}
                                </div>
                              </>
                            )}
                          </div>
                          <CardDescription className="mt-2 line-clamp-2">{article.summary}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="ml-14 space-y-4">
                        {/* Key points */}
                        {article.keyPoints?.length > 0 && (
                          <div>
                            <h4 className="mb-2 text-sm font-medium">Key Points</h4>
                            <ul className="space-y-1.5">
                              {article.keyPoints.map((point, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Action required */}
                        {article.actionRequired && (
                          <div className="rounded-lg bg-primary/5 p-3">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                              <div>
                                <h4 className="text-sm font-medium text-primary">Action Required</h4>
                                <p className="text-sm text-muted-foreground">{article.actionRequired}</p>
                                {article.deadline && (
                                  <p className="mt-1 text-xs font-medium text-primary">
                                    Deadline: {article.deadline}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Source link */}
                        <div className="flex items-center justify-between border-t border-border/50 pt-3">
                          <span className="text-xs text-muted-foreground">Source: {article.source}</span>
                          <Button variant="ghost" size="sm" className="h-auto gap-1 p-0 text-xs" asChild>
                            <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                              Read Original
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )
          })}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-8 rounded-lg border border-border/50 bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> Policy summaries are for educational purposes and may not reflect the
          complete legal text. Always verify with official government sources and consult your DSO or
          an immigration attorney before taking action.
        </p>
      </div>
    </section>
  )
}
