import { Link } from "react-router-dom"
import { ArrowRight, ArrowUp, CheckCircle2, Clock, FileText } from "lucide-react"
import { DemoMedia } from "./DemoMedia"
import { FlowRow } from "./Diagram"
import { APP, FAQ, FEATURES, FLOW, FLOW_V2, STATS, STEPS } from "./Content"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button, buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/redux/hooks/useAuth"
import { GoogleSignIn } from "./GoogleSignIn"
import { SocialLinks } from "./SocialLinks"
import { Reveal } from "./Reveal"
import { useState } from "react"

const gradientText =
  "bg-linear-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent"

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
            <div className="rounded-2xl border bg-card p-4">
              <p className="font-heading font-semibold">Sent: success tab</p>
              <p className="mt-1 text-sm text-muted-foreground">Time sent, Gmail message ID, template version.</p>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <p className="font-heading font-semibold">Failed: failure tab</p>
              <p className="mt-1 text-sm text-muted-foreground">Reason and number of attempts, so you can fix and retry.</p>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <span className="mt-16 inline-flex rounded-full border border-dashed px-3 py-1 text-xs font-medium text-muted-foreground">
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
        <h2 className="font-heading text-4xl font-bold tracking-tight">Built to protect your reputation</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Cold email goes wrong when it looks like spam. Everything here is designed so yours never does.
        </p>
      </Reveal>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 100} className={`${f.span}`}>
            <div className="group relative h-full overflow-hidden rounded-3xl border bg-card p-8 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <div
                aria-hidden
                className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <div className="relative">
                <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-5 font-heading text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 max-w-md text-muted-foreground">{f.body}</p>
              </div>
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
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {APP.name}
        </p>
        <nav className="flex items-center gap-5">
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
        </nav>
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