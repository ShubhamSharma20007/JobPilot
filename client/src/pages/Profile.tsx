import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/redux/hooks/useAuth"
import { dispatchAuth } from "@/redux/hooks/dispatchAuth"
import { useAppDispatch } from "@/redux/hook"
import { markDefaultResume } from "@/redux/slices/authSlice"

import { ProfileDetails } from "@/components/profile/ProfileDetails"
import { ResumeDropzone } from "@/components/profile/ResumeDropzone"
import { CurrentResume, ResumeList } from "@/components/profile/ResumeList"
import { MAX_RESUMES } from "@/types/resume.type"
import { useLocation } from "react-router-dom"

function SectionHeading({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  )
}

// A rejected thunk throws the message string from rejectWithValue
const errorText = (e: unknown, fallback: string) => (typeof e === "string" ? e : fallback)

export default function Profile() {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const { addFile, deleteFile } = dispatchAuth()
  const { resumes } = useAuth()
  const [busy, setBusy] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { hash } = useLocation() // get hash value #upload-resumes
  if (!user) return null

  const current = resumes.find((r) => r.isDefault)
  const atLimit = resumes.length >= MAX_RESUMES


  async function handleDelete(id: string) {
    const name = resumes.find((r) => r.id === id)?.name ?? "resume"
    setDeletingId(id)
    const toastId = toast.loading(`Deleting ${name}…`)
    try {
      await deleteFile(id)
      toast.success(`${name} deleted`, { id: toastId })
    } catch (e) {
      toast.error(`Couldn't delete ${name}`, { id: toastId, description: errorText(e, "Please try again.") })
    } finally {
      setDeletingId(null)
    }
  }

  async function addFiles(files: File[]) {
    const remaining = MAX_RESUMES - resumes.length
    if (remaining <= 0) {
      toast.error(`You can keep up to ${MAX_RESUMES} resumes`, { description: "Delete one to upload another." })
      return
    }

    const accepted = files.slice(0, remaining)
    if (accepted.length < files.length) {
      toast.warning(`Uploading ${accepted.length} of ${files.length} files`, {
        description: `You can keep up to ${MAX_RESUMES} resumes.`,
      })
    }

    setBusy(true)
    for (const file of accepted) {
      // one at a time, since the route takes one file per request
      const id = toast.loading(`Uploading ${file.name}…`)
      try {
        await addFile(file)
        toast.success(`${file.name} uploaded`, { id })
      } catch (e) {
        toast.error(`Couldn't upload ${file.name}`, { id, description: errorText(e, "Please try again.") })
      }
    }
    setBusy(false)
  }

  async function makeDefault(id: string) {
    try {
      await dispatch(markDefaultResume(id)).unwrap()
      toast.success("Default resume updated")
    } catch (e) {
      toast.error("Couldn't change your default resume", { description: errorText(e, "Please try again.") })
    }
  }

  useEffect(() => {
    if (!hash || !user) return
    const el = document.getElementById(hash.slice(1))
    el?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [hash, user])

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

      <div id="upload-resumes" className="scroll-mt-24">
        <SectionHeading
          title="Upload resumes"
          body={`Add up to ${MAX_RESUMES}, for example one for full stack roles and one for AI roles.`}
        />
        <ResumeDropzone
          onFiles={addFiles}
          disabled={busy || atLimit}
          message={atLimit ? `You've reached the limit of ${MAX_RESUMES} resumes. Delete one to upload another.` : undefined}
        />
      </div>

      {resumes.length > 0 && (
        <div>
          <SectionHeading
            title={`Your resumes (${resumes.length}/${MAX_RESUMES})`}
            body="Choose which one is the default."
          />
          <ResumeList
            resumes={resumes}
            onSetDefault={makeDefault}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        </div>
      )}
    </section>
  )
}