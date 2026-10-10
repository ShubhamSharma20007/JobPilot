import { instance } from '../utils/instance';

export interface TestEmailResult {
  sent_to: string;
  queued: boolean;
}

export interface GmailStatus {
  gmail_connected: boolean;
  gmail_bounce_check: boolean;
}

class GmailService {
  async connect(code: string): Promise<GmailStatus> {
    const res = await instance.post<GmailStatus>('/gmail/connect', { code });
    return res.data;
  }

  async disconnect(): Promise<GmailStatus> {
    const res = await instance.post<GmailStatus>('/gmail/disconnect');
    return res.data;
  }

  async sendTest(subject: string, body: string): Promise<TestEmailResult> {
    const res = await instance.post<TestEmailResult>('/gmail/test', {
      subject,
      body,
    });
    return res.data;
  }
}

export const gmailService = new GmailService();
