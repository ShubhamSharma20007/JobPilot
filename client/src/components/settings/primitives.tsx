import type { ReactNode } from "react"

export const inputClass =
  "h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/50 aria-invalid:border-destructive"

/** Shared accent so every gradient on the page matches the landing page */
export const gradientBtn =
  "border-transparent bg-linear-to-r from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/20 hover:bg-linear-to-r hover:from-indigo-500 hover:to-violet-500 hover:opacity-90"

export function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
  footer,
}: {
  icon: React.ElementType
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <header className="relative flex items-start gap-3 border-b bg-linear-to-r from-indigo-500/[0.06] via-transparent to-transparent p-6">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-linear-to-br from-indigo-500/15 to-violet-500/15 text-indigo-500 ring-1 ring-indigo-500/15">
          <Icon className="size-5" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="divide-y">{children}</div>
      {footer && <div className="border-t bg-muted/30 px-6 py-4">{footer}</div>}
    </section>
  )
}

/** One setting: label + help text on the left, control on the right (stacks on mobile) */
export function SettingRow({
  label,
  help,
  htmlFor,
  wide,
  children,
}: {
  label: string
  help?: string
  htmlFor?: string
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="max-w-md">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {help && <p className="mt-0.5 text-sm text-muted-foreground">{help}</p>}
      </div>
      <div className={`w-full min-w-0 sm:shrink-0 ${wide ? "sm:w-80" : "sm:w-60"}`}>{children}</div>
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  id,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  id?: string
  label: string
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
        checked ? "border-transparent bg-linear-to-r from-indigo-500 to-violet-500" : "bg-muted"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-4.5 rounded-full bg-background shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        } ${checked ? "" : "border"}`}
      />
    </button>
  )
}