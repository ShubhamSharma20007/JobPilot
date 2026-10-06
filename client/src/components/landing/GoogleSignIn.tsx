// GoogleSignIn.tsx
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google"
import { useSearchParams } from "react-router-dom"
import { loginWithGoogle } from "@/redux/slices/authSlice"
import { useAppDispatch } from "@/redux/hook"
import { notifyExtensionLoggedIn } from "@/utils/extension"

const WIDTH = 180
const HEIGHT = 40 // matches Google's "large" button

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="size-[18px]" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

export function GoogleSignIn() {
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const fromExtension = searchParams.get("from") === "extension"

  async function handleGoogleLogin(res: CredentialResponse) {
    if (!res.credential) return
    try {
      await dispatch(loginWithGoogle(res.credential)).unwrap()
      if (fromExtension) notifyExtensionLoggedIn() // extension closes this tab and opens its popup
    } catch (error) {
      console.error("Token verification failed", error)
      alert("Failed to verify token on backend.")
    }
  }

  return (
    <div style={{ width: WIDTH, height: HEIGHT }} className="group relative shrink-0 overflow-hidden rounded-full">
      <div className="pointer-events-none flex size-full items-center justify-center gap-2 rounded-full border bg-background text-sm font-medium text-foreground transition-colors group-hover:bg-muted">
        <GoogleG />
        Sign in with Google
      </div>

      <div className="absolute inset-0 z-10 opacity-[0.01] [&_iframe]:!m-0 [&_iframe]:!block">
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => alert("Login failed. Please try again.")}
          size="large"
          shape="pill"
          text="signin_with"
          width={WIDTH}
        />
      </div>
    </div>
  )
}