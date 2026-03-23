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
    name: student?.name || "",
    university: student?.university || "",
    major: student?.major || "",
    degree: student?.degree || ("Bachelor" as const),
    year: student?.year || 1,
    visaStatus: student?.visaStatus || ("F-1" as const),
    countryOfCitizenship: student?.countryOfCitizenship || "",
    graduationDate: student?.graduationDate || "",
  })

  const handleSave = async () => {
    await updateProfile({
      name: formData.name,
      university: formData.university,
      major: formData.major,
      degree: formData.degree,
      year: formData.year,
      visaStatus: formData.visaStatus,
      countryOfCitizenship: formData.countryOfCitizenship,
      graduationDate: formData.graduationDate,
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <Card className="border-border/50 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium">Full Name</label>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                />
              ) : (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{formData.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium">Email (Read-only)</label>
              <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{student.email}</p>
            </div>

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

        {/* Immigration Status Card */}
        <Card className="border-border/50 p-6">
          <h3 className="mb-6 text-lg font-semibold">Immigration Status</h3>

          <div className="space-y-4">
            {/* Degree */}
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

            {/* Year */}
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

            {/* Expected / Actual Graduation Date */}
            <div>
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

            {isEditing && (
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} className="flex-1 gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Notification Preferences Card */}
      <Card className="mt-6 border-border/50 p-6">
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
              Set your <strong>Expected Graduation Date</strong> in the Immigration Status card above so we can
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
    </section>
  )
}
