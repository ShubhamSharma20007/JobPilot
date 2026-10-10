import { Fragment, useState } from "react"
import { ArrowRight, Check, Copy, Download, Plus, Puzzle } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { EXTENSION } from "./Content"
import { Reveal } from "./Reveal"

const gradientText = "bg-linear-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent"

const INSTALL = ["Unzip the download", "Open chrome://extensions", "Turn on Developer mode", "Click Load unpacked"]

const SHEET_ROWS = ["hr@globex.io", "talent@initech.dev"]
const soon = EXTENSION.comingSoon
function Logo({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" className="fill-primary" />
      <path d="M11 50 C15 44 19 42 24 40" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 5" opacity="0.7" className="stroke-primary-foreground" />
      <path d="M49 15 L14 29 L27 36 L34 50 Z" strokeLinejoin="round" className="fill-primary-foreground" />
      <path d="M27 36 L49 15" fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-primary" />
    </svg>
  )
}

/** Fake careers page on the left, the user's sheet on the right. Clicking Add moves the email across. */
function Demo() {
  const [added, setAdded] = useState(false)

  return (
    <div className="relative mx-auto max-w-5xl">
      <div aria-hidden className="absolute -inset-4 -z-10 rounded-[2rem] bg-linear-to-r from-indigo-500/25 to-violet-500/25 blur-2xl" />
      <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-primary/10">
        {/* browser bar */}
        <div className="flex items-center gap-3 border-b bg-muted px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-destructive/70" />
            <span className="size-2.5 rounded-full bg-muted-foreground/40" />
            <span className="size-2.5 rounded-full bg-muted-foreground/40" />
          </div>
          <div className="flex-1 truncate rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
            acme.com/careers/full-stack-developer
          </div>
          <span className="grid size-6 place-items-center rounded-md ring-1 ring-border" aria-hidden>
            <Logo className="size-4" />
          </span>
        </div>

        <div className="grid md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:divide-x">
          {/* The web page */}
          <div className="space-y-3 p-6 pb-20 text-left text-sm">
            <p className="font-heading text-lg font-semibold">Full Stack Developer</p>
            <div className="h-2.5 w-11/12 rounded-full bg-muted" />
            <div className="h-2.5 w-3/4 rounded-full bg-muted" />
            <p className="pt-2 text-muted-foreground">
              To apply, send your resume to{" "}
              <span className="rounded-sm bg-indigo-500/25 px-0.5 font-medium text-foreground">priya@acme.com</span>
            </p>

            <div className="w-full max-w-sm overflow-hidden rounded-2xl border bg-popover shadow-lg shadow-indigo-500/10">
              <div aria-hidden className="h-0.5 bg-linear-to-r from-indigo-500 to-violet-500" />
              <div className="flex items-center gap-2 p-2">
                <Logo className="size-7 shrink-0" />
                <span className="flex h-7 min-w-0 flex-1 items-center rounded-full bg-indigo-500/10 px-2.5 text-indigo-500">
                  <span className="truncate font-mono text-xs font-medium">priya@acme.com</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAdded((a) => !a)}
                  aria-pressed={added}
                  className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-white transition active:translate-y-px ${added ? "bg-emerald-500" : "bg-linear-to-r from-indigo-500 to-violet-500 hover:opacity-90"
                    }`}
                >
                  {added ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                  {added ? "Added" : "Add"}
                </button>
              </div>
            </div>
          </div>

          {/* The sheet */}
          <div className="bg-muted/30 text-left text-sm">
            <div className="border-b bg-muted px-4 py-2.5">
              <span className="block font-medium">Recruiter emails</span>
              <span className="block text-xs text-muted-foreground">Your sheet</span>
            </div>
            <ul className="divide-y">
              {SHEET_ROWS.map((e, i) => (
                <li key={e} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-4 text-xs text-muted-foreground">{i + 1}</span>
                  <span className="font-mono text-xs">{e}</span>
                </li>
              ))}
              <li
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors duration-500 ${added ? "bg-emerald-500/10" : ""
                  }`}
              >
                <span className="w-4 text-xs text-muted-foreground">3</span>
                {added ? (
                  <>
                    <span className="font-mono text-xs">priya@acme.com</span>
                    <span className="ml-auto rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-500">ready</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground/60">empty</span>
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">Try the Add button. This is a preview, nothing is saved.</p>
    </div>
  )
}

export function ExtensionSection() {
  const [copied, setCopied] = useState(false)
  const hasStore = !!EXTENSION.storeUrl

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText("chrome://extensions")
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <section id="extension" className="relative isolate overflow-hidden border-t bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-4">
        {/* Centered header */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur">
            <Puzzle className="size-3.5 text-indigo-500" />
            Chrome extension
            {soon && (
              <span className="rounded-full border border-dashed border-indigo-500/40 bg-indigo-500/5 px-1.5 py-0.5 text-[10px] leading-none text-indigo-500">
                Coming soon
              </span>
            )}
          </span>
          <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight">
            Found an email? <span className={gradientText}>Add it without leaving the page.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Select a recruiter's address on LinkedIn, Gmail or any website. A small bar appears under it, and one click
            sends it to your sheet. Duplicates are caught for you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {soon ? (
              <span
                aria-disabled
                className={buttonVariants({ variant: "outline", size: "lg", className: "h-11 cursor-not-allowed px-6 text-base opacity-70" })}
              >
                <Puzzle /> Coming soon
              </span>
            ) : (
              <a
                href={hasStore ? EXTENSION.storeUrl : EXTENSION.zipUrl}
                {...(hasStore ? { target: "_blank", rel: "noopener noreferrer" } : { download: "jobpilot-extension.zip" })}
                className={buttonVariants({ size: "lg", className: "h-11 px-6 text-base" })}
              >
                <Download />
                {hasStore ? "Add to Chrome" : "Download extension"}
              </a>
            )}
            <span className="text-sm text-muted-foreground">
              {soon ? "Under review by the Chrome Web Store." : "Free. Works in Chrome, Edge and Brave."}
            </span>
          </div>
        </Reveal>

        <Reveal className="mt-14" delay={100}>
          <Demo />
        </Reveal>

        {/* Install stepper, only for the zip route */}
        {!hasStore && !soon && (
          <Reveal className="mx-auto mt-14 max-w-4xl">
            <p className="text-center text-sm font-medium text-muted-foreground">
              Not on the Chrome Web Store yet, so install it by hand. It takes about a minute.
            </p>
            <ol className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {INSTALL.map((s, i) => (
                <Fragment key={s}>
                  <li className="inline-flex items-center gap-2 rounded-full border bg-card py-1 pr-3.5 pl-1 text-sm">
                    <span className="grid size-6 place-items-center rounded-full bg-primary font-heading text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                  {i < INSTALL.length - 1 && <ArrowRight aria-hidden className="size-4 text-indigo-500/60" />}
                </Fragment>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <button
                type="button"
                onClick={copyAddress}
                className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 font-mono text-xs text-foreground transition hover:bg-muted"
              >
                {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "chrome://extensions"}
              </button>
              <span>Then pin JobPilot to your toolbar.</span>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  )
}