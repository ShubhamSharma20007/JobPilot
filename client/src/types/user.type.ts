import type { Resume } from "./resume.type"

export interface User {
  id: string
  email: string
  name: string | null
  picture: string | null
  google_id: string
  is_active: boolean
  created_at?: string
  updated_at?: string | null
  resume_id?: string | null
  gmail_connected?: boolean
}

/** What GET /auth/me returns: the user plus all of their resumes */
export interface CurrentUserResponse extends User {
  resumes: Resume[]
}

export interface UpdateProfileInput {
  name?: string
  resume?: File
  makeDefault?: boolean
}

export interface UpdateProfileResponse {
  user: User
  resume: Resume | null
}