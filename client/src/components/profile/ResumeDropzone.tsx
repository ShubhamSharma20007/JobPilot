import { useRef, useState, type DragEvent, type KeyboardEvent } from "react"
import { AlertCircle, UploadCloud } from "lucide-react"

const MAX_MB = 5

type Props = { onFiles: (files: File[]) => void }

export function ResumeDropzone({ onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  function handle(list: FileList | null) {
    if (!list) return
    const valid: File[] = []
    const errs: string[] = []
    Array.from(list).forEach((f) => {
      const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
      if (!isPdf) errs.push(`${f.name} is not a PDF.`)
      else if (f.size > MAX_MB * 1024 * 1024) errs.push(`${f.name} is larger than ${MAX_MB} MB.`)
      else valid.push(f)
    })
    setErrors(errs)
    if (valid.length) onFiles(valid)
    if (inputRef.current) inputRef.current.value = "" // allow re-selecting the same file
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    handle(e.dataTransfer.files)
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload resumes. Drag and drop PDF files or press Enter to browse."
        onClick={() => inputRef.current?.click()}
        onKeyDown={onKeyDown}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
          dragging ? "border-primary bg-primary/5" : "bg-muted/30 hover:border-muted-foreground/50 hover:bg-muted/50"
        }`}
      >
        <span
          className={`grid size-12 place-items-center rounded-full transition ${
            dragging ? "scale-110 bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          <UploadCloud className="size-6" />
        </span>
        <div>
          <p className="font-medium">{dragging ? "Drop to upload" : "Drag and drop your resumes here"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            or <span className="font-medium text-foreground underline underline-offset-4">browse files</span>. PDF only,
            up to {MAX_MB} MB each.
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

      {errors.length > 0 && (
        <ul className="mt-3 space-y-1" role="alert">
          {errors.map((m) => (
            <li key={m} className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" /> {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}