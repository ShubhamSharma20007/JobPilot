import { instance } from "../utils/instance"
import type { Resume } from "@/types/resume.type"

class FileService {
  async markDefault(id: string): Promise<Resume> {
    const res = await instance.patch<Resume>(`/file/mark-default/${id}`)
    return res.data
  }
}

export const fileService = new FileService()