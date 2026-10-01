import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { isAxiosError } from "axios"
import type { User } from "@/types/user.type"
import { authService } from "@/services/auth.service"

type AuthState = {
  user: User | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
  initialized: boolean
}

const initialState: AuthState = { user: null, status: "idle", error: null, initialized: false }

function errorMessage(e: unknown, fallback: string) {
  if (isAxiosError(e) && typeof e.response?.data?.detail === "string") return e.response.data.detail
  return fallback
}

export const loginWithGoogle = createAsyncThunk<User, string, { rejectValue: string }>(
  "auth/loginWithGoogle",
  async (credential, { rejectWithValue }) => {
    try {
      return await authService.verifyToken(credential)
    } catch (e) {
      return rejectWithValue(errorMessage(e, "Failed to verify token on backend."))
    }
  }
)


export const fetchCurrentUser = createAsyncThunk<User>("auth/fetchCurrentUser", async () => {
  return await authService.getMe()
})

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await authService.logout()
  } catch {

  }
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
    },
    removeUser: (state) => {
      state.user = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithGoogle.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.user = action.payload
        state.initialized = true
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload ?? "Login failed."
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload
        state.initialized = true
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null
        state.initialized = true
      })
      .addCase(logout.fulfilled, () => ({ 
        ...initialState, initialized: true
       }))
  },
})

export const { setUser, removeUser } = authSlice.actions
export default authSlice.reducer