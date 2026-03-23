"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./auth-context"
import { notificationsApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Save, LogOut, AlertCircle, Bell, BellOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function StudentProfile() {
  const { student, logout, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  // ── Notification prefs ──────────────────────────────────────────────────────
  const [notifGuides, setNotifGuides]     = useState<string[]>([])
  const [notifSaving, setNotifSaving]     = useState(false)
  const [notifSaved,  setNotifSaved]      = useState(false)

  useEffect(() => {
    notificationsApi.get()
      .then(({ guides }) => setNotifGuides(guides))
      .catch(() => {/* ignore — user may not be logged in yet */})
  }, [])

  const toggleGuide = async (guide: string) => {
    const next = notifGuides.includes(guide)
      ? notifGuides.filter((g) => g !== guide)
      : [...notifGuides, guide]
    setNotifGuides(next)
    setNotifSaving(true)
    try {
      await notificationsApi.update(next)
      setNotifSaved(true)
      setTimeout(() => setNotifSaved(false), 2000)
    } catch {
      // revert on error
      setNotifGuides(notifGuides)
    } finally {
      setNotifSaving(false)
    }
  }

  const [formData, setFormData] = useState({
    // Personal
    name: student?.name || "",
    middleName: student?.middleName || "",
    phoneNumber: student?.phoneNumber || "",
    dateOfBirth: student?.dateOfBirth || "",
    sex: student?.sex || "",
    maritalStatus: student?.maritalStatus || "",
    birthCity: student?.birthCity || "",
    birthCountry: student?.birthCountry || "",
    countryOfCitizenship: student?.countryOfCitizenship || "",
    // Academic & Immigration
    university: student?.university || "",
    major: student?.major || "",
    degree: student?.degree || ("Bachelor" as const),
    year: student?.year || 1,
    visaStatus: student?.visaStatus || ("F-1" as const),
    sevisNumber: student?.sevisNumber || "",
    graduationDate: student?.graduationDate || "",
    // Mailing Address
    mailingStreet: student?.mailingStreet || "",
    mailingApt: student?.mailingApt || "",
    mailingCity: student?.mailingCity || "",
    mailingState: student?.mailingState || "",
    mailingZip: student?.mailingZip || "",
  })

  const handleSave = async () => {
    await updateProfile({
      name: formData.name,
      middleName: formData.middleName,
      phoneNumber: formData.phoneNumber,
      dateOfBirth: formData.dateOfBirth,
      sex: formData.sex,
      maritalStatus: formData.maritalStatus,
      birthCity: formData.birthCity,
      birthCountry: formData.birthCountry,
      countryOfCitizenship: formData.countryOfCitizenship,
      university: formData.university,
      major: formData.major,
      degree: formData.degree,
      year: formData.year,
      visaStatus: formData.visaStatus,
      sevisNumber: formData.sevisNumber,
      graduationDate: formData.graduationDate,
      mailingStreet: formData.mailingStreet,
      mailingApt: formData.mailingApt,
      mailingCity: formData.mailingCity,
      mailingState: formData.mailingState,
      mailingZip: formData.mailingZip,
    })
    setIsEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!student) return null

  return (
    <section className="py-2">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            Student Profile
          </h2>
          <p className="mt-2 text-muted-foreground">Manage your student information and immigration status</p>
        </div>
        <Button variant="outline" onClick={logout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      {saved && (
        <Alert className="mb-6 border-primary/50 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">Profile updated successfully!</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Card 1 – Personal Information */}
        <Card className="border-border/50 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div>
              <label className="mb-2 block text-sm font-medium">Full Name</label>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.name || "Not set"}</p>
              )}
            </div>

            {/* Middle Name */}
            <div>
              <label className="mb-2 block text-sm font-medium">Middle Name</label>
              {isEditing ? (
                <Input
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  placeholder="Middle name (if any)"
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.middleName || "Not set"}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium">Email (Read-only)</label>
              <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{student.email}</p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="mb-2 block text-sm font-medium">Phone Number</label>
              {isEditing ? (
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="e.g., 6087220091"
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.phoneNumber || "Not set"}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="mb-2 block text-sm font-medium">Date of Birth</label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">
                  {formData.dateOfBirth
                    ? new Date(formData.dateOfBirth + "T00:00:00").toLocaleDateString("en-US", {
                        month: "long", day: "numeric", year: "numeric",
                      })
                    : "Not set"}
                </p>
              )}
            </div>

            {/* Sex */}
            <div>
              <label className="mb-2 block text-sm font-medium">Sex</label>
              {isEditing ? (
                <Select value={formData.sex} onValueChange={(v) => setFormData({ ...formData, sex: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.sex || "Not set"}</p>
              )}
            </div>

            {/* Marital Status */}
            <div>
              <label className="mb-2 block text-sm font-medium">Marital Status</label>
              {isEditing ? (
                <Select value={formData.maritalStatus} onValueChange={(v) => setFormData({ ...formData, maritalStatus: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.maritalStatus || "Not set"}</p>
              )}
            </div>

            {/* Place of Birth – City */}
            <div>
              <label className="mb-2 block text-sm font-medium">Place of Birth – City</label>
              {isEditing ? (
                <Input
                  value={formData.birthCity}
                  onChange={(e) => setFormData({ ...formData, birthCity: e.target.value })}
                  placeholder="e.g., Mumbai"
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.birthCity || "Not set"}</p>
              )}
            </div>

            {/* Place of Birth – Country */}
            <div>
              <label className="mb-2 block text-sm font-medium">Place of Birth – Country</label>
              {isEditing ? (
                <Input
                  value={formData.birthCountry}
                  onChange={(e) => setFormData({ ...formData, birthCountry: e.target.value })}
                  placeholder="e.g., India"
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.birthCountry || "Not set"}</p>
              )}
            </div>

            {/* Country of Citizenship */}
            <div>
              <label className="mb-2 block text-sm font-medium">Country of Citizenship</label>
              {isEditing ? (
                <Input
                  value={formData.countryOfCitizenship}
                  onChange={(e) => setFormData({ ...formData, countryOfCitizenship: e.target.value })}
                  placeholder="e.g., India, China, Brazil"
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.countryOfCitizenship || "Not set"}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Card 2 – Academic & Immigration */}
        <Card className="border-border/50 p-6">
          <h3 className="mb-6 text-lg font-semibold">Academic &amp; Immigration</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* University */}
            <div>
              <label className="mb-2 block text-sm font-medium">University</label>
              {isEditing ? (
                <Input
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  placeholder="e.g., MIT, Stanford, UC Berkeley"
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.university || "Not set"}</p>
              )}
            </div>

            {/* Major */}
            <div>
              <label className="mb-2 block text-sm font-medium">Major</label>
              {isEditing ? (
                <Input
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  placeholder="e.g., Computer Science, Engineering"
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.major || "Not set"}</p>
              )}
            </div>

            {/* Degree Level */}
            <div>
              <label className="mb-2 block text-sm font-medium">Degree Level</label>
              {isEditing ? (
                <Select value={formData.degree} onValueChange={(v) => setFormData({ ...formData, degree: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Associate">Associate's</SelectItem>
                    <SelectItem value="Bachelor">Bachelor's</SelectItem>
                    <SelectItem value="Post-Baccalaureate">Post-Baccalaureate</SelectItem>
                    <SelectItem value="Master">Master's</SelectItem>
                    <SelectItem value="MBA">MBA</SelectItem>
                    <SelectItem value="Professional">Professional Degree (JD/MD/DDS)</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
                    <SelectItem value="Doctorate">Doctorate (Other)</SelectItem>
                    <SelectItem value="Postdoctoral">Postdoctoral</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.degree}</p>
              )}
            </div>

            {/* Year of Study */}
            <div>
              <label className="mb-2 block text-sm font-medium">Year of Study</label>
              {isEditing ? (
                <Select value={String(formData.year)} onValueChange={(v) => setFormData({ ...formData, year: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        Year {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">Year {formData.year}</p>
              )}
            </div>

            {/* Visa Status */}
            <div>
              <label className="mb-2 block text-sm font-medium">Current Visa Status</label>
              {isEditing ? (
                <Select value={formData.visaStatus} onValueChange={(v) => setFormData({ ...formData, visaStatus: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F-1">F-1 Student</SelectItem>
                    <SelectItem value="OPT">OPT</SelectItem>
                    <SelectItem value="STEM-OPT">STEM OPT</SelectItem>
                    <SelectItem value="H-1B">H-1B Worker</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.visaStatus}</p>
              )}
            </div>

            {/* SEVIS Number */}
            <div>
              <label className="mb-2 block text-sm font-medium">SEVIS Number</label>
              {isEditing ? (
                <Input
                  value={formData.sevisNumber}
                  onChange={(e) => setFormData({ ...formData, sevisNumber: e.target.value })}
                  placeholder="e.g., N-0032146632"
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.sevisNumber || "Not set"}</p>
              )}
            </div>

            {/* Expected Graduation Date */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium">Expected / Actual Graduation Date</label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.graduationDate}
                  onChange={(e) => setFormData({ ...formData, graduationDate: e.target.value })}
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">
                  {formData.graduationDate
                    ? new Date(formData.graduationDate + "T00:00:00").toLocaleDateString("en-US", {
                        month: "long", day: "numeric", year: "numeric",
                      })
                    : "Not set"}
                </p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="mt-6 flex gap-3">
              <Button onClick={handleSave} className="flex-1 gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          )}
        </Card>

        {/* Card 3 – Mailing Address */}
        <Card className="border-border/50 p-6">
          <h3 className="mb-6 text-lg font-semibold">Mailing Address</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Street */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium">Street Number and Name</label>
              {isEditing ? (
                <Input
                  value={formData.mailingStreet}
                  onChange={(e) => setFormData({ ...formData, mailingStreet: e.target.value })}
                  placeholder="e.g., 2850 Pleasant View Rd"
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.mailingStreet || "Not set"}</p>
              )}
            </div>

            {/* Apt */}
            <div>
              <label className="mb-2 block text-sm font-medium">Apt / Suite / Floor</label>
              {isEditing ? (
                <Input
                  value={formData.mailingApt}
                  onChange={(e) => setFormData({ ...formData, mailingApt: e.target.value })}
                  placeholder="e.g., Unit 202"
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.mailingApt || "Not set"}</p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="mb-2 block text-sm font-medium">City</label>
              {isEditing ? (
                <Input
                  value={formData.mailingCity}
                  onChange={(e) => setFormData({ ...formData, mailingCity: e.target.value })}
                  placeholder="City"
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.mailingCity || "Not set"}</p>
              )}
            </div>

            {/* State */}
            <div>
              <label className="mb-2 block text-sm font-medium">State</label>
              {isEditing ? (
                <Input
                  value={formData.mailingState}
                  onChange={(e) => setFormData({ ...formData, mailingState: e.target.value })}
                  placeholder="e.g., TX"
                  maxLength={2}
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.mailingState || "Not set"}</p>
              )}
            </div>

            {/* Zip */}
            <div>
              <label className="mb-2 block text-sm font-medium">Zip Code</label>
              {isEditing ? (
                <Input
                  value={formData.mailingZip}
                  onChange={(e) => setFormData({ ...formData, mailingZip: e.target.value })}
                  placeholder="e.g., 77840"
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.mailingZip || "Not set"}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Card 4 – Email Notifications */}
        <Card className="border-border/50 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Bell className="h-5 w-5 text-primary" />
                Email Notifications
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get an email reminder 5 days before key deadlines in the selected process guides.
                Reminders are sent to <span className="font-medium text-foreground">{student.email}</span>.
              </p>
            </div>
            {notifSaving && (
              <span className="text-xs text-muted-foreground">Saving…</span>
            )}
            {notifSaved && !notifSaving && (
              <span className="text-xs text-primary">Saved ✓</span>
            )}
          </div>

          {!formData.graduationDate && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Set your <strong>Expected Graduation Date</strong> in the Academic &amp; Immigration card above so we can
                compute your personalized deadlines.
              </span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                { id: "opt",      label: "OPT",             desc: "Optional Practical Training — 12-month post-graduation work auth" },
                { id: "stem-opt", label: "STEM OPT",        desc: "24-month STEM extension — self-evaluation & expiry reminders" },
                { id: "cpt",      label: "CPT",             desc: "Curricular Practical Training — end-by-graduation deadline" },
                { id: "h1b",      label: "H-1B",            desc: "Specialty occupation visa — sponsor, lottery & petition deadlines" },
              ] as const
            ).map(({ id, label, desc }) => (
              <label
                key={id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-secondary/40"
              >
                <Checkbox
                  id={`notif-${id}`}
                  checked={notifGuides.includes(id)}
                  onCheckedChange={() => toggleGuide(id)}
                  disabled={notifSaving}
                  className="mt-0.5"
                />
                <div>
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </div>
              </label>
            ))}
          </div>

          {notifGuides.length === 0 && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <BellOff className="h-3.5 w-3.5" />
              No notifications enabled. Select at least one guide above to start receiving reminders.
            </p>
          )}
        </Card>
      </div>
    </section>
  )
}
