import { useRef, type ClipboardEvent, type KeyboardEvent } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SheetRow } from "@/types/sheet.type"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const COLUMNS = [
  { key: "recruiter", label: "Recruiter emails", hint: "Type or paste here" },
  { key: "delivered", label: "Delivered emails", hint: "Filled automatically" },
  { key: "failed", label: "Failed emails", hint: "Filled automatically" },
] as const

type CellStatus = "empty" | "ok" | "invalid" | "duplicate"

export const newRow = (): SheetRow => ({ id: crypto.randomUUID(), recruiter: "", delivered: "", failed: "",url:'' })
export const makeRows = (n: number): SheetRow[] => Array.from({ length: n }, () => newRow())

type Props = { rows: SheetRow[]; onChange: (rows: SheetRow[]) => void }

export function SpreadsheetGrid({ rows, onChange }: Props) {
  const gridRef = useRef<HTMLDivElement>(null)

  // Work out each cell's status once per render
  const seen = new Set<string>()
  const statuses: CellStatus[] = rows.map((r) => {
    const v = r.recruiter.trim().toLowerCase()
    if (!v) return "empty"
    if (!EMAIL_RE.test(v)) return "invalid"
    if (seen.has(v)) return "duplicate"
    seen.add(v)
    return "ok"
  })

  const ready = statuses.filter((s) => s === "ok").length
  const delivered = rows.filter((r) => r.delivered).length
  const failed = rows.filter((r) => r.failed).length

  function focusRow(i: number) {
    requestAnimationFrame(() =>
      gridRef.current?.querySelector<HTMLInputElement>(`[data-row="${i}"]`)?.focus()
    )
  }

  function setRecruiter(i: number, value: string) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, recruiter: value } : r)))
  }

  function removeRow(i: number) {
    const next = rows.filter((_, idx) => idx !== i)
    onChange(next.length ? next : [newRow()])
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === "Enter") {
      e.preventDefault()
      if (i === rows.length - 1) onChange([...rows, newRow()])
      focusRow(i + 1)
    } else if (e.key === "ArrowDown" && i < rows.length - 1) {
      e.preventDefault()
      focusRow(i + 1)
    } else if (e.key === "ArrowUp" && i > 0) {
      e.preventDefault()
      focusRow(i - 1)
    }
  }

  // Pasting several emails (one per line, or comma separated) fills the rows below
  function onPaste(e: ClipboardEvent<HTMLInputElement>, i: number) {
    const items = e.clipboardData
      .getData("text")
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (items.length < 2) return
    e.preventDefault()

    const next = [...rows]
    items.forEach((value, k) => {
      if (i + k >= next.length) next.push(newRow())
      next[i + k] = { ...next[i + k], recruiter: value }
    })
    onChange(next)
  }

  return (
    <div>
      <div ref={gridRef} className="max-h-[60vh] overflow-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              <th className="w-12 border-b border-r" aria-label="Row" />
              {COLUMNS.map((c) => (
                <th key={c.key} className="border-b border-r px-3 py-2 text-left last:border-r-0">
                  <span className="block font-medium">{c.label}</span>
                  <span className="block text-xs font-normal text-muted-foreground">{c.hint}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const status = statuses[i]
              const bad = status === "invalid" || status === "duplicate"
              return (
                <tr key={row.id} className="group">
                  <td className="relative h-9 border-r border-b bg-muted/50 text-center text-xs text-muted-foreground">
                    <span className="group-hover:invisible">{i + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      aria-label={`Delete row ${i + 1}`}
                      className="absolute inset-0 hidden place-items-center text-muted-foreground hover:text-destructive group-hover:grid"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>

                  <td className="border-r border-b p-0">
                    <input
                      data-row={i}
                      value={row.recruiter}
                      onChange={(e) => setRecruiter(i, e.target.value)}
                      onKeyDown={(e) => onKeyDown(e, i)}
                      onPaste={(e) => onPaste(e, i)}
                      aria-label={`Recruiter email, row ${i + 1}`}
                      aria-invalid={bad}
                      title={
                        status === "invalid"
                          ? "Not a valid email address"
                          : status === "duplicate"
                            ? "This email is already in the list"
                            : undefined
                      }
                      placeholder={i === 0 ? "recruiter@company.com" : ""}
                      spellCheck={false}
                      autoComplete="off"
                      className={`h-9 w-full bg-transparent px-3 outline-none focus:bg-primary/5 focus:ring-2 focus:ring-ring/60 focus:ring-inset ${
                        bad ? "text-destructive" : ""
                      }`}
                    />
                  </td>

                  <td className="h-9 border-r border-b bg-muted/30 px-3 text-muted-foreground">{row.delivered}</td>
                  <td className="h-9 border-b bg-muted/30 px-3 text-muted-foreground">{row.failed}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          {ready} ready · {delivered} delivered · {failed} failed
        </p>
        <Button variant="outline" size="sm" onClick={() => onChange([...rows, ...makeRows(10)])}>
          <Plus /> Add 10 rows
        </Button>
      </div>
    </div>
  )
}