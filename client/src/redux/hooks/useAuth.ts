import { type User } from "@/types/user.type"
import { useAppDispatch, useAppSelector } from "../hook"
import { setUser, removeUser, logout } from "../slices/authSlice"

export function useAuth() {
  const dispatch = useAppDispatch()
  return {
    user: useAppSelector((state) => state.auth.user),
    setUser: (user: User) => {
      dispatch(setUser(user))
    },
    clearUser: () => {
      dispatch(removeUser())
    },
    logout: () => dispatch(logout()),
  }
}