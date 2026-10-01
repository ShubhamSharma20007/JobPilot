import { instance } from "../utils/instance"
import type { User } from "@/types/user.type"

class AuthService {
  async verifyToken(credential: string): Promise<User> {
    const res = await instance.post<User>("/auth/google/verify", { token: credential })
    return res.data
  }

  async getMe(): Promise<User> {
    const res = await instance.get<User>("/auth/me")
    return res.data
  }

  async logout(): Promise<void> {
    await instance.post("/auth/logout")
  }
}

export const authService = new AuthService()