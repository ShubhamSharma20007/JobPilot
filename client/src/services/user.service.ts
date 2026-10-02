import { instance } from "../utils/instance"
import type { UpdateProfileInput, UpdateProfileResponse } from "@/types/user.type"

class UserService {
  async updateProfile(data: UpdateProfileInput): Promise<UpdateProfileResponse> {
    const fd = new FormData()
    if (data.name !== undefined) fd.append("name", data.name)
    if (data.resume) fd.append("resume", data.resume)
    if (data.makeDefault) fd.append("make_default", "true")

    const res = await instance.patch<UpdateProfileResponse>("/user/profile", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return res.data
  }
}

export const userService = new UserService()