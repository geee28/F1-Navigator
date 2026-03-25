"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MapPin, User, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { meetingsApi, type MeetingRecord } from "@/lib/api"

export function MeetingScheduler() {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    date: "",
    time: "",
    topic: "General Questions",
    message: "",
  })

  useEffect(() => {
    meetingsApi.list()
      .then(({ meetings }) => setMeetings(meetings))
      .catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.date || !formData.time) return

    setIsSubmitting(true)
    try {
      const created = await meetingsApi.create({
        name: formData.name,
        email: formData.email,
        preferred_date: formData.date,
        preferred_time: formData.time,
        topic: formData.topic,
        details: formData.message || undefined,
      })
      setMeetings((prev) => [...prev, created])
      setSubmittedEmail(formData.email)
      setFormData({ name: "", email: "", date: "", time: "", topic: "General Questions", message: "" })
      setTimeout(() => setSubmittedEmail(""), 5000)
    } catch (err) {
      console.error("Failed to create meeting:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <section className="py-2">
      <div className="mb-8">
        <h2 className="flex items-center gap-3 text-xl font-bold tracking-tight sm:text-3xl">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          Connect with International Student Office
        </h2>
        <p className="mt-2 text-muted-foreground">
          Schedule a meeting with your university's international student services
        </p>
      </div>

      {submittedEmail && (
        <Alert className="mb-6 border-primary/50 bg-primary/5">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            Meeting request submitted! The ISO will contact you shortly at {submittedEmail}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <Card className="overflow-hidden border-border/50 p-6 lg:col-span-2">
          <h3 className="mb-6 text-lg font-semibold">Request a Meeting</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Full Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                  disabled={isSubmitting}
                  required
                  style={{ fontSize: "16px" }}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@university.edu"
                  disabled={isSubmitting}
                  required
                  style={{ fontSize: "16px" }}
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Preferred Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={today}
                  disabled={isSubmitting}
                  required
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 rounded-md border px-3 py-1 text-base shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ width: "95%", fontSize: "16px", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Preferred Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  disabled={isSubmitting}
                  required
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 rounded-md border px-3 py-1 text-base shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ width: "95%", fontSize: "16px", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Topic</label>
              <Select value={formData.topic} onValueChange={(v) => setFormData({ ...formData, topic: v })}>
                <SelectTrigger disabled={isSubmitting}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General Questions">General Questions</SelectItem>
                  <SelectItem value="OPT Process">OPT Process</SelectItem>
                  <SelectItem value="STEM OPT Extension">STEM OPT Extension</SelectItem>
                  <SelectItem value="H-1B Planning">H-1B Planning</SelectItem>
                  <SelectItem value="CPT Authorization">CPT Authorization</SelectItem>
                  <SelectItem value="SEVIS Matters">SEVIS Matters</SelectItem>
                  <SelectItem value="Travel & Re-entry">Travel &amp; Re-entry</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Additional Details (Optional)</label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us more about your situation or questions..."
                rows={4}
                disabled={isSubmitting}
                style={{ fontSize: "16px" }}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !formData.name || !formData.email || !formData.date || !formData.time}
            >
              {isSubmitting ? "Submitting..." : "Request Meeting"}
            </Button>
          </form>
        </Card>

        {/* Info Card */}
        <div className="space-y-4">
          <Card className="border-border/50 bg-primary/5 p-6">
            <h3 className="mb-4 font-semibold">Meeting Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <MapPin className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground">Your University's International Office</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-muted-foreground">30-60 minutes</p>
                </div>
              </div>
              <div className="flex gap-3">
                <User className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Advisor</p>
                  <p className="text-muted-foreground">International Student Advisor</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-border/50 bg-accent/5 p-6">
            <h3 className="mb-4 font-semibold">What to Bring</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Passport</li>
              <li>• I-20 or current visa</li>
              <li>• Any questions in writing</li>
              <li>• Recent pay stubs (if applicable)</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Recent Meetings */}
      {meetings.length > 0 && (
        <div className="mt-12">
          <h3 className="mb-4 text-lg font-semibold">Your Meeting Requests</h3>
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <Card key={meeting.id} className="border-border/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{meeting.topic}</h4>
                      <span
                        className={`text-xs font-medium rounded-full px-2 py-1 ${
                          meeting.status === "confirmed"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {meeting.status === "confirmed" ? "Confirmed" : "Pending"}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                      {meeting.preferred_date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {meeting.preferred_date}
                        </div>
                      )}
                      {meeting.preferred_time && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {meeting.preferred_time}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {meeting.name}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
