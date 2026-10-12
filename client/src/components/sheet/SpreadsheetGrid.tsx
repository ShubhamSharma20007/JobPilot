import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SheetRow } from '@/types/sheet.type';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COLUMNS = [
  {
    key: 'recruiter',
    label: 'Recruiter emails',
    hint: 'Type or paste here',
    // sticky on small screens so the email stays visible while scrolling sideways
    th: 'min-w-[15rem] max-md:sticky max-md:left-12 max-md:z-20 max-md:bg-muted',
  },
  {
    key: 'delivered',
    label: 'Delivered emails',
    hint: 'Filled automatically',
    th: 'min-w-[11rem]',
  },
  {
    key: 'failed',
    label: 'Failed emails',
    hint: 'Filled automatically',
    th: 'min-w-[16rem]',
  },
] as const;

type CellStatus = 'empty' | 'ok' | 'invalid' | 'duplicate';

export const newRow = (): SheetRow => ({
  id: crypto.randomUUID(),
  recruiter: '',
  delivered: '',
  failed: '',
  url: '',
});
export const makeRows = (n: number): SheetRow[] =>
  Array.from({ length: n }, () => newRow());

// Bounce messages can arrive with HTML entities (e.g. We&#39;re), so decode them for display
const ENTITIES: Record<string, string> = {
  '&#39;': "'",
  '&apos;': "'",
  '&quot;': '"',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
};
const decode = (s: string) =>
  s.replace(/&#39;|&apos;|&quot;|&amp;|&lt;|&gt;|&nbsp;/g, (m) => ENTITIES[m]);

type Props = { rows: SheetRow[]; onChange: (rows: SheetRow[]) => void };

export function SpreadsheetGrid({ rows, onChange }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Work out each cell's status once per render
  const seen = new Set<string>();
  const statuses: CellStatus[] = rows.map((r) => {
    const v = r.recruiter.trim().toLowerCase();
    if (!v) return 'empty';
    if (!EMAIL_RE.test(v)) return 'invalid';
    if (seen.has(v)) return 'duplicate';
    seen.add(v);
    return 'ok';
  });

  const ready = statuses.filter((s) => s === 'ok').length;
  const delivered = rows.filter((r) => r.delivered).length;
  const failed = rows.filter((r) => r.failed).length;

  function focusRow(i: number) {
    requestAnimationFrame(() =>
      gridRef.current
        ?.querySelector<HTMLInputElement>(`[data-row="${i}"]`)
        ?.focus()
    );
  }

  function setRecruiter(i: number, value: string) {
    onChange(
      rows.map((r, idx) => (idx === i ? { ...r, recruiter: value } : r))
    );
  }

  function removeRow(i: number) {
    const next = rows.filter((_, idx) => idx !== i);
    onChange(next.length ? next : [newRow()]);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (i === rows.length - 1) onChange([...rows, newRow()]);
      focusRow(i + 1);
    } else if (e.key === 'ArrowDown' && i < rows.length - 1) {
      e.preventDefault();
      focusRow(i + 1);
    } else if (e.key === 'ArrowUp' && i > 0) {
      e.preventDefault();
      focusRow(i - 1);
    }
  }

  // Pasting several emails (one per line, or comma separated) fills the rows below
  function onPaste(e: ClipboardEvent<HTMLInputElement>, i: number) {
    const items = e.clipboardData
      .getData('text')
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length < 2) return;
    e.preventDefault();

    const next = [...rows];
    items.forEach((value, k) => {
      if (i + k >= next.length) next.push(newRow());
      next[i + k] = { ...next[i + k], recruiter: value };
    });
    onChange(next);
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-lg shadow-indigo-500/5">
        {/* Thin gradient accent along the top edge */}
        <div
          aria-hidden
          className="h-0.5 bg-linear-to-r from-indigo-500 to-violet-500"
        />

        {/* Scrolls sideways on narrow screens; the row number and email columns stay pinned */}
        <div
          ref={gridRef}
          className="max-h-[65dvh] overflow-auto overscroll-x-contain"
        >
          <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-30 bg-muted">
              <tr>
                <th
                  className="sticky left-0 z-20 w-12 min-w-12 border-r border-b bg-muted max-md:z-30"
                  aria-label="Row"
                />
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className={`border-b border-r bg-muted px-3 py-2 text-left whitespace-nowrap last:border-r-0 ${c.th}`}
                  >
                    <span className="block font-medium">{c.label}</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {c.hint}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const status = statuses[i];
                const bad = status === 'invalid' || status === 'duplicate';
                const failedText = row.failed ? decode(row.failed) : '';
                return (
                  <tr key={row.id} className="group">
                    <td className="sticky left-0 z-10 h-9 w-12 min-w-12 border-r border-b bg-muted text-center text-xs text-muted-foreground">
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

                    <td className="border-r border-b bg-card p-0 max-md:sticky max-md:left-12 max-md:z-10 max-md:shadow-[1px_0_0_var(--border)]">
                      <input
                        data-row={i}
                        value={row.recruiter}
                        onChange={(e) => setRecruiter(i, e.target.value)}
                        onKeyDown={(e) => onKeyDown(e, i)}
                        onPaste={(e) => onPaste(e, i)}
                        aria-label={`Recruiter email, row ${i + 1}`}
                        aria-invalid={bad}
                        title={
                          status === 'invalid'
                            ? 'Not a valid email address'
                            : status === 'duplicate'
                              ? 'This email is already in the list'
                              : row.recruiter || undefined
                        }
                        placeholder={i === 0 ? 'recruiter@company.com' : ''}
                        spellCheck={false}
                        autoComplete="off"
                        className={`h-9 w-full min-w-[15rem] bg-transparent px-3 text-ellipsis outline-none focus:bg-indigo-500/5 focus:ring-2 focus:ring-indigo-500/50 focus:ring-inset ${
                          bad ? 'text-destructive' : ''
                        }`}
                      />
                    </td>

                    <td
                      className={`h-9 border-r border-b bg-muted/30 px-3 text-xs whitespace-nowrap sm:text-sm ${
                        row.delivered
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {row.delivered}
                    </td>

                    <td
                      className={`h-9 border-b bg-muted/30 px-3 py-1 align-middle text-xs sm:text-sm ${
                        row.failed ? 'text-destructive' : 'text-muted-foreground'
                      }`}
                    >
                      {failedText && (
                        <span
                          className="line-clamp-2 break-words"
                          title={failedText}
                        >
                          {failedText}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-indigo-500" /> {ready}{' '}
            ready
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />{' '}
            {delivered} delivered
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-destructive" /> {failed}{' '}
            failed
          </span>
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange([...rows, ...makeRows(10)])}
        >
          <Plus /> Add 10 rows
        </Button>
      </div>
    </div>
  );
}