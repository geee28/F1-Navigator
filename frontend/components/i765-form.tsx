"use client"

import { useState } from "react"
import { useAuth } from "./auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Printer, CheckCircle2 } from "lucide-react"

interface I765FormProps {
  formType: "opt" | "stem-opt"
  onBack: () => void
}

function Badge({ text }: { text: string }) {
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
      <CheckCircle2 className="h-2.5 w-2.5" />
      {text}
    </span>
  )
}

function Field({
  label, children, fromProfile = false, required = false,
}: {
  label: string; children: React.ReactNode; fromProfile?: boolean; required?: boolean
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
        {fromProfile && <Badge text="From profile" />}
      </label>
      {children}
    </div>
  )
}

export function I765Form({ formType, onBack }: I765FormProps) {
  const { student } = useAuth()

  // Helper to split name into parts
  const nameParts = (student?.name ?? "").trim().split(/\s+/)
  const autoFirst  = nameParts.length >= 2 ? nameParts.slice(0, -1).join(" ") : nameParts[0] ?? ""
  const autoLast   = nameParts.length >= 2 ? nameParts[nameParts.length - 1] : ""

  const eligibility = formType === "opt" ? "(c)(3)(B)" : "(c)(3)(C)"
  const formLabel   = formType === "opt" ? "OPT" : "STEM OPT"

  const [form, setForm] = useState({
    // Part 1
    applicationType: "initial",

    // Part 2 – Name
    lastName:   autoLast,
    firstName:  autoFirst,
    middleName: student?.middleName ?? "",

    // Other names
    otherName1Last: "", otherName1First: "", otherName1Middle: "",
    otherName2Last: "", otherName2First: "", otherName2Middle: "",

    // Address
    mailingStreet: student?.mailingStreet ?? "",
    mailingApt:    student?.mailingApt    ?? "",
    mailingCity:   student?.mailingCity   ?? "",
    mailingState:  student?.mailingState  ?? "",
    mailingZip:    student?.mailingZip    ?? "",
    sameAddress:   "yes",
    physicalStreet: "", physicalApt: "", physicalCity: "", physicalState: "", physicalZip: "",

    // IDs
    aNumber:            "",
    uscisOnlineAccount: "",

    // Personal
    sex:           student?.sex           ?? "",
    maritalStatus: student?.maritalStatus ?? "",
    previousI765:  "no",
    ssaCard:       "no",
    ssn:           "",
    wantSsaCard:   "no",
    consentDisclosure: "yes",

    // Parents
    fatherLast: "", fatherFirst: "",
    motherLast: "", motherFirst: "",

    // Citizenship & Birth
    citizenshipCountry: student?.countryOfCitizenship ?? "",
    birthCity:          student?.birthCity            ?? "",
    birthStateProvince: "",
    birthCountry:       student?.birthCountry         ?? "",
    dateOfBirth:        student?.dateOfBirth          ?? "",

    // Arrival
    i94:                "",
    passportNumber:     "",
    travelDocNumber:    "",
    passportCountry:    "",
    passportExpiry:     "",
    lastArrivalDate:    "",
    lastArrivalPlace:   "",
    statusAtArrival:    "F1 - Student, Academic Or Language Program",
    currentStatus:      student?.visaStatus ?? "F-1 Student",

    // SEVIS & Eligibility
    sevisNumber:         student?.sevisNumber ?? "",
    eligibilityCategory: formType === "opt" ? "C03B" : "C03C",

    // STEM OPT extras
    stemDegree:          student?.major ?? "",
    stemEmployerName:    "",
    stemEmployerEVerify: "",

    // Part 3
    dayTimePhone: student?.phoneNumber ?? "",
    mobilePhone:  student?.phoneNumber ?? "",
    email:        student?.email       ?? "",
    statementType: "1a",
    signatureDate: new Date().toISOString().split("T")[0],
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const inp = (key: string, placeholder?: string, fromProfile = false) => (
    <Input
      value={(form as any)[key]}
      onChange={(e) => set(key, e.target.value)}
      placeholder={placeholder}
      className={`h-8 text-sm ${fromProfile ? "border-green-300 bg-green-50/30" : ""}`}
    />
  )

  const sel = (key: string, options: { value: string; label: string }[], fromProfile = false) => (
    <Select value={(form as any)[key]} onValueChange={(v) => set(key, v)}>
      <SelectTrigger className={`h-8 text-sm ${fromProfile ? "border-green-300 bg-green-50/30" : ""}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <div className="flex-1 overflow-y-auto bg-background [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-3 print:hidden">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Process Guide
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">USCIS Form I-765 — {formLabel} ({eligibility})</span>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 rounded-lg border border-border bg-primary/5 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Department of Homeland Security · U.S. Citizenship and Immigration Services</p>
              <h1 className="mt-1 text-xl font-bold">Application for Employment Authorization</h1>
              <p className="text-sm text-muted-foreground">USCIS Form I-765 · OMB No. 1615-0040 · Expires 09/30/2027</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Edition 01/20/25</p>
              <p className="mt-1 font-medium text-primary">For {formLabel}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
            Fields marked <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700"><CheckCircle2 className="h-2.5 w-2.5" />From profile</span> are pre-filled. Review all fields before printing. This tool generates a draft — you must sign the printed form.
          </p>
        </div>

        {/* PART 1 */}
        <Card className="mb-6 border-border/60 p-5">
          <h2 className="mb-4 border-b pb-2 text-sm font-bold uppercase tracking-wide">Part 1. Reason for Applying</h2>
          <Field label="I am applying for (select only one)">
            {sel("applicationType", [
              { value: "initial",     label: "1.a. Initial permission to accept employment" },
              { value: "replacement", label: "1.b. Replacement (lost, stolen, damaged, or correction not due to USCIS error)" },
              { value: "renewal",     label: "1.c. Renewal of my permission to accept employment" },
            ])}
          </Field>
        </Card>

        {/* PART 2 – Name */}
        <Card className="mb-6 border-border/60 p-5">
          <h2 className="mb-4 border-b pb-2 text-sm font-bold uppercase tracking-wide">Part 2. Information About You</h2>

          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your Full Legal Name</h3>
          <div className="mb-5 grid grid-cols-3 gap-3">
            <Field label="1.a. Family Name (Last Name)" fromProfile={!!autoLast} required>
              {inp("lastName", "Last name", !!autoLast)}
            </Field>
            <Field label="1.b. Given Name (First Name)" fromProfile={!!autoFirst} required>
              {inp("firstName", "First name", !!autoFirst)}
            </Field>
            <Field label="1.c. Middle Name" fromProfile={!!student?.middleName}>
              {inp("middleName", "Middle name (if any)", !!student?.middleName)}
            </Field>
          </div>

          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Other Names Used (aliases, maiden name, nicknames)</h3>
          {[
            { l: "otherName1Last", f: "otherName1First", m: "otherName1Middle", n: "2" },
            { l: "otherName2Last", f: "otherName2First", m: "otherName2Middle", n: "3" },
          ].map((row) => (
            <div key={row.n} className="mb-3 grid grid-cols-3 gap-3">
              <Field label={`${row.n}.a. Family Name`}>{inp(row.l, "Last name")}</Field>
              <Field label={`${row.n}.b. Given Name`}>{inp(row.f, "First name")}</Field>
              <Field label={`${row.n}.c. Middle Name`}>{inp(row.m, "Middle name")}</Field>
            </div>
          ))}

          <h3 className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your U.S. Mailing Address</h3>
          <div className="mb-2 grid grid-cols-2 gap-3">
            <Field label="5.b. Street Number and Name" fromProfile={!!student?.mailingStreet} required>
              {inp("mailingStreet", "e.g., 2850 Pleasant View Rd", !!student?.mailingStreet)}
            </Field>
            <Field label="5.c. Apt. / Ste. / Flr." fromProfile={!!student?.mailingApt}>
              {inp("mailingApt", "e.g., Unit 202", !!student?.mailingApt)}
            </Field>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <Field label="5.d. City or Town" fromProfile={!!student?.mailingCity} required>
              {inp("mailingCity", "City", !!student?.mailingCity)}
            </Field>
            <Field label="5.e. State" fromProfile={!!student?.mailingState} required>
              {inp("mailingState", "e.g., TX", !!student?.mailingState)}
            </Field>
            <Field label="5.f. Zip Code" fromProfile={!!student?.mailingZip} required>
              {inp("mailingZip", "e.g., 77840", !!student?.mailingZip)}
            </Field>
          </div>

          <Field label="6. Is your current mailing address the same as your physical address?">
            {sel("sameAddress", [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }])}
          </Field>

          {form.sameAddress === "no" && (
            <>
              <h3 className="mb-3 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">U.S. Physical Address</h3>
              <div className="mb-2 grid grid-cols-2 gap-3">
                <Field label="7.a. Street Number and Name" required>{inp("physicalStreet", "Street")}</Field>
                <Field label="7.b. Apt. / Ste. / Flr.">{inp("physicalApt", "Unit")}</Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="7.c. City or Town" required>{inp("physicalCity", "City")}</Field>
                <Field label="7.d. State" required>{inp("physicalState", "e.g., TX")}</Field>
                <Field label="7.e. Zip Code" required>{inp("physicalZip", "Zip")}</Field>
              </div>
            </>
          )}

          <h3 className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Other Information</h3>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Field label="8. Alien Registration Number (A-Number) (if any)">
              {inp("aNumber", "A-")}
            </Field>
            <Field label="9. USCIS Online Account Number (if any)">
              {inp("uscisOnlineAccount", "")}
            </Field>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Field label="10. Sex" fromProfile={!!student?.sex} required>
              {sel("sex", [
                { value: "Male",   label: "Male"   },
                { value: "Female", label: "Female" },
              ], !!student?.sex)}
            </Field>
            <Field label="11. Marital Status" fromProfile={!!student?.maritalStatus} required>
              {sel("maritalStatus", [
                { value: "Single",   label: "Single"   },
                { value: "Married",  label: "Married"  },
                { value: "Divorced", label: "Divorced" },
                { value: "Widowed",  label: "Widowed"  },
              ], !!student?.maritalStatus)}
            </Field>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Field label="12. Have you previously filed Form I-765?">
              {sel("previousI765", [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }])}
            </Field>
            <Field label="13.a. Has the SSA ever officially issued a Social Security card to you?">
              {sel("ssaCard", [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }])}
            </Field>
          </div>
          {form.ssaCard === "yes" && (
            <div className="mb-3">
              <Field label="13.b. Social Security Number (SSN) (if known)">{inp("ssn", "XXX-XX-XXXX")}</Field>
            </div>
          )}
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Field label="14. Do you want the SSA to issue you a Social Security card?">
              {sel("wantSsaCard", [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }])}
            </Field>
            <Field label="15. Consent for Disclosure (required if Item 14 = Yes)">
              {sel("consentDisclosure", [{ value: "yes", label: "Yes — I authorize disclosure" }, { value: "no", label: "No" }])}
            </Field>
          </div>

          <h3 className="mb-3 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Father's Name (birth name)</h3>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Field label="16.a. Family Name (Last Name)">{inp("fatherLast", "Father's last name")}</Field>
            <Field label="16.b. Given Name (First Name)">{inp("fatherFirst", "Father's first name")}</Field>
          </div>

          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mother's Name (birth name)</h3>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Field label="17.a. Family Name (Last Name)">{inp("motherLast", "Mother's last name")}</Field>
            <Field label="17.b. Given Name (First Name)">{inp("motherFirst", "Mother's first name")}</Field>
          </div>

          <h3 className="mb-3 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Country of Citizenship / Nationality</h3>
          <div className="mb-4">
            <Field label="18.a. Country" fromProfile={!!student?.countryOfCitizenship} required>
              {inp("citizenshipCountry", "e.g., India", !!student?.countryOfCitizenship)}
            </Field>
          </div>

          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Place of Birth</h3>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <Field label="19.a. City / Town / Village" fromProfile={!!student?.birthCity} required>
              {inp("birthCity", "Birth city", !!student?.birthCity)}
            </Field>
            <Field label="19.b. State / Province">
              {inp("birthStateProvince", "State or province")}
            </Field>
            <Field label="19.c. Country of Birth" fromProfile={!!student?.birthCountry} required>
              {inp("birthCountry", "e.g., India", !!student?.birthCountry)}
            </Field>
          </div>
          <div className="mb-5">
            <Field label="20. Date of Birth (mm/dd/yyyy)" fromProfile={!!student?.dateOfBirth} required>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => set("dateOfBirth", e.target.value)}
                className={`h-8 text-sm ${student?.dateOfBirth ? "border-green-300 bg-green-50/30" : ""}`}
              />
            </Field>
          </div>

          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Information About Your Last Arrival in the United States</h3>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Field label="21.a. Form I-94 Arrival-Departure Record Number (if any)">
              {inp("i94", "e.g., 367088022A4")}
            </Field>
            <Field label="21.b. Passport Number of Most Recently Issued Passport" required>
              {inp("passportNumber", "e.g., T7970146")}
            </Field>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Field label="21.c. Travel Document Number (if any)">
              {inp("travelDocNumber", "")}
            </Field>
            <Field label="21.d. Country That Issued Your Passport" required>
              {inp("passportCountry", "e.g., India")}
            </Field>
          </div>
          <div className="mb-3 grid grid-cols-3 gap-3">
            <Field label="21.e. Passport Expiration Date (mm/dd/yyyy)" required>
              <Input type="date" value={form.passportExpiry} onChange={(e) => set("passportExpiry", e.target.value)} className="h-8 text-sm" />
            </Field>
            <Field label="22. Date of Last Arrival into the U.S. (mm/dd/yyyy)" required>
              <Input type="date" value={form.lastArrivalDate} onChange={(e) => set("lastArrivalDate", e.target.value)} className="h-8 text-sm" />
            </Field>
            <Field label="23. Place of Last Arrival into the U.S." required>
              {inp("lastArrivalPlace", "e.g., CHICAGO, IL")}
            </Field>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Field label="24. Immigration Status at Your Last Arrival" required>
              {inp("statusAtArrival", "e.g., F-1 Student")}
            </Field>
            <Field label="25. Your Current Immigration Status or Category" fromProfile={!!student?.visaStatus} required>
              {inp("currentStatus", "e.g., F-1 Student", !!student?.visaStatus)}
            </Field>
          </div>
          <div className="mb-4">
            <Field label="26. SEVIS Number (if any)" fromProfile={!!student?.sevisNumber}>
              {inp("sevisNumber", "N-XXXXXXXXXX", !!student?.sevisNumber)}
            </Field>
          </div>

          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Eligibility Category</h3>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Field label="27. Eligibility Category" required>
              <Input value={form.eligibilityCategory} readOnly className="h-8 bg-primary/5 text-sm font-mono font-semibold" />
            </Field>
            <div className="flex items-end pb-1">
              <span className="text-xs text-muted-foreground">
                {formType === "opt"
                  ? "(c)(3)(B) — Post-completion OPT for F-1 students"
                  : "(c)(3)(C) — STEM OPT Extension for F-1 STEM graduates"}
              </span>
            </div>
          </div>

          {formType === "stem-opt" && (
            <>
              <h3 className="mb-3 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Item 28 — STEM OPT Details (c)(3)(C)</h3>
              <div className="grid grid-cols-1 gap-3">
                <Field label="28.a. Degree (STEM field)" fromProfile={!!student?.major}>
                  {inp("stemDegree", "e.g., Computer Science", !!student?.major)}
                </Field>
                <Field label="28.b. Employer's Name as Listed in E-Verify" required>
                  {inp("stemEmployerName", "Employer name")}
                </Field>
                <Field label="28.c. Employer's E-Verify Company Identification Number" required>
                  {inp("stemEmployerEVerify", "E-Verify ID")}
                </Field>
              </div>
            </>
          )}
        </Card>

        {/* PART 3 */}
        <Card className="mb-6 border-border/60 p-5">
          <h2 className="mb-4 border-b pb-2 text-sm font-bold uppercase tracking-wide">Part 3. Applicant's Statement, Contact Information, Declaration, Certification, and Signature</h2>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <Field label="3. Applicant's Daytime Telephone Number" fromProfile={!!student?.phoneNumber} required>
              {inp("dayTimePhone", "e.g., 6087220091", !!student?.phoneNumber)}
            </Field>
            <Field label="4. Applicant's Mobile Telephone Number (if any)" fromProfile={!!student?.phoneNumber}>
              {inp("mobilePhone", "e.g., 6087220091", !!student?.phoneNumber)}
            </Field>
          </div>
          <div className="mb-4">
            <Field label="5. Applicant's Email Address (if any)" fromProfile={!!student?.email}>
              {inp("email", "email@example.com", !!student?.email)}
            </Field>
          </div>
          <div className="mb-4">
            <Field label="Applicant's Statement — Select one:">
              {sel("statementType", [
                { value: "1a", label: "1.a. I can read and understand English, and I have read and understand every question and instruction on this application." },
                { value: "1b", label: "1.b. The interpreter named in Part 4 read to me every question and instruction on this application in a language I am fluent in." },
              ])}
            </Field>
          </div>

          <div className="mb-4 rounded-md border border-border bg-muted/20 p-4 text-xs text-muted-foreground leading-relaxed">
            <p className="mb-2 font-semibold text-foreground">Applicant's Declaration and Certification</p>
            <p>I certify, under penalty of perjury, that all of the information in my application and any document submitted with it were provided or authorized by me, that I reviewed and understand all of the information contained in, and submitted with, my application and that all of this information is complete, true, and correct.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="7.a. Applicant's Signature (sign on printed form)" required>
              <div className="h-10 rounded-md border border-dashed border-border bg-muted/10 flex items-center justify-center text-xs text-muted-foreground">
                Sign here on the printed form
              </div>
            </Field>
            <Field label="7.b. Date of Signature (mm/dd/yyyy)" required>
              <Input type="date" value={form.signatureDate} onChange={(e) => set("signatureDate", e.target.value)} className="h-8 text-sm" />
            </Field>
          </div>
        </Card>

        {/* Footer */}
        <div className="rounded-lg border border-border/40 bg-muted/20 p-4 text-xs text-muted-foreground">
          <p><strong>Important:</strong> This tool generates a draft of Form I-765 pre-filled with your profile information. You must review every field, make corrections as needed, print the form, and sign it in ink. File online at <strong>myUSCIS.gov</strong> or mail to USCIS with the required $410 filing fee and supporting documents. For {formType === "opt" ? "OPT" : "STEM OPT"} you need: passport copy, I-94, all I-20s, {formType === "opt" ? "DSO recommendation in SEVIS" : "updated I-20 with STEM OPT recommendation, current EAD, I-983"}.</p>
        </div>
      </div>
    </div>
  )
}
