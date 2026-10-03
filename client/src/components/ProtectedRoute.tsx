import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/redux/hooks/useAuth"
import { sheetService } from "@/services/sheet.service"
import { useEffect } from "react"

export function ProtectedRoute() {
  const { user, initialized } = useAuth()
  const location = useLocation()
  useEffect(() => {
  if (user) sheetService.setTimezone().catch(() => {})
}, [user?.id])

  if (!initialized) {
    return <div className="grid min-h-[60vh] place-items-center text-muted-foreground">Loading…</div>
  }
  if (!user) return <Navigate to="/" replace state={{ from: location }} />
  return <Outlet />
}