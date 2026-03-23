"""
Deadline notification helpers.

- compute_key_dates : mirrors computeKeyDates() in work-authorization-flowchart.tsx
- send_notification_email : sends an HTML email via SMTP
- run_daily_notifications : called by the APScheduler job; checks every user
                            and fires emails for deadlines exactly 5 days away
"""

import asyncio
import calendar
import os
import smtplib
from datetime import date, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# ── SMTP config (set these in .env) ──────────────────────────────────────────

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)

DAYS_AHEAD = 5  # how many days before a deadline to send the email

# ── Date math helpers ─────────────────────────────────────────────────────────

def _add_months(d: date, months: int) -> date:
    """Add `months` calendar months to `d`, clamping end-of-month."""
    m = d.month - 1 + months
    year = d.year + m // 12
    month = m % 12 + 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


# ── Key-date computation ──────────────────────────────────────────────────────

def compute_key_dates(grad_date: date, process: str) -> list[dict]:
    """
    Returns a list of dicts:
      { "label": str, "date": date, "action": str }
    Mirrors the JS computeKeyDates() in work-authorization-flowchart.tsx.
    """
    if process == "opt":
        earliest   = grad_date - timedelta(days=90)
        opt_expiry = _add_months(grad_date, 12)
        return [
            {
                "label": "Earliest OPT application window opens (90 days before graduation)",
                "date":  earliest,
                "action": (
                    "Submit your I-765 application to USCIS for OPT work authorization. "
                    "File online at myUSCIS and pay the $410 filing fee. "
                    "Make sure you have your DSO OPT recommendation in SEVIS first."
                ),
            },
            {
                "label": "OPT expiration (12 months from graduation)",
                "date":  opt_expiry,
                "action": (
                    "Your OPT EAD will expire soon. If you hold a STEM degree and are employed "
                    "by an E-Verify employer, apply for the STEM OPT extension 90 days before this date. "
                    "Otherwise, ensure you have another work authorization or immigration status in place."
                ),
            },
        ]

    if process == "stem-opt":
        opt_expiry    = _add_months(grad_date, 12)
        stem_earliest = opt_expiry - timedelta(days=90)
        eval_12mo     = _add_months(grad_date, 24)
        stem_expiry   = _add_months(grad_date, 36)
        return [
            {
                "label": "Earliest STEM OPT application (90 days before OPT expiry)",
                "date":  stem_earliest,
                "action": (
                    "Start your STEM OPT extension process. Complete Form I-983 with your employer, "
                    "request an updated I-20 from your DSO, then file I-765 with USCIS ($410 fee). "
                    "Apply early — USCIS processing can take 3–5 months."
                ),
            },
            {
                "label": "12-month STEM OPT self-evaluation due",
                "date":  eval_12mo,
                "action": (
                    "Complete and submit your 12-month I-983 self-evaluation to your DSO. "
                    "This is required for maintaining your STEM OPT compliance. "
                    "Coordinate with your supervisor to fill out the evaluation sections together."
                ),
            },
            {
                "label": "STEM OPT expiration (24 months)",
                "date":  stem_expiry,
                "action": (
                    "Your STEM OPT authorization expires soon. Ensure you have an alternative "
                    "work authorization (e.g., H-1B cap-gap or change of status) in place. "
                    "Consult your DSO and immigration attorney immediately."
                ),
            },
        ]

    if process == "cpt":
        return [
            {
                "label": "CPT must end by graduation (program end date)",
                "date":  grad_date,
                "action": (
                    "Your CPT authorization must end on or before your program end date. "
                    "Ensure all CPT employment concludes by this date. "
                    "Notify your DSO if there are any changes to your employment end date."
                ),
            },
        ]

    if process == "h1b":
        # Lottery year: same year if graduation is before March 1, else next year
        lottery_year     = grad_date.year if grad_date < date(grad_date.year, 3, 1) else grad_date.year + 1
        sponsor_deadline = date(lottery_year, 2, 28)           # Feb 28
        lottery_close    = date(lottery_year, 3, 25)           # ~late March
        petition_deadline = date(lottery_year, 6, 30)          # June 30
        return [
            {
                "label": f"Deadline to secure H-1B sponsor (before Feb {lottery_year} lottery)",
                "date":  sponsor_deadline,
                "action": (
                    "Finalize your H-1B sponsorship with your employer. Confirm they are registered "
                    "on myUSCIS and prepared to register you in the H-1B lottery, which opens in March. "
                    "If your employer has not started the process, contact HR and your immigration attorney now."
                ),
            },
            {
                "label": f"H-1B lottery registration closes (~March {lottery_year})",
                "date":  lottery_close,
                "action": (
                    "Confirm your employer has registered you in the H-1B lottery on myUSCIS. "
                    "Registration is typically open for about 2–3 weeks in March. "
                    "US master's degree holders get a second-round lottery chance — confirm your employer selected this."
                ),
            },
            {
                "label": f"H-1B I-129 petition filing deadline (June 30, {lottery_year})",
                "date":  petition_deadline,
                "action": (
                    "If you were selected in the H-1B lottery, your employer must file the complete "
                    f"I-129 petition with USCIS by June 30, {lottery_year}. "
                    "Follow up with your HR team and immigration attorney. "
                    "Premium Processing ($2,805) gets a decision in 15 business days."
                ),
            },
        ]

    return []


# ── Email sending ─────────────────────────────────────────────────────────────

def _send_sync(to_email: str, subject: str, body_html: str, body_text: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = SMTP_FROM
    msg["To"]      = to_email
    msg.attach(MIMEText(body_text, "plain"))
    msg.attach(MIMEText(body_html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
        server.ehlo()
        server.starttls()
        if SMTP_USER and SMTP_PASS:
            server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_FROM, to_email, msg.as_string())


async def send_notification_email(
    to_email:       str,
    student_name:   str,
    process_label:  str,
    deadline_label: str,
    deadline_date:  date,
    action_text:    str,
) -> None:
    subject = f"⏰ F1 Navigator: \"{deadline_label}\" is in {DAYS_AHEAD} days"
    date_str = deadline_date.strftime("%B %d, %Y")

    body_html = f"""<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
  <div style="background:#500000;padding:20px;border-radius:8px 8px 0 0">
    <h1 style="color:white;margin:0;font-size:20px">F1 Navigator — Deadline Reminder</h1>
  </div>
  <div style="border:1px solid #ddd;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <p style="font-size:16px">Hi {student_name},</p>
    <p>
      This is a reminder that an important deadline in your
      <strong>{process_label}</strong> process is approaching
      <strong>in {DAYS_AHEAD} days</strong>.
    </p>

    <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:16px;margin:20px 0;border-radius:4px">
      <p style="margin:0 0 8px;font-weight:bold;font-size:15px">📅 {deadline_label}</p>
      <p style="margin:0;color:#b45309">Due: {date_str}</p>
    </div>

    <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;margin:20px 0;border-radius:4px">
      <p style="margin:0 0 8px;font-weight:bold;font-size:14px">✅ What to do:</p>
      <p style="margin:0;font-size:14px">{action_text}</p>
    </div>

    <p style="font-size:13px;color:#666">
      You are receiving this because you enabled notifications for <strong>{process_label}</strong>
      in your F1 Navigator profile. Log in to manage your notification preferences.
    </p>

    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
    <p style="font-size:11px;color:#999;margin:0">
      This is an automated reminder for general guidance only — not legal advice.
      Always consult your DSO and an immigration attorney for your specific situation.
    </p>
  </div>
</body>
</html>"""

    body_text = f"""Hi {student_name},

DEADLINE REMINDER — {process_label}

{deadline_label}
Due: {date_str}

What to do:
{action_text}

---
You are receiving this because you enabled notifications for {process_label} in your F1 Navigator profile.

This information is for general guidance only and does not constitute legal advice.
Always consult your DSO and an immigration attorney for your specific situation.
"""

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None, _send_sync, to_email, subject, body_html, body_text
    )


# ── Daily runner (called by APScheduler) ─────────────────────────────────────

PROCESS_LABELS = {
    "opt":      "OPT (Optional Practical Training)",
    "stem-opt": "STEM OPT Extension",
    "cpt":      "CPT (Curricular Practical Training)",
    "h1b":      "H-1B Specialty Occupation",
}


async def run_daily_notifications(db) -> None:
    """
    Fetch all users who have notification preferences set + a graduation date,
    compute their key dates, and email anyone whose deadline is exactly
    DAYS_AHEAD days from today.
    """
    print("[notifications] ── Daily run started ──────────────────────────")

    if not SMTP_USER:
        print("[notifications] SMTP_USER not set — skipping.")
        return

    users  = await db.get_users_for_notifications()
    today  = date.today()
    target = today + timedelta(days=DAYS_AHEAD)
    print(f"[notifications] Today: {today}  |  Looking for deadlines on: {target}")
    print(f"[notifications] Users with notifications enabled: {len(users)}")

    if not users:
        print("[notifications] No users found — check graduation_date + notification_guides are saved in DB.")

    sent = 0

    for user in users:
        email    = user["email"]
        name     = user.get("name") or "Student"
        grad_str = user.get("graduation_date")
        guides   = user.get("notification_guides") or []
        print(f"[notifications] User: {email} | grad_date raw: {grad_str!r} | guides: {guides}")

        if not grad_str or not guides:
            print(f"[notifications]   → Skipping — missing grad_date or guides")
            continue

        try:
            grad_date = date.fromisoformat(str(grad_str)[:10])
        except ValueError as exc:
            print(f"[notifications]   → Could not parse grad_date '{grad_str}': {exc}")
            continue

        for guide in guides:
            key_dates = compute_key_dates(grad_date, guide)
            print(f"[notifications]   Guide '{guide}' → {len(key_dates)} key date(s):")
            for kd in key_dates:
                match = "✓ MATCH" if kd["date"] == target else f"✗ ({kd['date']})"
                print(f"[notifications]     {match}  {kd['label']}")
                if kd["date"] != target:
                    continue
                try:
                    await send_notification_email(
                        to_email       = email,
                        student_name   = name,
                        process_label  = PROCESS_LABELS.get(guide, guide),
                        deadline_label = kd["label"],
                        deadline_date  = kd["date"],
                        action_text    = kd["action"],
                    )
                    sent += 1
                    print(f"[notifications]   → Email sent to {email}")
                except Exception as exc:
                    print(f"[notifications]   → SMTP ERROR for {email}: {exc}")

    print(f"[notifications] ── Daily run complete — {sent} email(s) sent ──")
