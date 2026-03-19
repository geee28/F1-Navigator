import Link from "next/link"
import { GraduationCap } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">F1 Navigator</span>
            </Link>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              AI-powered immigration guidance for F1 international students. 
              Navigate OPT, STEM OPT, CPT, and H-1B processes with confidence.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-medium">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#flowchart" className="transition-colors hover:text-foreground">
                  Process Guides
                </Link>
              </li>
              <li>
                <Link href="#assistant" className="transition-colors hover:text-foreground">
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link href="#news" className="transition-colors hover:text-foreground">
                  Policy Updates
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-medium">Official Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a 
                  href="https://www.uscis.gov" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  USCIS.gov
                </a>
              </li>
              <li>
                <a 
                  href="https://studyinthestates.dhs.gov" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  Study in the States
                </a>
              </li>
              <li>
                <a 
                  href="https://www.ice.gov/sevis" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  SEVIS Help Hub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/40 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <p className="text-xs text-muted-foreground">
              2026 F1 Navigator. For educational purposes only - not legal advice.
            </p>
            <p className="text-xs text-muted-foreground">
              Always consult your DSO and immigration attorney for official guidance.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
