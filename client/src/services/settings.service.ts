import { instance } from "../utils/instance"
import type { AppSettings } from "@/types/settings.type"

class SettingsService {
  async get(): Promise<AppSettings> {
    const res = await instance.get<AppSettings>("/settings")
    return res.data
  }

  async save(data: AppSettings): Promise<AppSettings> {
    const res = await instance.post<AppSettings>("/settings", data)
    return res.data
  }
}

export const settingsService = new SettingsService()