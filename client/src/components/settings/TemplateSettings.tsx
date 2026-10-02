import { useRef, useState } from "react"
import { Eye, Loader2, Mail, Pencil, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AppSettings } from "@/types/settings.type"
import { inputClass, SettingsCard } from "./primitives"
import { useAuth } from "@/redux/hooks/useAuth"
import { gmailService } from "@/services/gmail.service"
import { toast } from "sonner"
import { isAxiosError } from "axios"
import { dispatchAuth } from "@/redux/hooks/dispatchAuth"
type Props = { value: AppSettings; onChange: (patch: Partial<AppSettings>) => void; email: string; name: string }

const PLACEHOLDERS = ["{{company}}", "{{role}}", "{{recruiter_name}}", "{{name}}"]

function fill(text: string, name: string) {
  const sample: Record<string, string> = {
    company: "Acme Labs",
    role: "Full Stack Developer",
    recruiter_name: "Priya",
    name,
  }
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => sample[k] ?? m)
}

export function TemplateSettings({ value, onChange, email, name }: Props) {
  const [tab, setTab] = useState<"edit" | "preview">("edit")
  const[sent,setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const { user } = useAuth()
  const{fetchCurrentUser} = dispatchAuth()

  const connected = !!user?.gmail_connected
  const canSend = connected && !!value.subject.trim() && !!value.body.trim()

  function insert(token: string) {
    const el = bodyRef.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e } = el
    onChange({ body: value.body.slice(0, s) + token + value.body.slice(e) })
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(s + token.length, s + token.length)
    })
  }

async function sendTest() {
    setSending(true)
    try {
      const res = await gmailService.sendTest(value.subject, value.body)
      toast.success(`Test email sent to ${res.sent_to}`, {
        description: res.attached_resume
          ? `Attached: ${res.attached_resume}`
          : "No resume attached. Upload one on your Profile page.",
      })
    } catch (e) {
      const detail = isAxiosError(e) ? e.response?.data?.detail : null
      toast.error("Couldn't send test email", {
        description: typeof detail === "string" ? detail : "Please try again.",
      })
     fetchCurrentUser() // refreshes gmail_connected if the tokens were cleared
    } finally {
      setSending(false)
    }
  }

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
      active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
    }`

  return (
    <SettingsCard
      icon={Mail}
      title="Email template"
      description="The message every recruiter receives. Your resume is attached automatically."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {connected
              ? `Send a filled-in sample to ${email} before real emails go out.`
              : "Connect Gmail at the top of this page to send a test."}
          </p>
          <Button variant="outline" onClick={sendTest} disabled={!canSend || sending}>
            {sending ? <Loader2 className="animate-spin" /> : <Send />}
            {sending ? "Sending…" : "Send test to me"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-6">
        <div role="tablist" className="inline-flex gap-1 rounded-lg bg-muted p-1">
          <button role="tab" aria-selected={tab === "edit"} onClick={() => setTab("edit")} className={tabClass(tab === "edit")}>
            <Pencil className="size-3.5" /> Edit
          </button>
          <button
            role="tab"
            aria-selected={tab === "preview"}
            onClick={() => setTab("preview")}
            className={tabClass(tab === "preview")}
          >
            <Eye className="size-3.5" /> Preview
          </button>
        </div>

        {tab === "edit" ? (
          <>
            <div className="space-y-1.5">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>
              <input
                id="subject"
                value={value.subject}
                onChange={(e) => onChange({ subject: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="body" className="text-sm font-medium">
                Message
              </label>
              <textarea
                id="body"
                ref={bodyRef}
                rows={10}
                value={value.body}
                onChange={(e) => onChange({ body: e.target.value })}
                className="w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm leading-relaxed outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/50"
              />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground">Insert:</span>
                {PLACEHOLDERS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => insert(p)}
                    className="rounded-full border bg-muted/50 px-2.5 py-1 font-mono text-xs transition hover:bg-muted"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-background">
            <div className="space-y-1 border-b bg-muted/40 px-4 py-3 text-sm">
              <p>
                <span className="text-muted-foreground">From: </span>
                {name} &lt;{email}&gt;
              </p>
              <p>
                <span className="text-muted-foreground">To: </span>{email}
              </p>
              <p className="font-medium">{fill(value.subject, name)}</p>
            </div>
            <p className="max-w-prose px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap">{fill(value.body, name)}</p>
          </div>
        )}
      </div>
    </SettingsCard>
  )
}