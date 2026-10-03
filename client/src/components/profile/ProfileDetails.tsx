import { useState } from "react"
import { CalendarDays, CheckCircle2, Lock, Mail, Save, ShieldCheck, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/landing/UserAvatar"
import { gradientBtn } from "@/components/settings/primitives"
import type { User } from "@/types/user.type"

const inputBase =
  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/50"

function Field({
  label,
  icon: Icon,
  hint,
  children,
}: {
  label: string
  icon: React.ElementType
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className="size-3.5 text-indigo-500" />
        {label}
      </span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

function LockedInput({ value }: { value: string }) {
  return (
    <div className="relative">
      <input
        value={value}
        disabled
        readOnly
        className={`${inputBase} cursor-not-allowed bg-muted/60 pr-9 text-muted-foreground disabled:opacity-100`}
      />
      <Lock className="absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  )
}

function formatDate(iso?: string) {
  if (!iso) return "—"
  const d = new Date(iso.replace(" ", "T"))
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
}

export function ProfileDetails({ user }: { user: User }) {
  const label = user.name ?? user.email
  const initials = label.slice(0, 2).toUpperCase()
  const [name, setName] = useState(user.name ?? "")
  const dirty = name.trim() !== (user.name ?? "")

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-lg shadow-indigo-500/5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 border-b bg-linear-to-r from-indigo-500/[0.08] via-violet-500/[0.04] to-transparent p-6">
        {/* Gradient ring around the avatar */}
        <span className="rounded-full ">
          <span className="block rounded-full bg-card p-0.5">
            <UserAvatar
              src={user.picture ?? "https://github.com/shadcn.png"}
              label={label}
              initials={initials}
              className="size-16"
            />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-heading text-xl font-semibold">{user.name ?? "Your account"}</h2>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
            user.is_active
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "text-destructive"
          }`}
        >
          <CheckCircle2 className="size-3.5" />
          {user.is_active ? "Active account" : "Inactive account"}
        </span>
      </div>

      {/* Fields */}
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <Field label="Full name" icon={UserRound} hint="This name appears in your email signature.">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={inputBase}
          />
        </Field>

        <Field label="Email" icon={Mail} hint="Linked to your Google account. Applications are sent from this address.">
          <LockedInput value={user.email} />
        </Field>

        <Field label="Member since" icon={CalendarDays}>
          <LockedInput value={formatDate(user.created_at)} />
        </Field>

        <Field label="Google account ID" icon={ShieldCheck}>
          <LockedInput value={user.google_id} />
        </Field>
      </div>

      <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-6 py-4">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3" /> Locked fields come from Google and can't be changed here.
        </p>
        <Button
          className={gradientBtn}
          disabled={!dirty || !name.trim()}
          onClick={() => console.log("TODO: save name", name)}
        >
          <Save /> Save changes
        </Button>
      </div>
    </div>
  )
}