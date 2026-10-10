import { useState } from 'react';
import { Eye, FileText, Loader2, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Resume } from '@/types/resume.type';

export function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/** Highlighted card for the resume currently used when sending applications */
export function CurrentResume({ resume }: { resume?: Resume }) {
  if (!resume) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-dashed border-indigo-500/30 bg-linear-to-r from-indigo-500/[0.06] to-transparent p-6">
        <span className="grid size-12 place-items-center rounded-xl bg-linear-to-br from-indigo-500/15 to-violet-500/15 text-indigo-500">
          <FileText className="size-6" />
        </span>
        <div>
          <p className="font-medium">No resume yet</p>
          <p className="text-sm text-muted-foreground">
            Upload a PDF below. It will be attached to every email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-linear-to-r from-indigo-500/[0.08] via-violet-500/[0.04] to-transparent bg-card p-6 shadow-lg shadow-indigo-500/5">
      <span className="grid size-14 place-items-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25">
        <FileText className="size-7" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-lg font-semibold">
          {resume.name}
        </p>
        <p className="text-sm text-muted-foreground">
          PDF, {formatSize(resume.size)}. Uploaded{' '}
          {formatDate(resume.uploadedAt)}.
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() => window.open(resume.url, '_blank', 'noopener')}
      >
        <Eye /> View
      </Button>
    </div>
  );
}

type ListProps = {
  resumes: Resume[];
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  /** The resume being deleted right now, shown with a spinner */
  deletingId?: string | null;
};

/** All uploaded resumes, with set-default and delete actions */
export function ResumeList({
  resumes,
  onSetDefault,
  onDelete,
  deletingId = null,
}: ListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (resumes.length === 0) return null;

  return (
    <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
      {resumes.map((r) => {
        const confirming = confirmId === r.id;
        const deleting = deletingId === r.id;

        return (
          <li
            key={r.id}
            className={`flex flex-wrap items-center gap-3 p-4 transition-opacity ${
              r.isDefault
                ? 'bg-linear-to-r from-indigo-500/[0.07] to-transparent'
                : ''
            } ${deleting ? 'opacity-60' : ''}`}
          >
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-lg ${
                r.isDefault
                  ? 'bg-linear-to-br from-indigo-500/15 to-violet-500/15 text-indigo-500'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <FileText className="size-5" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-medium">
                <span className="truncate">{r.name}</span>
                {r.isDefault && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-linear-to-r from-indigo-500 to-violet-500 px-2 py-0.5 text-xs text-white">
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
                onClick={() => window.open(r.url, '_blank', 'noopener')}
              >
                <Eye />
              </Button>
              {!r.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={deleting}
                  onClick={() => onSetDefault(r.id)}
                >
                  <Star /> Make default
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${r.name}`}
                disabled={deleting}
                onClick={() => setConfirmId(r.id)}
              >
                {deleting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Trash2 className="text-destructive" />
                )}
              </Button>
            </div>

            {confirming && (
              <div
                role="group"
                aria-label={`Confirm deleting ${r.name}`}
                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg bg-destructive/5 px-3 py-2"
              >
                <p className="text-sm">
                  Delete <span className="font-medium">{r.name}</span>? This
                  can't be undone.
                  {r.isDefault &&
                    resumes.length > 1 &&
                    ' Your newest remaining resume will become the default.'}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    autoFocus
                    onClick={() => setConfirmId(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setConfirmId(null);
                      onDelete(r.id);
                    }}
                  >
                    <Trash2 /> Delete
                  </Button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
