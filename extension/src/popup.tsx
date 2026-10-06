import { useEffect, useState } from "react"
import { Button } from "./components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./components/ui/card"
import { Info, ExternalLink } from "lucide-react"
import { cn } from "./lib/utils"

const JOBPILOT_URL = "http://localhost:5173"

type User = {
  name: string
  email: string
  picture?: string
}

export default function Popup() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [adding, setAdding] = useState(false)
  const [status, setStatus] = useState<{ msg: string; type: "success" | "warn" | "error" | "" }>({ msg: "", type: "" })

 useEffect(() => {
  const check = () =>
    chrome.runtime.sendMessage({ type: "CHECK_AUTH" }, (res) => {
      setUser(res?.user || null)
      setLoading(false)
    })

  check()

  const onMsg = (m: any) => { if (m?.type === "AUTH_CHANGED") check() }
  chrome.runtime.onMessage.addListener(onMsg)
  window.addEventListener("focus", check)

  return () => {
    chrome.runtime.onMessage.removeListener(onMsg)
    window.removeEventListener("focus", check)
  }
}, [])

  const handleLogin = () => {
    chrome.runtime.sendMessage({ type: "OPEN_LOGIN" })
    window.close()
  }

  const handleLogout = async () => {
    await chrome.storage.local.remove(["jp_user", "jp_token"])
    fetch("http://localhost:8001/auth/logout", { method: "POST", credentials: "include" }).catch(() => {})
    setUser(null)
  }

  const handleOpenSheet = () => {
    chrome.runtime.sendMessage({ type: "OPEN_SHEET" })
    window.close()
  }

  const handleAdd = async () => {
    const trimmed = email.trim()
    if (!trimmed) {
      setStatus({ msg: "Enter an email address", type: "warn" })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setStatus({ msg: "That doesn't look like a valid email", type: "error" })
      return
    }

    setAdding(true)
    setStatus({ msg: "", type: "" })

    chrome.runtime.sendMessage({ type: "ADD_EMAIL", email: trimmed }, (res) => {
      setAdding(false)
      if (res.ok) {
        setStatus({ msg: "✓ Added to your sheet!", type: "success" })
        setEmail("")
        setTimeout(() => setStatus({ msg: "", type: "" }), 3000)
      } else if (res.error === "DUPLICATE") {
        setStatus({ msg: "⚠ Already in your sheet", type: "warn" })
      } else if (res.error === "INVALID_EMAIL") {
        setStatus({ msg: "✕ Invalid email address", type: "error" })
      } else if (res.error === "NOT_AUTHENTICATED") {
        setUser(null)
      } else {
        setStatus({ msg: "✕ Couldn't add – please try again", type: "error" })
      }
    })
  }

  return (
   <div className="flex flex-col min-h-screen w-full">
      {/* ── Header ── */}
      <div className="relative flex items-center gap-3 p-4 border-b border-border bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-transparent">
        <svg viewBox="0 0 64 64" width="32" height="32" aria-hidden="true" className="flex-shrink-0">
          <rect width="64" height="64" rx="16" className="fill-primary" />
          <path d="M11 50 C15 44 19 42 24 40" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 5" className="stroke-primary-foreground/70" />
          <path d="M49 15 L14 29 L27 36 L34 50 Z" strokeLinejoin="round" className="fill-primary-foreground" />
          <path d="M27 36 L49 15" fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-primary" />
        </svg>
        <div>
          <h1 className="font-heading font-bold text-[18px] leading-tight tracking-tight text-foreground">
            JobPilot
          </h1>
          <p className="text-xs text-muted-foreground">Add recruiter emails to your sheet</p>
        </div>
        <span className="ml-auto text-[10px] font-medium tracking-widest uppercase px-2 py-0.5 rounded-full border border-indigo-500/40 border-dashed bg-indigo-500/5 text-indigo-500">
          v1.0
        </span>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 p-3 flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col gap-2.5 p-2">
            <div className="h-3 rounded-full bg-muted animate-pulse w-[70%]" />
            <div className="h-3 rounded-full bg-muted animate-pulse w-[50%]" />
          </div>
        ) : !user ? (
          /* ── Logged-out Card ── */
          <Card>
            <CardContent className="p-4 flex flex-col gap-4">
              <p className="text-[13px] text-muted-foreground">
                Sign in to JobPilot to start saving recruiter emails directly from any page.
              </p>
              <Button variant="outline" className="w-full rounded-full gap-2 text-[14px]" onClick={handleLogin}>
                <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                Sign in with Google
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── User Card ── */}
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-transparent">
                <Avatar className="h-10 w-10 border border-border flex-shrink-0">
                  <AvatarImage src={user.picture} alt="Avatar" />
                  <AvatarFallback className="bg-muted text-muted-foreground text-[13px]">
                    {(user.name || user.email).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-semibold text-[14px] truncate text-card-foreground">
                    {user.name || "Signed in"}
                  </div>
                  <div className="text-[12px] text-muted-foreground truncate">{user.email}</div>
                </div>
                <span className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
            </Card>

            {/* ── Tip Card ── */}
            <Card className="border-indigo-500/30 border-dashed bg-gradient-to-r from-indigo-500/8 to-transparent shadow-none">
              <CardContent className="p-3 flex gap-2.5">
                <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[13px] text-muted-foreground">
                  <span className="font-medium text-foreground">Select an email</span> anywhere on a page — a JobPilot card appears so you can add it instantly.
                </p>
              </CardContent>
            </Card>

            {/* ── Quick-Add Card ── */}
            <Card>
              <CardHeader className="p-3 pb-2">
                <CardTitle className="flex items-center gap-2 text-[13px]">
                  <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                  Add manually
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder="recruiter@company.com"
                    spellCheck="false"
                    autoComplete="off"
                    className="flex-1 h-9 px-3 border border-border rounded-lg bg-background text-[13px] text-foreground outline-none focus:border-muted-foreground focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground"
                  />
                  <Button
                    onClick={handleAdd}
                    disabled={adding}
                    className="h-9 px-4 cursor-pointer bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow shadow-indigo-500/25 hover:opacity-90 transition-opacity text-[13px]"
                  >
                    {adding ? "..." : "Add"}
                  </Button>
                </div>
                {status.msg && (
                  <p className={cn(
                    "text-[12px]",
                    status.type === "success" && "text-emerald-600 dark:text-emerald-400",
                    status.type === "warn" && "text-amber-600 dark:text-amber-400",
                    status.type === "error" && "text-destructive"
                  )}>
                    {status.msg}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* ── Open Sheet ── */}
            <Button
              variant="outline"
              className="w-full cursor-pointer gap-2 text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
              onClick={handleOpenSheet}
            >
              <ExternalLink className="w-4 h-4" />
              Open your sheet
            </Button>
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="mt-auto flex items-center gap-2 px-4 py-3 border-t border-border bg-black/5 dark:bg-white/5">
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); chrome.tabs.create({ url: JOBPILOT_URL }); window.close(); }}
          className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          JobPilot.app
        </a>
        <span className="flex-1" />
        <a
          href={`${JOBPILOT_URL}/privacy`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Privacy
        </a>
        <span className="text-border">·</span>
        <button
          onClick={handleLogout}
          className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
