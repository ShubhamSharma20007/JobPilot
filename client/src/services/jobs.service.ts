import { instance } from '../utils/instance';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  url: string | null;
  source: string;
  postedAt: string | null;
  contactEmail: string | null;
  snippet: string;
  score: number | null;
  status: 'new' | 'queued' | 'skipped';
  mine: boolean;
}

export interface JobsResponse {
  jobs: Job[];
  total: number;
  pageSize: number;
  aiReady: boolean;
  profileReady: boolean;
  appliedToday: number;
  aiDailyLimit: number;
}

export interface AiProfile {
  name: string | null;
  headline: string;
  titles: string[];
  skills: string[];
  years_experience: number | null;
  location: string | null;
  summary: string;
  highlights: string[];
}

export interface AiSettings {
  providers: { value: string; label: string; defaultModel: string }[];
  provider: string;
  model: string;
  keySaved: boolean;
  keyHint: string | null;
  dailyLimit: number;
  profile: AiProfile | null;
}

export interface ApplyResult {
  status: 'queued' | 'no_contact';
  applyUrl?: string | null;
  already?: boolean;
  subject?: string;
  body?: string;
  to?: string;
}

export interface JobFilters {
  q?: string;
  onlyEmail?: boolean;
  page?: number;
  location?: string;
  remote?: boolean;
  maxAgeDays?: number;
  sources?: string[];
  sort?: 'match' | 'new';
}

export interface ModelList {
  models: string[];
  live: boolean;
}

class JobsService {
  async list(f: JobFilters) {
    const res = await instance.get<JobsResponse>('/jobs', {
      params: {
        q: f.q || undefined,
        only_email: f.onlyEmail || undefined,
        page: f.page ?? 0,
        location: f.location || undefined,
        remote: f.remote || undefined,
        max_age_days: f.maxAgeDays || undefined,
        sources: f.sources?.length ? f.sources.join(',') : undefined,
        sort: f.sort ?? 'match',
      },
    });
    return res.data;
  }
  async apply(id: string) {
    return (await instance.post<ApplyResult>(`/jobs/${id}/apply`)).data;
  }
  async skip(id: string) {
    return (
      await instance.post<{ id: string; status: string }>(`/jobs/${id}/skip`)
    ).data;
  }

  async getAi() {
    return (await instance.get<AiSettings>('/jobs/ai/settings')).data;
  }
  async saveAi(input: {
    provider: string;
    model: string;
    dailyLimit: number;
    apiKey?: string;
  }) {
    return (await instance.put<AiSettings>('/jobs/ai/settings', input)).data;
  }
  async models(provider: string) {
    return (
      await instance.get<ModelList>('/jobs/ai/models', { params: { provider } })
    ).data;
  }
  async removeKey() {
    return (await instance.delete<AiSettings>('/jobs/ai/key')).data;
  }
  async testKey() {
    return (await instance.post<{ ok: boolean }>('/jobs/ai/test')).data;
  }
  async analyseResume() {
    return (await instance.post<AiSettings>('/jobs/ai/profile')).data;
  }
}

export const jobsService = new JobsService();
