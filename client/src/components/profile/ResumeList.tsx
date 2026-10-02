import { Eye, FileText, Star, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {  type Resume } from "@/types/resume.type"

export function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })

/** Highlighted card for the resume currently used when sending applications */
export function CurrentResume({ resume }: { resume?: Resume }) {
  if (!resume) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-dashed p-6">
        <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
          <FileText className="size-6" />
        </span>
        <div>
          <p className="font-medium">No resume yet</p>
          <p className="text-sm text-muted-foreground">Upload a PDF below. It will be attached to every email.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-6">
      <span className="grid size-14 place-items-center rounded-xl bg-primary text-primary-foreground">
        <FileText className="size-7" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-lg font-semibold">{resume.name}</p>
        <p className="text-sm text-muted-foreground">
          PDF, {formatSize(resume.size)}. Uploaded {formatDate(resume.uploadedAt)}.
        </p>
      </div>
      <Button variant="outline" onClick={() => window.open(resume.url, "_blank", "noopener")}>
        <Eye /> View
      </Button>
    </div>
  )
}

type ListProps = {
  resumes: Resume[]
  onSetDefault: (id: string) => void
  onDelete: (id: string) => void
}

/** All uploaded resumes, with set-default and delete actions */
export function ResumeList({ resumes, onSetDefault, onDelete }: ListProps) {
  if (resumes.length === 0) return null

  return (
    <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
      {resumes.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center gap-3 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
            <FileText className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-medium">
              <span className="truncate">{r.name}</span>
              {r.isDefault && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  <Star className="size-3" /> Default
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatSize(r.size)}, uploaded {formatDate(r.uploadedAt)}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`View ${r.name}`}
              onClick={() => window.open(r.url, "_blank", "noopener")}
            >
              <Eye />
            </Button>
            {!r.isDefault && (
              <Button variant="outline" size="sm" onClick={() => onSetDefault(r.id)}>
                <Star /> Make default
              </Button>
            )}
            <Button variant="ghost" size="icon" aria-label={`Delete ${r.name}`} onClick={() => onDelete(r.id)}>
              <Trash2 className="text-destructive" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}