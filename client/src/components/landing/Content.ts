import { Eye, Gauge, Mail, RefreshCw, ShieldCheck, Table } from "lucide-react"

export const APP = {
  name: "JobPilot",
  headline: "Write your job application email once. JobPilot sends the rest.",
  sub: "Add recruiter emails to a Google Sheet. JobPilot sends personalised applications from your own Gmail with your resume attached, then tracks every result.",
}

export const STEPS = [
  { title: "Sign in and connect Gmail", body: "Allow JobPilot to send mail from your own account. Nothing goes out until you say so." },
  { title: "Add your resume and template", body: "Upload a PDF, write your email with placeholders like {{company}} and {{role}}, and send a test to yourself." },
  { title: "Paste recruiter emails", body: "Paste a whole list into your sheet, one per line. Bad and duplicate addresses are flagged instantly." },
  { title: "JobPilot sends and tracks", body: "Emails go out one by one at a safe pace. Sent and failed results appear right in your sheet." },
]

export const FEATURES = [
  { icon: Mail, title: "Sent from your own Gmail", body: "Recruiters see your address, not ours. One recipient per message, with your PDF resume attached.", span: "md:col-span-2" },
  { icon: ShieldCheck, title: "Never emails twice", body: "Duplicate addresses are skipped, with a cool-down you can set. A crash mid-run never causes a repeat send.", span: "" },
  { icon: Gauge, title: "Paced like a person", body: "A daily limit (30 to 50 by default), random 30 to 120 second gaps and a send window you choose.", span: "" },
  { icon: Table, title: "Your sheet shows everything", body: "Three tabs: emails, success and failure. Failures include the reason and the number of attempts.", span: "md:col-span-2" },
  { icon: Eye, title: "Preview and test first", body: "See your template filled with sample data and send it to yourself before any recruiter gets it.", span: "md:col-span-2" },
  { icon: RefreshCw, title: "Retries and checks", body: "Bad addresses are caught before sending. Temporary errors retry up to 3 times with backoff.", span: "" },
]

export const FLOW = [
  { title: "Your list", sub: "Google Sheet, CSV or pasted emails" },
  { title: "Check and dedupe", sub: "Valid addresses only, no repeats" },
  { title: "Paced queue", sub: "Daily limit, delays, send window" },
  { title: "Your Gmail", sub: "Template and resume attached" },
  { title: "Recruiter inbox", sub: "One personal email each" },
]

export const FLOW_V2 = [
  { title: "Resume", sub: "Parsed into a profile" },
  { title: "Find openings", sub: "Job feeds and search" },
  { title: "Match score", sub: "Only relevant roles" },
  { title: "Find contact", sub: "Verified recruiter email" },
  { title: "You approve", sub: "Then it joins your sheet" },
]

export const FAQ = [
  { q: "Do emails come from my address?", a: "Yes. JobPilot sends through your own Gmail using Google's official API, so replies come straight to your inbox." },
  { q: "Will Gmail flag my account?", a: "JobPilot defaults to 30 to 50 emails a day with random delays and a send window, which is far below Gmail's limits. Start low and increase slowly. A separate address for job hunting is a safe choice." },
  { q: "Could it email the same recruiter twice?", a: "No. Each address is sent once, and you can set a cool-down before it is allowed again. Restarting the worker never creates a duplicate." },
  { q: "What does it need access to, and is it safe?", a: "Permission to send email and to use the sheet it creates. Your Google tokens are stored encrypted. You can revoke access and delete your data at any time." },
  { q: "How do I find recruiter emails?", a: "For now you add them yourself and JobPilot handles everything after that. Automatic discovery of openings and contacts is planned next, with a review step so you approve each one." },
  { q: "Can I use more than one resume?", a: "Yes. Upload PDFs up to 5 MB each and choose a default, for example one for full stack roles and one for AI roles." },
]
export const SOCIALS = {
  linkedin: "https://www.linkedin.com/in/your-handle",
  twitter: "https://x.com/your-handle",
}


export const STATS = [
  { value: "30–50", label: "emails a day by default" },
  { value: "30–120s", label: "random gap between sends" },
  { value: "3×", label: "retries with backoff" },
  { value: "0", label: "duplicate sends" },
]
