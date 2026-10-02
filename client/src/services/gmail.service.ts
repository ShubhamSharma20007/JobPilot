import { instance } from "../utils/instance"

class GmailService {
  async connect(code: string): Promise<{ gmail_connected: boolean }> {
    const res = await instance.post<{ gmail_connected: boolean }>("/gmail/connect", { code })
    return res.data
  }
}

export const gmailService = new GmailService()