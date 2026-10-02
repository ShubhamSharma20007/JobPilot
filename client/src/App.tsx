import { useEffect } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { useAppDispatch } from "@/redux/hook"
import { fetchCurrentUser } from "@/redux/slices/authSlice"
import { Layout } from "@/components/Layout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import Landing from "@/pages/Landing"
import Profile from "@/pages/Profile"
import Settings from "@/pages/Settings"
import Sheet from "./pages/Sheet"

const App = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(fetchCurrentUser())
  }, [dispatch])

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="sheet" element={<Sheet />} />
        </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App