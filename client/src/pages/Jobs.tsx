import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { isAxiosError } from "axios"
import { Briefcase, CheckCircle2, ExternalLink, Loader2, MapPin, Search, SlidersHorizontal, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import Loader from "@/components/Loader"
import { Button, buttonVariants } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { gradientBtn, inputClass } from "@/components/settings/primitives"
import { useAuth } from "@/redux/hooks/useAuth"
import { jobsService, type Job, type JobsResponse } from "@/services/jobs.service.ts"

const banner =
  "mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-indigo-500/30 bg-linear-to-r from-indigo-500/[0.07] via-transparent to-transparent p-4"

const SOURCE: Record<string, string> = {
  hn: "Hacker News", remotive: "Remotive", greenhouse: "Greenhouse", lever: "Lever",
  adzuna: "Adzuna", jsearch: "JSearch",
}
const FRESHNESS = [
  { value: 0, label: "Any time" },
  { value: 1, label: "Last 24 hours" },
  { value: 3, label: "Last 3 days" },
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
]

const LOCATION_CHIPS = ["India", "USA", "Europe", "UK", "Canada"]

type Filters = {
  location: string
  remote: boolean
  maxAgeDays: number
  sources: string[]
  sort: "match" | "new"
}

const DEFAULT_FILTERS: Filters = { location: "", remote: false, maxAgeDays: 0, sources: [], sort: "match" }

const apiError = (e: unknown, fallback: string) => {
  const d = isAxiosError(e) ? e.response?.data?.detail : null
  return typeof d === "string" ? d : fallback
}

function ago(iso: string | null) {
  if (!iso) return ""
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`
}

function Score({ value }: { value: number }) {
  const tone =
    value >= 60
      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
      : value >= 30
        ? "text-indigo-500 bg-indigo-500/10"
        : "text-muted-foreground bg-muted"
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${tone}`}>{value}% match</span>
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? "border-transparent bg-linear-to-r from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/20"
          : "bg-background hover:bg-muted"
      }`}
    >
      {children}
    </button>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-medium">{title}</p>
      {children}
    </div>
  )
}

function FilterSheet({
  open, onOpenChange, value, onApply,
}: { open: boolean; onOpenChange: (o: boolean) => void; value: Filters; onApply: (f: Filters) => void }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => { if (open) setDraft(value) }, [open, value])
  const patch = (p: Partial<Filters>) => setDraft((d) => ({ ...d, ...p }))
  const toggleSource = (s: string) =>
    patch({ sources: draft.sources.includes(s) ? draft.sources.filter((x) => x !== s) : [...draft.sources, s] })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Filter jobs</SheetTitle>
          <SheetDescription>Narrow the list by place, freshness and source.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-7 overflow-y-auto px-4 pb-4">
          <Group title="Location">
            <input
              value={draft.location}
              onChange={(e) => patch({ location: e.target.value })}
              placeholder="City, country or region"
              className={inputClass}
              aria-label="Location"
            />
            <div className="flex flex-wrap gap-2">
              <Chip active={draft.remote} onClick={() => patch({ remote: !draft.remote })}>Remote only</Chip>
              {LOCATION_CHIPS.map((c) => (
                <Chip key={c} active={draft.location.toLowerCase() === c.toLowerCase()} onClick={() =>
                  patch({ location: draft.location.toLowerCase() === c.toLowerCase() ? "" : c })}>
                  {c}
                </Chip>
              ))}
            </div>
          </Group>

          <Group title="Freshness">
            <div className="flex flex-wrap gap-2">
              {FRESHNESS.map((f) => (
                <Chip key={f.value} active={draft.maxAgeDays === f.value} onClick={() => patch({ maxAgeDays: f.value })}>
                  {f.label}
                </Chip>
              ))}
            </div>
          </Group>

          <Group title="Source">
            <div className="flex flex-wrap gap-2">
              {Object.entries(SOURCE).map(([k, label]) => (
                <Chip key={k} active={draft.sources.includes(k)} onClick={() => toggleSource(k)}>{label}</Chip>
              ))}
            </div>
          </Group>

          <Group title="Sort by">
            <div className="flex flex-wrap gap-2">
              <Chip active={draft.sort === "match"} onClick={() => patch({ sort: "match" })}>Best match</Chip>
              <Chip active={draft.sort === "new"} onClick={() => patch({ sort: "new" })}>Newest first</Chip>
            </div>
          </Group>
        </div>

        <SheetFooter className="border-t sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={() => setDraft(DEFAULT_FILTERS)}>Reset</Button>
          <Button className={gradientBtn} onClick={() => { onApply(draft); onOpenChange(false) }}>Show jobs</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function JobCard({ job, busy, onApply, onSkip }: { job: Job; busy: boolean; onApply: () => void; onSkip: () => void }) {
  const queued = job.status === "queued"
  return (
    <li className="flex flex-col rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-heading text-base font-semibold">{job.title}</h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{job.company}</p>
        </div>
        {job.score !== null && <Score value={job.score} />}
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {job.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3 shrink-0" />{job.location}</span>}
        <span>{SOURCE[job.source] ?? job.source}</span>
        {job.postedAt && <span>{ago(job.postedAt)}</span>}
      </p>

      {job.snippet && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{job.snippet}</p>}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {queued ? (
          <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" /> Queued to send
          </span>
        ) : job.contactEmail ? (
          <Button className={gradientBtn} disabled={busy} onClick={onApply}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {busy ? "Writing…" : "AI apply"}
          </Button>
        ) : job.url ? (
          <a href={job.url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
            <ExternalLink /> Apply on site
          </a>
        ) : null}

        {!queued && job.contactEmail && job.url && (
          <a href={job.url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="Open job post">
            <ExternalLink />
          </a>
        )}
        {!queued && (
          <Button variant="ghost" size="sm" disabled={busy} onClick={onSkip} className="ml-auto text-muted-foreground">
            Not interested
          </Button>
        )}
      </div>
      {!queued && job.contactEmail && (
        <p className="mt-2 truncate font-mono text-[11px] text-muted-foreground">{job.contactEmail}</p>
      )}
    </li>
  )
}

export default function Jobs() {
  const { user, resumes } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<JobsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [q, setQ] = useState("")
  const [onlyEmail, setOnlyEmail] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const analysing = useRef(false)

  const activeCount =
    (filters.location.trim() ? 1 : 0) + (filters.remote ? 1 : 0) + (filters.maxAgeDays ? 1 : 0) +
    (filters.sources.length ? 1 : 0) + (filters.sort !== "match" ? 1 : 0)

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      setFailed(false)
      try {
        setData(await jobsService.list({ q, onlyEmail, page, ...filters }))
      } catch {
        setFailed(true)
        toast.error("Couldn't load jobs")
      } finally {
        setLoading(false)
      }
    },
    [q, onlyEmail, page, filters]
  )

  // reload when the search or filters change; debounced so typing doesn't fire a request per key
  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0)
    return () => clearTimeout(t)
  }, [load, q])

  // The first time a user has a key and a resume, read the resume once so jobs get ranked.
  useEffect(() => {
    if (!data?.aiReady || data.profileReady || resumes.length === 0 || analysing.current) return
    analysing.current = true
    const id = toast.loading("Reading your resume to rank jobs…")
    jobsService
      .analyseResume()
      .then(() => { toast.success("Resume analysed", { id }); load(true) })
      .catch((e) => toast.error("Couldn't read your resume", { id, description: apiError(e, "Try again from Settings.") }))
  }, [data?.aiReady, data?.profileReady, resumes.length, load])

  async function apply(job: Job) {
    setBusyId(job.id)
    try {
      const res = await jobsService.apply(job.id)
      if (res.status === "no_contact") {
        toast.info("No recruiter email on this post", { description: "Use Apply on site instead." })
        if (res.applyUrl) window.open(res.applyUrl, "_blank", "noopener")
      } else {
        toast.success(`Queued for ${res.to ?? "sending"}`, {
          description: "It goes out from your Gmail with your resume at your usual pace.",
          action: { label: "Open sheet", onClick: () => navigate("/sheet") },
        })
        load(true)
      }
    } catch (e) {
      toast.error("Couldn't apply", { description: apiError(e, "Please try again.") })
    } finally {
      setBusyId(null)
    }
  }

  async function skip(job: Job) {
    setBusyId(job.id)
    try {
      await jobsService.skip(job.id)
      setData((d) => (d ? { ...d, jobs: d.jobs.filter((j) => j.id !== job.id) } : d))
    } catch {
      toast.error("Couldn't hide this job")
    } finally {
      setBusyId(null)
    }
  }

  const applyFilters = (f: Filters) => { setFilters(f); setPage(0) }

  if (loading && !data) return <Loader />
  if (failed && !data) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-sm place-items-center px-4 text-center">
        <div className="space-y-3">
          <p className="font-medium">We couldn't load jobs.</p>
          <Button variant="outline" onClick={() => load()}>Try again</Button>
        </div>
      </div>
    )
  }
  if (!data) return null

  const pages = Math.max(1, Math.ceil(data.total / data.pageSize))
  const freshnessLabel = FRESHNESS.find((f) => f.value === filters.maxAgeDays)?.label

  const active: { key: string; label: string; clear: () => void }[] = [
    ...(filters.location.trim() ? [{ key: "loc", label: filters.location.trim(), clear: () => applyFilters({ ...filters, location: "" }) }] : []),
    ...(filters.remote ? [{ key: "remote", label: "Remote only", clear: () => applyFilters({ ...filters, remote: false }) }] : []),
    ...(filters.maxAgeDays ? [{ key: "age", label: freshnessLabel ?? "", clear: () => applyFilters({ ...filters, maxAgeDays: 0 }) }] : []),
    ...(filters.sources.length ? [{ key: "src", label: filters.sources.map((s) => SOURCE[s]).join(", "), clear: () => applyFilters({ ...filters, sources: [] }) }] : []),
    ...(filters.sort !== "match" ? [{ key: "sort", label: "Newest first", clear: () => applyFilters({ ...filters, sort: "match" }) }] : []),
  ]

  return (
    <div className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72">
        <div className="absolute top-[-9rem] left-1/2 h-[18rem] w-[40rem] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl dark:bg-indigo-500/20" />
      </div>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            Find{" "}
            <span className="bg-linear-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">jobs</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Fresh openings from free public sources, ranked against your resume. AI apply writes a personalised
            email and queues it from your own Gmail.
          </p>
        </div>

        {!data.aiReady && (
          <div className={banner}>
            <p className="text-sm">Add your AI key in Settings to turn on AI apply and match scores. Browsing works without it.</p>
            <Link to="/settings" className={buttonVariants({ variant: "outline" })}>Open Settings</Link>
          </div>
        )}
        {data.aiReady && resumes.length === 0 && (
          <div className={banner}>
            <p className="text-sm">Upload a resume so JobPilot can rank jobs for you and attach it to applications.</p>
            <Link to="/profile#upload-resumes" className={buttonVariants({ variant: "outline" })}>Upload resume</Link>
          </div>
        )}
        {user && !user.gmail_connected && (
          <div className={banner}>
            <p className="text-sm">Connect Gmail in Settings so queued applications can be sent.</p>
            <Link to="/settings" className={buttonVariants({ variant: "outline" })}>Connect Gmail</Link>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-60 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(0) }}
              placeholder="Search title, company or skill"
              className={`${inputClass} pl-9`}
              aria-label="Search jobs"
            />
          </div>
          <Chip active={onlyEmail} onClick={() => { setOnlyEmail((v) => !v); setPage(0) }}>Email apply only</Chip>
          <Button variant="outline" className="h-10 gap-2 px-3.5" onClick={() => setSheetOpen(true)}>
            <SlidersHorizontal /> Filters
            {activeCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">{activeCount}</span>
            )}
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="tabular-nums">{data.total} {data.total === 1 ? "job" : "jobs"}</span>
          {active.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={a.clear}
              className="inline-flex items-center gap-1 rounded-full border bg-muted/50 py-0.5 pr-1.5 pl-2.5 text-xs text-foreground transition hover:bg-muted"
              aria-label={`Remove filter ${a.label}`}
            >
              {a.label}<X className="size-3" />
            </button>
          ))}
          {data.aiReady && (
            <span className="ml-auto tabular-nums">{data.appliedToday} of {data.aiDailyLimit} AI applies today</span>
          )}
        </div>

        {data.jobs.length === 0 ? (
          <div className="mt-10 grid place-items-center gap-2 rounded-2xl border border-dashed p-12 text-center">
            <Briefcase className="size-8 text-muted-foreground" />
            <p className="font-medium">No jobs match</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Try removing a filter. New jobs are fetched every few hours.
            </p>
            {(activeCount > 0 || onlyEmail || q) && (
              <Button variant="outline" className="mt-2" onClick={() => { setFilters(DEFAULT_FILTERS); setOnlyEmail(false); setQ(""); setPage(0) }}>
                Clear all
              </Button>
            )}
          </div>
        ) : (
          <ul className={`mt-4 grid gap-4 sm:grid-cols-2 ${loading ? "opacity-60" : ""}`}>
            {data.jobs.map((j) => (
              <JobCard key={j.id} job={j} busy={busyId === j.id} onApply={() => apply(j)} onSkip={() => skip(j)} />
            ))}
          </ul>
        )}

        {pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3 text-sm">
            <Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-muted-foreground tabular-nums">Page {page + 1} of {pages}</span>
            <Button variant="outline" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </section>

      <FilterSheet open={sheetOpen} onOpenChange={setSheetOpen} value={filters} onApply={applyFilters} />
    </div>
  )
}