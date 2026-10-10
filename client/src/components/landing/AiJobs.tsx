import { Link } from "react-router-dom"
import { CheckCircle2, FileText, KeyRound, MapPin, Search, Send, Sparkles } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/redux/hooks/useAuth"
import { Reveal } from "./Reveal"

const gradientText = "bg-linear-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent"

const POINTS = [
  { icon: FileText, title: "Reads your resume", body: "Your default PDF becomes a profile of your skills and target roles. No forms to fill in." },
  { icon: Search, title: "Finds fresh openings", body: "Jobs from Hacker News, Remotive, Adzuna and JSearch are collected daily and ranked against your profile." },
  { icon: Sparkles, title: "Writes each email for you", body: "AI apply drafts a short, honest email from your resume facts only, using your own AI key." },
  { icon: Send, title: "Sends at a safe pace", body: "The email joins your sheet and goes out from your Gmail with your daily limit, gaps and cool-down." },
]

const STEPS = ["Resume read", "12 matches found", "Email written", "Queued to send"]

export function AiJobs() {
  const { user } = useAuth()

  return (
    <section id="ai-jobs" className="relative isolate overflow-hidden border-t py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 right-[-10rem] h-[28rem] w-[36rem] -translate-y-1/2 rounded-full bg-violet-500/15 blur-3xl dark:bg-violet-500/20" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="size-3.5 text-indigo-500" />
            New: Find jobs
          </span>
          <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight">
            Don't have emails yet? <span className={gradientText}>Find jobs and apply with AI.</span>
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Browse fresh openings ranked against your resume. When a post lists a recruiter's email, one click writes a
            personalised application and queues it from your own Gmail.
          </p>

          <ul className="mt-8 space-y-5">
            {POINTS.map((p, i) => (
              <li key={p.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-linear-to-br from-indigo-500/15 to-violet-500/15 text-indigo-500 ring-1 ring-indigo-500/15">
                  <p.icon className="size-5" />
                </span>
                <div>
                  <p className="font-heading font-semibold">
                    <span className="mr-2 text-muted-foreground/60">{String(i + 1).padStart(2, "0")}</span>
                    {p.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {user ? (
              <Link to="/jobs" className={buttonVariants({ size: "lg", className: "h-11 px-6 text-base" })}>
                Browse jobs
              </Link>
            ) : (
              <a href="#top" className={buttonVariants({ size: "lg", className: "h-11 px-6 text-base" })}>
                Sign in to browse jobs
              </a>
            )}
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <KeyRound className="size-4 text-indigo-500" />
              Bring your own key: Gemini (free tier), OpenAI or Claude
            </span>
          </div>
        </Reveal>

        {/* Preview: a job card with the drafted email */}
        <Reveal delay={120}>
          <div className="relative">
            <div aria-hidden className="absolute -inset-4 -z-10 rounded-[2rem] bg-linear-to-r from-indigo-500/20 to-violet-500/20 blur-2xl" />
            <div className="overflow-hidden rounded-2xl border bg-card shadow-xl shadow-primary/5">
              <div className="flex items-start justify-between gap-3 border-b p-5">
                <div className="min-w-0">
                  <p className="font-heading font-semibold">Full Stack Developer</p>
                  <p className="text-sm text-muted-foreground">Acme Inc</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" /> Bengaluru, India · Adzuna · today
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 tabular-nums dark:text-emerald-400">
                  82% match
                </span>
              </div>

              <div className="space-y-2 border-b bg-muted/30 p-5 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Drafted by AI from your resume</p>
                <p className="font-medium">Application for Full Stack Developer at Acme</p>
                <p className="leading-relaxed text-muted-foreground">
                  Hi, I'm applying for the Full Stack Developer role. I've built production apps with React and Node.js…
                </p>
              </div>

              <ul className="grid grid-cols-2 gap-2 p-4 text-xs sm:grid-cols-4">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1.5">
                    <CheckCircle2 className={`size-3.5 shrink-0 ${i === 3 ? "text-indigo-500" : "text-emerald-500"}`} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}