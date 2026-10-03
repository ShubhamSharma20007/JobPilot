import { Bot, CheckCircle2, FileText, Loader2, Search, Sparkles, Table, UserSearch } from "lucide-react"
import { Reveal } from "./Reveal"

const gradientText = "bg-linear-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent"

const POINTS = [
  { icon: FileText, title: "Reads your resume", body: "Builds a profile of your skills and the roles you are after." },
  { icon: Search, title: "Finds matching openings", body: "Scans job listings and keeps only the roles that fit you." },
  { icon: UserSearch, title: "Finds the recruiter's email", body: "Looks up and verifies a contact for each opening." },
  { icon: Table, title: "Updates your sheet", body: "New recruiters appear as rows, ready for JobPilot to email." },
]

const FOUND = [
  { email: "priya@acme.com", role: "Full Stack Developer" },
  { email: "talent@globex.io", role: "React Engineer" },
  { email: "jobs@initech.dev", role: "Backend Developer" },
]

export function ComingSoon() {
  return (
    <section id="coming-soon" className="relative isolate overflow-hidden border-t py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 right-[-10rem] h-[28rem] w-[36rem] -translate-y-1/2 rounded-full bg-violet-500/15 blur-3xl dark:bg-violet-500/20" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Copy */}
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-indigo-500/40 bg-indigo-500/5 px-3 py-1 text-xs font-medium text-indigo-500">
            <Sparkles className="size-3.5" />
            Coming soon
          </span>
          <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight">
            An AI agent that <span className={gradientText}>finds recruiters for you.</span>
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Today you add recruiter emails yourself. Soon an AI agent will do the searching: it reads your resume, finds
            matching openings, looks up the recruiter's email and adds it to your sheet automatically.
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
        </Reveal>

        {/* Preview of the agent at work */}
        <Reveal delay={120}>
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-4 -z-10 rounded-[2rem] bg-linear-to-r from-indigo-500/20 to-violet-500/20 blur-2xl"
            />
            <div className="overflow-hidden rounded-2xl border bg-card shadow-xl shadow-primary/5">
              <div className="flex items-center justify-between border-b bg-muted px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="grid size-6 place-items-center rounded-md bg-linear-to-br from-indigo-500 to-violet-500 text-white">
                    <Bot className="size-3.5" />
                  </span>
                  JobPilot Agent
                </div>
                <span className="rounded-full border border-dashed px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  Preview
                </span>
              </div>

              <ul className="space-y-2 border-b p-4 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="size-4 text-emerald-500" /> Read your resume
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="size-4 text-emerald-500" /> Found 12 matching openings
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Loader2 className="size-4 animate-spin text-indigo-500 motion-reduce:animate-none" />
                  Finding recruiter contacts…
                </li>
              </ul>

              <div className="p-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Added to your sheet</p>
                <ul className="divide-y overflow-hidden rounded-xl border">
                  {FOUND.map((r) => (
                    <li key={r.email} className="flex items-center justify-between gap-3 bg-muted/30 px-3 py-2.5">
                      <span className="truncate font-mono text-xs">{r.email}</span>
                      <span className="shrink-0 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-500">
                        {r.role}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}