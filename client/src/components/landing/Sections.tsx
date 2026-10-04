import { Link } from "react-router-dom"
import { APP, FAQ, FEATURES, FLOW, FLOW_V2, SOCIALS, STATS, STEPS } from "./Content"
import { ArrowRight, ArrowUp, Ban, CheckCircle2, Clock, FileText, Mail, RefreshCw } from "lucide-react"
import { DemoMedia } from "./DemoMedia"
import { FlowRow } from "./Diagram"
import { Button, buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/redux/hooks/useAuth"
import { GoogleSignIn } from "./GoogleSignIn"
import { SocialLinks } from "./SocialLinks"
import { Reveal } from "./Reveal"
import { useState } from "react"
import { ProductHuntBadge } from "./ProductHuntBadge"

const gradientText =
  "bg-linear-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent"

const FOOTER_PRODUCT = [
  { hash: "#how-it-works", label: "How it works" },
  { hash: "#pipeline", label: "Flow" },
  { hash: "#features", label: "Features" },
  { hash: "#faq", label: "FAQ" },
]

const footerLink = "text-sm text-muted-foreground transition-colors hover:text-foreground"

const QUEUE = [
  { email: "elonmusk@starlink.org", note: "Sent", tone: "ok", icon: CheckCircle2 },
  { email: "markzuckerberg@meta.com", note: "Sent", tone: "ok", icon: CheckCircle2 },
  { email: "sundarpichai@gmail.com", note: "Skipped: emailed 12 days ago", tone: "skip", icon: Ban },
  { email: "satyanadella@microsoft.com", note: "Retrying 2 of 3", tone: "retry", icon: RefreshCw },
  { email: "shubham.sharma@mastersunion.org", note: "Next email in 74s", tone: "wait", icon: Clock },
] as const

const TONES = {
  ok: "text-emerald-500",
  skip: "text-amber-500",
  retry: "text-indigo-500",
  wait: "text-muted-foreground",
} as const

export function Hero() {
  const { user, initialized } = useAuth()

  return (
    <section id="top" className="relative isolate overflow-hidden">
      {/* Background: dotted grid + glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 [background-size:24px_24px] bg-[radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]" />
        <div className="absolute top-[-12rem] left-1/2 h-[30rem] w-[56rem] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl dark:bg-indigo-500/25" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 text-center lg:pt-28">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 motion-reduce:animate-none">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Sends from your own Gmail, not ours
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl font-heading text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
            Write your job application email once.{" "}
            <span className={gradientText}>JobPilot sends the rest.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">{APP.sub}</p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {!initialized ? (
              <div className="h-10 w-[180px]" />
            ) : user ? (
              <Link
                to="/sheet"
                className={buttonVariants({ size: "lg", className: "h-11 px-6 text-base" })}
              >
                Open your sheet
              </Link>
            ) : (
              <GoogleSignIn />
            )}
            <a
              href="#how-it-works"
              className={buttonVariants({
                variant: "ghost",
                size: "lg",
                className: "h-11 px-5 text-base",
              })}
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Product Hunt Badge */}

        <div className="mt-6 flex justify-center">
          <ProductHuntBadge />
        </div>
        {/* Demo with glow and floating chips */}
        <div className="relative mx-auto mt-16 max-w-5xl text-left">
          <div
            aria-hidden
            className="absolute -inset-4 -z-10 rounded-[2rem] bg-linear-to-r from-indigo-500/30 to-violet-500/30 blur-2xl"
          />
          <DemoMedia alt="JobPilot sending applications from a Google Sheet" />

          <div className="absolute top-10 -left-6 hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm shadow-lg lg:flex">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span className="font-medium">Sent</span>
            <span className="text-muted-foreground">to a recruiter</span>
          </div>
          <div className="absolute -right-6 bottom-12 hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm shadow-lg lg:flex">
            <Clock className="size-4 text-indigo-500" />
            <span className="font-medium">Next email</span>
            <span className="text-muted-foreground">in 74s</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Stats() {
  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-4 py-10 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 80}>
            <div className="text-center">
              <p className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}



export function Pipeline() {
  return (
    <section id="pipeline" className="border-y bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal>
          <h2 className="font-heading text-4xl font-bold tracking-tight">What happens to each email</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Every address goes through the same checks before it is sent, and the result is written back to your sheet.
          </p>
        </Reveal>
        <Reveal className="mt-10 space-y-4">
          <FlowRow nodes={FLOW} highlight={3} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-linear-to-br from-emerald-500/[0.08] to-transparent bg-card p-4">
              <p className="flex items-center gap-2 font-heading font-semibold">
                <span className="size-2 rounded-full bg-emerald-500" />
                Sent: success tab
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Time sent, Gmail message ID, template version.</p>
            </div>
            <div className="rounded-2xl border bg-linear-to-br from-destructive/[0.08] to-transparent bg-card p-4">
              <p className="flex items-center gap-2 font-heading font-semibold">
                <span className="size-2 rounded-full bg-destructive" />
                Failed: failure tab
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Reason and number of attempts, so you can fix and retry.</p>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <span className="mt-16 inline-flex items-center gap-2 rounded-full border border-dashed border-indigo-500/40 bg-indigo-500/5 px-3 py-1 text-xs font-medium text-indigo-500">
            <span className="size-1.5 rounded-full bg-indigo-500" />
            Coming next
          </span>
          <h3 className="mt-3 font-heading text-2xl font-semibold">Finding recruiters for you</h3>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Openings and contacts will be found from your resume, then wait for your approval before joining the same flow.
          </p>
          <div className="mt-6">
            <FlowRow nodes={FLOW_V2} dashed />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-24">
      <Reveal>
        <p className="text-sm font-medium text-muted-foreground">Built to protect your reputation</p>
        <h2 className="mt-2 max-w-2xl font-heading text-4xl font-bold tracking-tight">
          Cold email goes wrong when it looks like spam.{" "}
          <span className={gradientText}>Yours never will.</span>
        </h2>
      </Reveal>

      {/* The one boxed element: the queue in action */}
      <Reveal className="mt-12">
        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-4 -z-10 rounded-[2rem] bg-linear-to-r from-indigo-500/20 to-violet-500/20 blur-2xl"
          />
          <div className="overflow-hidden rounded-2xl border bg-card shadow-xl shadow-primary/5">
            <div className="flex items-center justify-between border-b bg-muted px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-destructive/70" />
                <span className="size-2.5 rounded-full bg-muted-foreground/40" />
                <span className="size-2.5 rounded-full bg-muted-foreground/40" />
              </div>
              <span className="text-xs text-muted-foreground">Send window 09:00 to 18:00</span>
            </div>

            <ul className="divide-y">
              {QUEUE.map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                  <span className="truncate font-mono text-xs sm:text-sm">{r.email}</span>
                  <span className={`flex shrink-0 items-center gap-2 text-xs sm:text-sm ${TONES[r.tone]}`}>
                    <r.icon className="size-4" />
                    {r.note}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3 border-t bg-muted/40 px-5 py-3 text-xs text-muted-foreground">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[30%] rounded-full bg-linear-to-r from-indigo-500 to-violet-500" />
              </div>
              <span className="tabular-nums">12 of 40 sent today</span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Everything else: no boxes, just hairlines */}
      <div className="mt-16 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 100}>
            <div className="group border-t pt-6">
              <f.icon className="size-5 text-indigo-500 transition-transform duration-300 group-hover:-translate-y-0.5" />
              <h3 className="mt-4 font-heading text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
export function Faq() {
  const [active, setActive] = useState(0)
  const current = FAQ[active]

  return (
    <section id="faq" className="border-t bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal>
          <p className="text-sm font-medium text-muted-foreground">Straight answers</p>
          <h2 className="mt-2 max-w-xl font-heading text-4xl font-bold tracking-tight">
            Before you connect your Gmail, you'll want to know this.
          </h2>
        </Reveal>

        <Reveal className="mt-12">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            {/* Question list */}
            <ul role="tablist" aria-label="Questions" className="space-y-2">
              {FAQ.map((item, i) => {
                const on = i === active
                return (
                  <li key={item.q}>
                    <button
                      role="tab"
                      aria-selected={on}
                      onClick={() => setActive(i)}
                      className={`group flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${on
                        ? "border-transparent bg-primary text-primary-foreground shadow-lg"
                        : "bg-card hover:-translate-y-0.5 hover:shadow-md"
                        }`}
                    >
                      <span
                        className={`grid size-7 shrink-0 place-items-center rounded-full font-heading text-xs font-bold ${on ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
                          }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 font-heading font-semibold">{item.q}</span>
                      <ArrowRight
                        className={`size-4 shrink-0 transition ${on ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:opacity-60"}`}
                      />
                    </button>
                  </li>
                )
              })}
            </ul>

            {/* Answer panel */}
            <div
              role="tabpanel"
              key={active}
              className="relative flex min-h-72 flex-col justify-between overflow-hidden rounded-3xl border bg-card p-8 animate-in fade-in slide-in-from-right-2 duration-300 motion-reduce:animate-none lg:sticky lg:top-24 lg:self-start"
            >
              <div
                aria-hidden
                className="absolute -top-16 -right-16 size-56 rounded-full bg-indigo-500/15 blur-3xl"
              />
              <div className="relative">
                <span className="font-heading text-6xl font-extrabold text-muted-foreground/20">
                  {String(active + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-heading text-2xl font-bold tracking-tight">{current.q}</h3>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{current.a}</p>
              </div>
              <p className="relative mt-8 text-sm text-muted-foreground">
                Something else?{" "}
                <a
                  href="mailto:shubhamsharma20007@gmail.com"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Ask me directly
                </a>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function FinalCta() {
  const { user } = useAuth()

  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-center text-primary-foreground">
          <div
            aria-hidden
            className="absolute -top-24 left-1/2 -z-10 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-indigo-500/40 blur-3xl"
          />
          <h2 className="mx-auto max-w-2xl font-heading text-3xl font-extrabold tracking-tight sm:text-5xl">
            Stop copy-pasting your applications.
          </h2>
          <p className="mx-auto mt-4 max-w-md opacity-80">
            Set it up once, add your list, and let JobPilot send at a pace that keeps your Gmail safe.
          </p>
          <div className="mt-8 flex justify-center">
            {user ? (
              <Link to="/sheet" className={buttonVariants({ variant: "secondary", size: "lg", className: "h-11 px-6 text-base" })}>
                Open your sheet
              </Link>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                className="h-11 px-6 text-base"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Sign in with Google to start
              </Button>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t">
      <div className="mx-auto max-w-6xl px-4 pt-16">
        <div className="grid gap-12 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          {/* Brand */}
          <div className="max-w-xs">
            <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold tracking-tight">
              <svg viewBox="0 0 64 64" className="size-8" aria-hidden>
                <rect width="64" height="64" rx="16" className="fill-primary" />
                <path d="M49 15 L14 29 L27 36 L34 50 Z" strokeLinejoin="round" className="fill-primary-foreground" />
                <path d="M27 36 L49 15" fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-primary" />
              </svg>
              {APP.name}
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Write your application email once. JobPilot sends the rest from your own Gmail, at a pace that keeps it safe.
            </p>
          </div>

          {/* Product */}
          <nav aria-label="Product">
            <p className="font-heading text-sm font-semibold">Product</p>
            <ul className="mt-4 space-y-3">
              {FOOTER_PRODUCT.map((l) => (
                <li key={l.hash}>
                  <Link to={{ pathname: "/", hash: l.hash }} className={footerLink}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal">
            <p className="font-heading text-sm font-semibold">Legal</p>
            <ul className="mt-4 space-y-3">
              <li><Link to="/privacy" className={footerLink}>Privacy</Link></li>
              <li><Link to="/terms" className={footerLink}>Terms</Link></li>
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <p className="font-heading text-sm font-semibold">Get in touch</p>
            <ul className="mt-4 space-y-3">
              <li>
                <a href={`mailto:${SOCIALS.email}`} className={`${footerLink} inline-flex items-center gap-2`}>
                  <Mail className="size-4" /> Email me
                </a>
              </li>
              <li>
                <a
                  href={SOCIALS.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${footerLink} inline-flex items-center gap-2`}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
                    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
                  </svg>
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t py-6 text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {APP.name}. Built by Shubham Sharma.
          </p>
          <div className="flex items-center gap-1">
            <SocialLinks />
            <Button
              variant="outline"
              size="icon"
              aria-label="Scroll to top"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <ArrowUp />
            </Button>
          </div>
        </div>
      </div>

      {/* Large faded wordmark */}
      <div aria-hidden className="pointer-events-none -mb-[0.18em] select-none text-center">
        <span className="bg-linear-to-b from-foreground/15 to-transparent bg-clip-text font-heading text-[22vw] leading-none font-extrabold tracking-tighter text-transparent lg:text-[200px]">
          {APP.name}
        </span>
      </div>
    </footer>
  )
}

function StepVisual({ i }: { i: number }) {
  const chip = "inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs"
  const mono = "rounded-md border bg-muted/60 px-1.5 py-0.5 font-mono text-xs"

  if (i === 0)
    return (
      <div className="flex flex-wrap gap-2">
        <span className={chip}><CheckCircle2 className="size-3.5 text-emerald-500" /> Send email as you</span>
        <span className={chip}><CheckCircle2 className="size-3.5 text-emerald-500" /> Detect bounced addresses</span>
      </div>
    )

  if (i === 1)
    return (
      <div className="space-y-2 text-sm">
        <p className="font-medium">
          Application for <span className={mono}>{"{{role}}"}</span> at <span className={mono}>{"{{company}}"}</span>
        </p>
        <span className={chip}><FileText className="size-3.5" /> resume.pdf attached</span>
      </div>
    )

  if (i === 2)
    return (
      <ul className="space-y-1.5 font-mono text-xs text-muted-foreground">
        {["hr@acme.com", "talent@globex.io", "jobs@initech.dev"].map((e, k) => (
          <li key={e} className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5">
            <span>{e}</span>
            <span className="text-[10px] uppercase tracking-wide">{k === 0 ? "ready" : "queued"}</span>
          </li>
        ))}
      </ul>
    )

  return (
    <ul className="space-y-1.5 text-xs">
      <li className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
        <CheckCircle2 className="size-3.5 text-emerald-500" /> Sent to hr@acme.com
      </li>
      <li className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-muted-foreground">
        <Clock className="size-3.5 text-indigo-500" /> Next email in 74s
      </li>
    </ul>
  )
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-24">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Reveal className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-sm font-medium text-muted-foreground">Setup takes about five minutes</p>
          <h2 className="mt-2 font-heading text-4xl font-bold tracking-tight">
            You do three things. <span className={gradientText}>JobPilot does the fourth, every day.</span>
          </h2>
        </Reveal>

        <ol className="relative space-y-6 border-l pl-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="absolute top-5 -left-[3.25rem] grid size-10 place-items-center rounded-full border-4 border-background bg-primary font-heading font-bold text-primary-foreground">
                {i + 1}
              </span>
              <Reveal delay={i * 80}>
                <div className="rounded-3xl border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <h3 className="font-heading text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                  <div className="mt-4 rounded-xl border border-dashed p-3">
                    <StepVisual i={i} />
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}