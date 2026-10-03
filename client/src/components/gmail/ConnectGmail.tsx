import { useState } from "react"
import { useGoogleLogin } from "@react-oauth/google"
import { Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/redux/hooks/useAuth"
import { dispatchAuth } from "@/redux/hooks/dispatchAuth"

export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send"
export const GMAIL_READ_SCOPE = "https://www.googleapis.com/auth/gmail.readonly"

export function ConnectGmail({ label = "Connect Gmail" }: { label?: string }) {
  const {connectGmail} = dispatchAuth()
  const { user, } = useAuth()
  const [busy, setBusy] = useState(false)

  const login = useGoogleLogin({
    flow: "auth-code", // returns a one-time code, not an access token
    scope: `openid email ${GMAIL_SEND_SCOPE} ${GMAIL_READ_SCOPE}`,
    hint: user?.email, // pre-selects the account they signed in with

    onSuccess: async (res) => {
      // Google lets users untick individual permissions, so check they gave it.
      if (!res.scope?.includes(GMAIL_SEND_SCOPE) || !res.scope?.includes(GMAIL_READ_SCOPE)){
        toast.error("Permission to send email wasn't granted", {
          description: "Tick the box that lets JobPilot send email on your behalf, then try again.",
        })
        return
      }

      setBusy(true)
      try {
        await connectGmail(res.code)
        toast.success("Gmail connected")
      } catch (e) {
        toast.error("Couldn't connect Gmail", { description: typeof e === "string" ? e : "Please try again." })
      } finally {
        setBusy(false)
      }
    },

    onError: () => toast.error("Google sign-in failed", { description: "Please try again." }),
    onNonOAuthError: () => {}, // user closed the pop-up, nothing to report
  })

  return (
    <Button onClick={() => login()} disabled={busy}>
      {busy ? <Loader2 className="animate-spin" /> : <Mail />}
      {busy ? "Connecting…" : label}
    </Button>
  )
}