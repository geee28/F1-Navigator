"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  AlertTriangle, 
  ChevronDown,
  ChevronRight,
  Building2,
  GraduationCap,
  Briefcase,
  CalendarDays
} from "lucide-react"

type ProcessType = "opt" | "stem-opt" | "cpt" | "h1b"

interface Step {
  id: string
  title: string
  timeline: string
  description: string
  requirements: string[]
  documents: string[]
  tips: string[]
  warnings?: string[]
}

const processData: Record<ProcessType, { title: string; description: string; totalTime: string; steps: Step[] }> = {
  opt: {
    title: "OPT (Optional Practical Training)",
    description: "12-month work authorization for F1 students after completing their degree",
    totalTime: "3-4 months processing",
    steps: [
      {
        id: "opt-1",
        title: "Check Eligibility",
        timeline: "Before Graduation",
        description: "Verify you meet all requirements for OPT application",
        requirements: [
          "Have been enrolled full-time for at least one academic year",
          "Maintain valid F1 status",
          "Not have used 12+ months of full-time CPT",
          "Position must be related to your major field of study"
        ],
        documents: [],
        tips: ["Start planning 90 days before your desired start date"]
      },
      {
        id: "opt-2",
        title: "Request DSO Recommendation",
        timeline: "90 days before graduation",
        description: "Meet with your Designated School Official to get OPT recommendation in SEVIS",
        requirements: [
          "Schedule appointment with International Student Office",
          "Discuss your OPT plans and timeline"
        ],
        documents: [
          "Completed OPT request form (school-specific)",
          "Copy of passport",
          "Copy of current I-20"
        ],
        tips: [
          "Book your DSO appointment early - they get busy near graduation",
          "Ask for expedited processing if you have job offers"
        ]
      },
      {
        id: "opt-3",
        title: "File I-765 with USCIS",
        timeline: "Up to 90 days before program end date",
        description: "Submit your Employment Authorization Document (EAD) application",
        requirements: [
          "File online via myUSCIS or mail Form I-765",
          "Pay the $410 filing fee"
        ],
        documents: [
          "Form I-765",
          "Two passport-style photos",
          "Copy of I-94",
          "Copy of all I-20s",
          "Copy of passport bio page",
          "Copy of F1 visa stamp",
          "Payment of $410 fee"
        ],
        tips: [
          "Filing online is faster and allows you to track status",
          "Take photos at Walgreens/CVS - they know USCIS specs"
        ],
        warnings: [
          "Application must be received within 30 days of DSO recommendation",
          "Cannot work until EAD card arrives"
        ]
      },
      {
        id: "opt-4",
        title: "Receive EAD Card",
        timeline: "3-4 months after filing",
        description: "USCIS processes your application and mails your EAD",
        requirements: [],
        documents: [],
        tips: [
          "Sign up for USCIS text/email updates",
          "Update address immediately if you move"
        ],
        warnings: [
          "Do NOT begin working until you have the physical EAD card",
          "Check card for errors immediately upon receipt"
        ]
      },
      {
        id: "opt-5",
        title: "Begin Employment & Report",
        timeline: "Within EAD validity dates",
        description: "Start working and report employment to your school",
        requirements: [
          "Position must be related to your field of study",
          "Report employer info to your DSO within 10 days"
        ],
        documents: [],
        tips: [
          "Keep records of all employment for STEM OPT eligibility",
          "Track your 90-day unemployment clock carefully"
        ],
        warnings: [
          "Maximum 90 days of unemployment allowed",
          "Unemployment includes gaps between jobs"
        ]
      }
    ]
  },
  "stem-opt": {
    title: "STEM OPT Extension",
    description: "24-month extension for STEM degree holders with E-Verify employers",
    totalTime: "3-5 months processing",
    steps: [
      {
        id: "stem-1",
        title: "Verify Eligibility",
        timeline: "90 days before OPT expires",
        description: "Confirm you qualify for the STEM extension",
        requirements: [
          "Degree is on the STEM Designated Degree Program list",
          "Currently employed by an E-Verify employer",
          "Employer willing to complete Form I-983 training plan",
          "Maintained valid F1 status"
        ],
        documents: [],
        tips: [
          "Check the STEM list at studyinthestates.dhs.gov",
          "Verify your employer's E-Verify status online"
        ]
      },
      {
        id: "stem-2",
        title: "Complete Form I-983",
        timeline: "Before requesting new I-20",
        description: "Work with your employer to create your training plan",
        requirements: [
          "Employer must sign the form",
          "Describe how training relates to your STEM degree",
          "Outline learning objectives and evaluation methods"
        ],
        documents: [
          "Completed Form I-983 (all pages)",
          "Employer E-Verify company ID"
        ],
        tips: [
          "Be specific about your learning goals",
          "Include measurable objectives your employer can evaluate"
        ]
      },
      {
        id: "stem-3",
        title: "Request Updated I-20 from DSO",
        timeline: "Before current OPT expires",
        description: "Get your I-20 updated with STEM OPT recommendation",
        requirements: [
          "Submit I-983 to your DSO",
          "DSO enters recommendation in SEVIS"
        ],
        documents: [
          "Completed I-983",
          "Copy of current EAD",
          "Proof of employment"
        ],
        tips: ["Schedule DSO appointment 2-3 weeks before deadline"]
      },
      {
        id: "stem-4",
        title: "File I-765 for STEM Extension",
        timeline: "Up to 90 days before OPT expiration",
        description: "Submit STEM OPT EAD application to USCIS",
        requirements: [
          "File before current OPT expires",
          "Include all required documentation"
        ],
        documents: [
          "Form I-765",
          "New I-20 with STEM recommendation",
          "Copy of STEM degree and transcripts",
          "Copy of current EAD",
          "Passport photos",
          "$410 filing fee"
        ],
        tips: ["Apply early to allow for processing delays"],
        warnings: [
          "If OPT expires while pending, you get automatic 180-day extension",
          "Must continue working for same E-Verify employer during cap gap"
        ]
      },
      {
        id: "stem-5",
        title: "Submit I-983 Evaluations",
        timeline: "Every 12 months & at completion",
        description: "Maintain compliance with ongoing reporting",
        requirements: [
          "12-month self-evaluation",
          "Final evaluation at end of STEM OPT",
          "Report any employer changes within 10 days"
        ],
        documents: [
          "I-983 evaluation sections",
          "Updated I-983 if changing employers"
        ],
        tips: ["Set calendar reminders for evaluation deadlines"]
      }
    ]
  },
  cpt: {
    title: "CPT (Curricular Practical Training)",
    description: "Work authorization during your academic program as part of curriculum",
    totalTime: "2-4 weeks processing",
    steps: [
      {
        id: "cpt-1",
        title: "Check Program Requirements",
        timeline: "Before seeking employment",
        description: "Verify CPT is available in your program",
        requirements: [
          "Employment must be integral to your curriculum",
          "Must be enrolled full-time (exceptions for final semester)",
          "Have been enrolled for at least one academic year",
          "Academic credit or required by curriculum"
        ],
        documents: [],
        tips: [
          "Check with your academic advisor if CPT applies",
          "Some programs require specific courses to qualify"
        ]
      },
      {
        id: "cpt-2",
        title: "Secure Job Offer",
        timeline: "Before requesting CPT",
        description: "Get a formal offer for position related to your studies",
        requirements: [
          "Offer must be in writing with specific dates",
          "Position must relate to your major",
          "Employer address and supervisor contact required"
        ],
        documents: [
          "Job offer letter on company letterhead",
          "Job description",
          "Supervisor contact information"
        ],
        tips: ["Request detailed offer letter specifying duties related to your field"]
      },
      {
        id: "cpt-3",
        title: "Register for Required Course",
        timeline: "During registration period",
        description: "Enroll in internship/co-op course if required",
        requirements: [
          "Course may be 0-3 credits depending on school",
          "Academic advisor approval may be needed"
        ],
        documents: [
          "Course registration confirmation"
        ],
        tips: ["Some schools waive this for dissertation-stage PhD students"]
      },
      {
        id: "cpt-4",
        title: "Request CPT Authorization",
        timeline: "2-4 weeks before start date",
        description: "Apply through your international student office",
        requirements: [
          "Complete school CPT request form",
          "Meet with DSO for I-20 endorsement"
        ],
        documents: [
          "CPT request form",
          "Job offer letter",
          "Course registration proof",
          "Academic advisor approval form"
        ],
        tips: [
          "Apply early - some schools have backlogs",
          "CPT start date cannot be before I-20 is issued"
        ],
        warnings: [
          "CANNOT start working until you have CPT I-20 in hand",
          "Part-time = 20 hrs/week max during school"
        ]
      },
      {
        id: "cpt-5",
        title: "Receive CPT I-20 & Begin Work",
        timeline: "On or after CPT start date",
        description: "Get your endorsed I-20 and start working",
        requirements: [
          "Only work within authorized dates on I-20",
          "Report any changes to DSO"
        ],
        documents: [],
        tips: [
          "Keep all I-20s for future immigration applications"
        ],
        warnings: [
          "12+ months of full-time CPT = ineligible for OPT",
          "Part-time CPT does not affect OPT eligibility"
        ]
      }
    ]
  },
  h1b: {
    title: "H-1B Specialty Occupation",
    description: "Employer-sponsored work visa for specialty occupations requiring a degree",
    totalTime: "6-12 months (lottery dependent)",
    steps: [
      {
        id: "h1b-1",
        title: "Find H-1B Sponsor",
        timeline: "October-February (before lottery)",
        description: "Secure an employer willing to sponsor your H-1B",
        requirements: [
          "Position requires minimum bachelor's degree",
          "Your degree must relate to the position",
          "Employer agrees to pay filing fees and prevailing wage"
        ],
        documents: [],
        tips: [
          "Research if company has sponsored H-1B before (check h1bdata.info)",
          "Negotiate sponsorship early in job discussions",
          "Large companies more likely to sponsor"
        ]
      },
      {
        id: "h1b-2",
        title: "Employer Files LCA",
        timeline: "Before lottery registration",
        description: "Employer submits Labor Condition Application to DOL",
        requirements: [
          "Employer determines prevailing wage for position",
          "LCA approval typically takes 7 days"
        ],
        documents: [
          "ETA Form 9035 (filed by employer)"
        ],
        tips: ["LCA can be filed while waiting for lottery results"]
      },
      {
        id: "h1b-3",
        title: "H-1B Lottery Registration",
        timeline: "March (annual window)",
        description: "Employer registers you for the H-1B lottery",
        requirements: [
          "Employer pays $10 registration fee",
          "One registration per beneficiary per employer"
        ],
        documents: [
          "Passport copy",
          "Educational credentials"
        ],
        tips: [
          "US master's degree holders get second lottery chance",
          "Selection rate varies year to year (typically 25-30%)"
        ],
        warnings: [
          "Registration period is limited (usually 2-3 weeks)",
          "Being selected is NOT approval - just ability to apply"
        ]
      },
      {
        id: "h1b-4",
        title: "If Selected: File I-129 Petition",
        timeline: "April 1 - June 30",
        description: "Employer files full H-1B petition with USCIS",
        requirements: [
          "Certified LCA",
          "Complete Form I-129",
          "Evidence of specialty occupation",
          "Evidence of your qualifications"
        ],
        documents: [
          "Form I-129",
          "Certified LCA",
          "Degree certificates and transcripts",
          "Credential evaluation (if foreign degree)",
          "Job description and organizational chart",
          "Employer's financial documents",
          "Your resume/CV"
        ],
        tips: [
          "Premium Processing ($2,805) gets decision in 15 business days",
          "Regular processing can take 6+ months"
        ],
        warnings: [
          "RFEs (Requests for Evidence) are common - respond promptly"
        ]
      },
      {
        id: "h1b-5",
        title: "H-1B Approval & Start Work",
        timeline: "October 1 (earliest start)",
        description: "Receive approval and begin H-1B employment",
        requirements: [
          "Cannot start H-1B work before October 1",
          "If on OPT, can continue on OPT until H-1B starts"
        ],
        documents: [
          "I-797 Approval Notice"
        ],
        tips: [
          "If outside US, schedule visa interview at consulate",
          "Change of status applicants can work when H-1B activates"
        ]
      }
    ]
  }
}

// ── Personalized date helpers ────────────────────────────────────────────────

function addDays(d: Date, days: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + days); return r
}
function addMonths(d: Date, months: number): Date {
  const r = new Date(d); r.setMonth(r.getMonth() + months); return r
}
function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

interface KeyDate {
  label: string
  date: string
  style: "blue" | "green" | "amber" | "red" | "primary"
}

function computeKeyDates(gradDateStr: string, process: ProcessType): KeyDate[] {
  const grad = new Date(gradDateStr + "T00:00:00")
  if (isNaN(grad.getTime())) return []

  if (process === "opt") {
    const earliest = addDays(grad, -90)
    const optExpiry = addMonths(grad, 12)
    return [
      { label: "Earliest OPT application (90 days before graduation)", date: fmtDate(earliest), style: "blue" },
      { label: "Graduation / program end date", date: fmtDate(grad), style: "primary" },
      { label: "OPT expiration (12 months from graduation)", date: fmtDate(optExpiry), style: "amber" },
    ]
  }

  if (process === "stem-opt") {
    const optExpiry = addMonths(grad, 12)
    const stemEarliest = addDays(optExpiry, -90)
    const eval12mo = addMonths(grad, 24)
    const stemExpiry = addMonths(grad, 36)
    return [
      { label: "Earliest STEM OPT application (90 days before OPT expiry)", date: fmtDate(stemEarliest), style: "blue" },
      { label: "OPT expiry / STEM OPT start window", date: fmtDate(optExpiry), style: "primary" },
      { label: "12-month self-evaluation due", date: fmtDate(eval12mo), style: "amber" },
      { label: "STEM OPT expiration (24 months)", date: fmtDate(stemExpiry), style: "red" },
    ]
  }

  if (process === "cpt") {
    return [
      { label: "CPT must end by graduation", date: fmtDate(grad), style: "primary" },
      { label: "12+ months full-time CPT makes you ineligible for OPT", date: "Stay under 12 months", style: "red" },
    ]
  }

  if (process === "h1b") {
    // First H1B lottery year: next March after graduation
    const lotteryYear = grad < new Date(grad.getFullYear(), 2, 1)
      ? grad.getFullYear()
      : grad.getFullYear() + 1
    const sponsorStart = new Date(lotteryYear - 1, 9, 1) // Oct 1 prior year
    const sponsorEnd   = new Date(lotteryYear, 1, 28)    // Feb 28 lottery year
    const h1bStart     = new Date(lotteryYear, 9, 1)     // Oct 1 lottery year
    return [
      { label: "Find H-1B sponsor", date: `${fmtDate(sponsorStart)} – ${fmtDate(sponsorEnd)}`, style: "blue" },
      { label: "H-1B lottery registration", date: `March ${lotteryYear}`, style: "primary" },
      { label: "File I-129 petition (if selected)", date: `Apr 1 – Jun 30, ${lotteryYear}`, style: "amber" },
      { label: "Earliest H-1B start date", date: fmtDate(h1bStart), style: "green" },
    ]
  }

  return []
}

const keyDateStyles: Record<KeyDate["style"], string> = {
  blue:    "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  green:   "border-green-300 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  amber:   "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  red:     "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  primary: "border-primary/40 bg-primary/5 text-primary",
}

// ─────────────────────────────────────────────────────────────────────────────

interface FlowchartProps {
  externalProcess?: ProcessType
  onProcessChange?: (p: ProcessType) => void
  graduationDate?: string
  onOpenI765?: (type: "opt" | "stem-opt") => void
}

export function WorkAuthorizationFlowchart({ externalProcess, onProcessChange, graduationDate, onOpenI765 }: FlowchartProps) {
  const [internalProcess, setInternalProcess] = useState<ProcessType>("cpt")
  const [expandedSteps, setExpandedSteps] = useState<string[]>([])
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("f1nav-completed-steps")
    if (saved) setCompletedSteps(JSON.parse(saved))
  }, [])

  const activeProcess = externalProcess ?? internalProcess
  const setActiveProcess = (p: ProcessType) => {
    setInternalProcess(p)
    onProcessChange?.(p)
    setExpandedSteps([])
  }

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev =>
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    )
  }

  const toggleCompleted = (stepId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCompletedSteps(prev => {
      const next = prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
      localStorage.setItem("f1nav-completed-steps", JSON.stringify(next))
      return next
    })
  }

  const currentProcess = processData[activeProcess]

  return (
    <section id="flowchart" className="py-2">
      <div className="mb-8">
        <Badge variant="outline" className="mb-3">Step-by-Step Guides</Badge>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Work Authorization Flowcharts
        </h2>
        <p className="mt-3 text-muted-foreground">
          Select your authorization type to see detailed steps, timelines, and document requirements
        </p>
      </div>

        <div>
          <Tabs value={activeProcess} onValueChange={(v) => setActiveProcess(v as ProcessType)}>
            <TabsList className="mb-8 grid w-full grid-cols-4">
              <TabsTrigger value="cpt" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span>CPT</span>
              </TabsTrigger>
              <TabsTrigger value="opt" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                <span>OPT</span>
              </TabsTrigger>
              <TabsTrigger value="stem-opt" className="gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">STEM OPT</span>
                <span className="sm:hidden">STEM</span>
              </TabsTrigger>
              <TabsTrigger value="h1b" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>H-1B</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeProcess} className="mt-0">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">{currentProcess.title}</CardTitle>
                      <CardDescription className="mt-1">{currentProcess.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {currentProcess.totalTime}
                      </Badge>
                      {(activeProcess === "opt" || activeProcess === "stem-opt") && onOpenI765 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-primary border-primary/40 hover:bg-primary/5"
                          onClick={() => onOpenI765(activeProcess)}
                        >
                          <FileText className="h-4 w-4" />
                          Fill I-765 Form
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Personalized timeline panel */}
                  {graduationDate && (() => {
                    const keyDates = computeKeyDates(graduationDate, activeProcess)
                    if (!keyDates.length) return null
                    const gradFormatted = new Date(graduationDate + "T00:00:00").toLocaleDateString("en-US", {
                      month: "long", day: "numeric", year: "numeric",
                    })
                    return (
                      <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                          <CalendarDays className="h-4 w-4" />
                          Your Personalized Timeline
                          <span className="ml-1 font-normal text-muted-foreground">— based on {gradFormatted} graduation</span>
                        </h4>
                        <div className="space-y-2">
                          {keyDates.map((item, i) => (
                            <div key={i} className="flex flex-wrap items-center gap-2">
                              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${keyDateStyles[item.style]}`}>
                                {item.date}
                              </span>
                              <span className="text-xs text-muted-foreground">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 hidden h-full w-0.5 bg-border sm:block" />
                    
                    <div className="space-y-4">
                      {currentProcess.steps.map((step, index) => (
                        <Collapsible
                          key={step.id}
                          open={expandedSteps.includes(step.id)}
                          onOpenChange={() => toggleStep(step.id)}
                        >
                          <div className="relative flex gap-4">
                            {/* Timeline dot — click to mark complete */}
                            <div className="hidden flex-shrink-0 sm:block">
                              <button
                                onClick={(e) => toggleCompleted(step.id, e)}
                                title={completedSteps.includes(step.id) ? "Mark as incomplete" : "Mark as done"}
                                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                                  completedSteps.includes(step.id)
                                    ? 'border-green-500 bg-green-500 text-white'
                                    : expandedSteps.includes(step.id)
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-background hover:border-green-400 hover:bg-green-50'
                                }`}
                              >
                                {completedSteps.includes(step.id)
                                  ? <CheckCircle2 className="h-4 w-4" />
                                  : <span className="text-sm font-medium">{index + 1}</span>
                                }
                              </button>
                            </div>

                            <div className="flex-1">
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-auto w-full justify-start p-4 text-left hover:bg-secondary/50"
                                >
                                  <div className="flex flex-1 items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className={`font-semibold ${completedSteps.includes(step.id) ? 'text-green-600' : ''}`}>{step.title}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {step.timeline}
                                        </Badge>
                                      </div>
                                      <p className="mt-1 text-sm text-muted-foreground">
                                        {step.description}
                                      </p>
                                    </div>
                                    {expandedSteps.includes(step.id) ? (
                                      <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                    )}
                                  </div>
                                </Button>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <div className="space-y-4 rounded-lg bg-secondary/30 p-4 mt-2">
                                  {step.requirements.length > 0 && (
                                    <div>
                                      <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                                        <CheckCircle2 className="h-4 w-4 text-accent" />
                                        Requirements
                                      </h4>
                                      <ul className="space-y-1 pl-6 text-sm text-muted-foreground">
                                        {step.requirements.map((req, i) => (
                                          <li key={i} className="list-disc">{req}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {step.documents.length > 0 && (
                                    <div>
                                      <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                                        <FileText className="h-4 w-4 text-primary" />
                                        Documents Needed
                                      </h4>
                                      <ul className="space-y-1 pl-6 text-sm text-muted-foreground">
                                        {step.documents.map((doc, i) => (
                                          <li key={i} className="list-disc">{doc}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {step.tips.length > 0 && (
                                    <div className="rounded-md bg-primary/10 p-3">
                                      <h4 className="mb-1 text-sm font-medium text-primary">Pro Tips</h4>
                                      <ul className="space-y-1 text-sm text-muted-foreground">
                                        {step.tips.map((tip, i) => (
                                          <li key={i}>• {tip}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {step.warnings && step.warnings.length > 0 && (
                                    <div className="rounded-md bg-destructive/10 p-3">
                                      <h4 className="mb-1 flex items-center gap-1 text-sm font-medium text-destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        Important Warnings
                                      </h4>
                                      <ul className="space-y-1 text-sm text-muted-foreground">
                                        {step.warnings.map((warning, i) => (
                                          <li key={i}>• {warning}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </div>
                          </div>
                        </Collapsible>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 rounded-lg border border-border/50 bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">
                      <strong>Disclaimer:</strong> This information is for general guidance only and should not be 
                      considered legal advice. Immigration laws and procedures change frequently. Always consult 
                      with your DSO and consider seeking advice from an immigration attorney for your specific situation.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
    </section>
  )
}
