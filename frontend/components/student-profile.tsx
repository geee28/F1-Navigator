"use client"

import { useState } from "react"
import { useAuth } from "./auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Save, LogOut, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function StudentProfile() {
  const { student, logout, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  const [formData, setFormData] = useState({
    name: student?.name || "",
    university: student?.university || "",
    major: student?.major || "",
    degree: student?.degree || ("Bachelor" as const),
    year: student?.year || 1,
    visaStatus: student?.visaStatus || ("F-1" as const),
  })

  const handleSave = async () => {
    await updateProfile({
      name: formData.name,
      university: formData.university,
      major: formData.major,
      degree: formData.degree,
      year: formData.year,
      visaStatus: formData.visaStatus,
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
                    <SelectItem value="Bachelor">Bachelor's</SelectItem>
                    <SelectItem value="Master">Master's</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
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
    </section>
  )
}
