import { instance } from "../utils/instance"

export interface TestEmailResult {
  sent_to: string
  attached_resume: string | null
}

class GmailService {
  async connect(code: string): Promise<{ gmail_connected: boolean }> {
    const res = await instance.post<{ gmail_connected: boolean }>("/gmail/connect", { code })
    return res.data
  }

  async sendTest(subject: string, body: string): Promise<TestEmailResult> {
    const res = await instance.post<TestEmailResult>("/gmail/test", { subject, body })
    return res.data
  }
}

export const gmailService = new GmailService()