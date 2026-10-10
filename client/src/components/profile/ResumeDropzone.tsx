import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { MAX_RESUME_MB } from '@/types/resume.type';

type Props = {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  /** Replaces the usual hint, e.g. when the resume limit is reached */
  message?: string;
};

export function ResumeDropzone({ onFiles, disabled = false, message }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handle(list: FileList | null) {
    if (disabled || !list) return;
    const valid: File[] = [];

    for (const f of Array.from(list)) {
      const isPdf =
        f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        toast.error(`${f.name} isn't a PDF`, {
          description: 'Only PDF files can be uploaded.',
        });
      } else if (f.size > MAX_RESUME_MB * 1024 * 1024) {
        toast.error(`${f.name} is too large`, {
          description: `Each file must be ${MAX_RESUME_MB} MB or smaller.`,
        });
      } else {
        valid.push(f);
      }
    }

    if (inputRef.current) inputRef.current.value = ''; // allows picking the same file again
    if (valid.length) onFiles(valid);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); // always, so the browser never opens a dropped PDF
    setDragging(false);
    handle(e.dataTransfer.files);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      inputRef.current?.click();
    }
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="Upload resumes. Drag and drop PDF files or press Enter to browse."
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={onKeyDown}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node))
          setDragging(false);
      }}
      onDrop={onDrop}
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition outline-none focus-visible:ring-3 focus-visible:ring-indigo-500/40 ${
        disabled
          ? 'cursor-not-allowed bg-muted/30 opacity-60'
          : dragging
            ? 'cursor-pointer border-indigo-500 bg-indigo-500/10'
            : 'cursor-pointer border-indigo-500/25 bg-linear-to-b from-indigo-500/[0.06] to-transparent hover:border-indigo-500/50 hover:from-indigo-500/10'
      }`}
    >
      <span
        className={`grid size-12 place-items-center rounded-full transition ${
          dragging
            ? 'scale-110 bg-linear-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30'
            : 'bg-linear-to-br from-indigo-500/15 to-violet-500/15 text-indigo-500'
        }`}
      >
        <UploadCloud className="size-6" />
      </span>
      <div>
        <p className="font-medium">
          {dragging ? 'Drop to upload' : 'Drag and drop your resumes here'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {message ?? (
            <>
              or{' '}
              <span className="font-medium text-foreground underline underline-offset-4">
                browse files
              </span>
              . PDF only, up to {MAX_RESUME_MB} MB each.
            </>
          )}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(e) => handle(e.target.files)}
      />
    </div>
  );
}
