import { instance } from "../utils/instance"

export interface SheetRowOut {
  id: string
  email: string
  status: "draft" | "pending" | "sending" | "sent" | "failed" | "skipped"
  sentAt: string | null
  lastError: string | null
}
export interface SheetResponse { rows: SheetRowOut[]; syncMinutes: number }

class SheetService {
  async list() { return (await instance.get<SheetResponse>("/sheet")).data }
  async save(rows: { id: string; email: string }[]) { return (await instance.put<SheetResponse>("/sheet", { rows })).data }
  async setSync(minutes: number) {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return (await instance.patch<{ syncMinutes: number }>("/sheet/sync", { minutes, timezone })).data
  }
  async setTimezone() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    await instance.patch("/sheet/sync", { timezone })
  }
}
export const sheetService = new SheetService()