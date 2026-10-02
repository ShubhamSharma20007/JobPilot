import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { isAxiosError } from "axios"
import type { CurrentUserResponse, UpdateProfileInput, UpdateProfileResponse, User } from "@/types/user.type"
import type { Resume } from "@/types/resume.type"
import { authService } from "@/services/auth.service"
import { userService } from "@/services/user.service"
import { fileService, type DeleteResumeResult } from "@/services/file.service"

type AuthState = {
  user: User | null
  resumes: Resume[]
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
  initialized: boolean
  profileStatus: "idle" | "loading" | "succeeded" | "failed"
  profileError: string | null
}

const initialState: AuthState = {
  user: null,
  resumes: [],
  status: "idle",
  error: null,
  initialized: false,
  profileStatus: "idle",
  profileError: null,
}

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

// Returns the user plus their resumes
export const fetchCurrentUser = createAsyncThunk<CurrentUserResponse>("auth/fetchCurrentUser", async () => {
  return await authService.getMe()
})

export const updateProfile = createAsyncThunk<UpdateProfileResponse, UpdateProfileInput, { rejectValue: string }>(
  "auth/updateProfile",
  async (input, { rejectWithValue }) => {
    try {
      return await userService.updateProfile(input)
    } catch (e) {
      return rejectWithValue(errorMessage(e, "Failed to update profile."))
    }
  }
)

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await authService.logout()
  } catch {

  }
})


//  Mark default Thunk

export const markDefaultResume = createAsyncThunk<Resume, string, { rejectValue: string }>(
  "auth/markDefaultResume",
  async (id, { rejectWithValue }) => {
    try {
      return await fileService.markDefault(id)
    } catch (e) {
      return rejectWithValue(errorMessage(e, "Could not change your default resume."))
    }
  }
)

//  delete resume 

export const deleteResume = createAsyncThunk<DeleteResumeResult, string, { rejectValue: string }>(
  "auth/deleteResume",
  async (id, { rejectWithValue }) => {
    try {
      return await fileService.remove(id)
    } catch (e) {
      return rejectWithValue(errorMessage(e, "Could not delete the resume."))
    }
  }
)

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
    // TODO: these two only change local state until the backend has set-default / delete routes
    setDefaultResume: (state, action: PayloadAction<string>) => {
      state.resumes.forEach((r) => {
        r.isDefault = r.id === action.payload
      })
    },
    removeResume: (state, action: PayloadAction<string>) => {
      state.resumes = state.resumes.filter((r) => r.id !== action.payload)
      if (state.resumes.length && !state.resumes.some((r) => r.isDefault)) state.resumes[0].isDefault = true
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
        const { resumes, ...user } = action.payload
        state.user = user
        state.resumes = resumes ?? []
        state.initialized = true
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null
        state.resumes = []
        state.initialized = true
      })
      .addCase(updateProfile.pending, (state) => {
        state.profileStatus = "loading"
        state.profileError = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profileStatus = "succeeded"
        state.user = action.payload.user
        const resume = action.payload.resume
        if (resume) {
          if (resume.isDefault) state.resumes.forEach((r) => (r.isDefault = false))
          state.resumes.push(resume)
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.profileStatus = "failed"
        state.profileError = action.payload ?? "Failed to update profile."
      })
      .addCase(logout.fulfilled, () => ({
        ...initialState, initialized: true
      }))
      //  mark defalult
      .addCase(markDefaultResume.fulfilled, (state, action) => {
        state.resumes.forEach((r) => {
          r.isDefault = r.id === action.payload.id
        })
      })
      //  delete resume file
      .addCase(deleteResume.fulfilled, (state, action) => {
        state.resumes = state.resumes.filter((r) => r.id !== action.payload.id)
        const { newDefaultId } = action.payload
        if (newDefaultId) {
          state.resumes.forEach((r) => {
            r.isDefault = r.id === newDefaultId
          })
        }
      })
  },
})

export const { setUser, removeUser } = authSlice.actions
export default authSlice.reducer