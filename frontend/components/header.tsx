"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, GraduationCap } from "lucide-react"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10 ring-1 ring-primary-foreground/20">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-primary-foreground">F1 Navigator</span>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
            <a href="https://www.uscis.gov" target="_blank" rel="noopener noreferrer">
              USCIS.gov
            </a>
          </Button>
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
            <a href="https://studyinthestates.dhs.gov" target="_blank" rel="noopener noreferrer">
              Study in the States
            </a>
          </Button>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <nav className="flex flex-col gap-4 pt-8">
              <Link href="#flowchart" onClick={() => setIsOpen(false)} className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground">Process Guide</Link>
              <Link href="#assistant" onClick={() => setIsOpen(false)} className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground">AI Assistant</Link>
              <Link href="#news" onClick={() => setIsOpen(false)} className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground">Policy Updates</Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
