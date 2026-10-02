import { instance } from "../utils/instance"
import type { Resume } from "@/types/resume.type"

export interface DeleteResumeResult {
  id: string
  newDefaultId: string | null
}

class FileService {
  async markDefault(id: string): Promise<Resume> {
    const res = await instance.patch<Resume>(`/file/mark-default/${id}`)
    return res.data
  }

  async remove(id: string): Promise<DeleteResumeResult> {
    const res = await instance.delete<DeleteResumeResult>(`/file/${id}`)
    return res.data
  }
}

export const fileService = new FileService()