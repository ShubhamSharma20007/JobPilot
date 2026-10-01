import { DemoMedia } from "./DemoMedia"
import { FlowRow } from "./Diagram"
import { APP, FAQ, FEATURES, FLOW, FLOW_V2, STEPS } from "./Content"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SocialLinks } from "./SocialLinks"
export function Hero() {
  return (
    <section id="top" className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 motion-reduce:animate-none">
        <h1 className="font-heading text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
          {APP.headline}
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">{APP.sub}</p>
        <p className="text-sm text-muted-foreground">Sign in with Google from the top of the page to start.</p>
      </div>
      <DemoMedia alt="JobPilot sending applications from a Google Sheet" />
    </section>
  )
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y bg-muted/40 py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center font-heading text-4xl font-bold tracking-tight">How it works</h2>
        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="space-y-3">
              <span className="grid size-10 place-items-center rounded-full bg-primary font-heading font-bold text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="font-heading text-xl font-semibold">{s.title}</h3>
              <p className="text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function Pipeline() {
  return (
    <section id="pipeline" className="mx-auto max-w-6xl px-4 py-24">
      <h2 className="font-heading text-4xl font-bold tracking-tight">What happens to each email</h2>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Every address goes through the same checks before it is sent, and the result is written back to your sheet.
      </p>
      <div className="mt-10 space-y-4">
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
      </div>

      <h3 className="mt-16 font-heading text-2xl font-semibold">Coming next: finding recruiters for you</h3>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Openings and contacts will be found from your resume, then wait for your approval before joining the same flow.
      </p>
      <div className="mt-6">
        <FlowRow nodes={FLOW_V2} dashed />
      </div>
    </section>
  )
}

export function Features() {
  return (
    <section id="features" className="border-y bg-muted/40 py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-heading text-4xl font-bold tracking-tight">Built to protect your reputation</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className={`rounded-3xl border bg-card p-8 ${f.span}`}>
              <h3 className="font-heading text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 max-w-md text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-24">
      <h2 className="text-center font-heading text-4xl font-bold tracking-tight">Questions</h2>
      <Accordion className="mt-12 rounded-2xl border bg-card px-6">
        {FAQ.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger className="font-heading text-lg font-semibold">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {APP.name}
        </p>
        <div className="flex items-center gap-1">
          <SocialLinks  />
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