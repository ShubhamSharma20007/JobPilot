import { useState } from "react"
import { useAuth } from "@/redux/hooks/useAuth"
import { ProfileDetails } from "@/components/profile/ProfileDetails"
import { ResumeDropzone } from "@/components/profile/ResumeDropzone"
import { CurrentResume, ResumeList } from "@/components/profile/ResumeList"
import type { Resume } from "@/types/resume.type"

function SectionHeading({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  )
}

export default function Profile() {
  const { user } = useAuth()
  const [resumes, setResumes] = useState<Resume[]>([])

  if (!user) return null

  const current = resumes.find((r) => r.isDefault)

  // UI only: swap this for your upload API call later
  function addFiles(files: File[]) {
    setResumes((prev) => {
      const added: Resume[] = files.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        uploadedAt: new Date().toISOString(),
        isDefault: false,
        url: URL.createObjectURL(f),
      }))
      const next = [...prev, ...added]
      // the first resume ever uploaded becomes the default
      if (!next.some((r) => r.isDefault)) next[0] = { ...next[0], isDefault: true }
      return next
    })
  }

  function setDefault(id: string) {
    setResumes((prev) => prev.map((r) => ({ ...r, isDefault: r.id === id })))
  }

  function remove(id: string) {
    setResumes((prev) => {
      const target = prev.find((r) => r.id === id)
      if (target) URL.revokeObjectURL(target.url)
      const next = prev.filter((r) => r.id !== id)
      if (next.length && !next.some((r) => r.isDefault)) next[0] = { ...next[0], isDefault: true }
      return next
    })
  }

  return (
    <section className="mx-auto max-w-3xl space-y-12 px-4 py-12">
      <div>
        <h1 className="font-heading text-3xl font-bold">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your account details and the resumes JobPilot attaches.</p>
      </div>

      <ProfileDetails user={user} />

      <div>
        <SectionHeading title="Current resume" body="This resume is attached to your applications by default." />
        <CurrentResume resume={current} />
      </div>

      <div>
        <SectionHeading
          title="Upload resumes"
          body="Add more than one, for example one for full stack roles and one for AI roles."
        />
        <ResumeDropzone onFiles={addFiles} />
      </div>

      {resumes.length > 0 && (
        <div>
          <SectionHeading title={`Your resumes (${resumes.length})`} body="Choose which one is the default." />
          <ResumeList resumes={resumes} onSetDefault={setDefault} onDelete={remove} />
        </div>
      )}
    </section>
  )
}