"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, FileText, Bot, Newspaper } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
      
      <div className="container px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-6">
            AI-Powered Immigration Guidance
          </Badge>
          
          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Navigate Your F1 Work Authorization with{" "}
            <span className="text-primary">Confidence</span>
          </h1>
          
          <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-muted-foreground">
            Understand OPT, STEM OPT, CPT, and H-1B processes through interactive 
            flowcharts. Get personalized guidance and stay updated on policy changes 
            that affect you.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="gap-2">
              Start Your Journey <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
        
        <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={FileText}
            title="Process Flowcharts"
            description="Step-by-step visual guides for every work authorization type"
          />
          <FeatureCard
            icon={Bot}
            title="AI Assistant"
            description="Ask questions and get personalized guidance based on your status"
          />
          <FeatureCard
            icon={Newspaper}
            title="Policy Updates"
            description="Real-time news analysis showing how changes affect you"
          />
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="group relative rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/50 hover:bg-card/80">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
