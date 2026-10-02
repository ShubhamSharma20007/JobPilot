export interface Resume {
  id: string
  name: string
  size: number // bytes
  uploadedAt: string // ISO date
  isDefault: boolean
  url: string // object URL for preview (swap for your backend URL later)
}