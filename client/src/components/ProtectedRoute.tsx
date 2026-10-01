import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAppSelector } from "@/redux/hook"

export function ProtectedRoute() {
  const { user, initialized } = useAppSelector((s) => s.auth)
  const location = useLocation()

  if (!initialized) {
    return <div className="grid min-h-[60vh] place-items-center text-muted-foreground">Loading…</div>
  }
  if (!user) return <Navigate to="/" replace state={{ from: location }} />
  return <Outlet />
}