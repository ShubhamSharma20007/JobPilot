import { GoogleLogin, type CredentialResponse } from "@react-oauth/google"
import { useTheme } from "@/context/theme-context"
import { loginWithGoogle } from "@/redux/slices/authSlice"
import { useAppDispatch } from "@/redux/hook"

export function GoogleSignIn({ size = "medium" }: { size?: "small" | "medium" | "large" }) {
  const { theme } = useTheme()
  const dispatch = useAppDispatch()

  async function handleGoogleLogin(res: CredentialResponse) {
    if (!res.credential) return
    try {
      const result = await dispatch(loginWithGoogle(res.credential)).unwrap() // returns user instead of returning redux action
      console.log("Logged in user:", result)
    } catch (error) {
      console.error("Token verification failed", error)
      alert("Failed to verify token on backend.")
    }
  }

  return (
    <GoogleLogin
      key={theme} // re-render Google's button when theme changes
      onSuccess={handleGoogleLogin}
      onError={() => alert("Login failed. Please try again.")}
      theme={theme === "dark" ? "filled_black" : "outline"}
      size={size}
      shape="pill"
      text="signin_with"
    />
  )
}