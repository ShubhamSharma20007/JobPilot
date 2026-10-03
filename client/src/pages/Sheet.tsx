import { useEffect, useState } from "react"
import { ChevronDown, RefreshCw } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { makeRows, newRow, SpreadsheetGrid } from "@/components/sheet/SpreadsheetGrid"
import type { SheetRow } from "@/types/sheet.type"
import { useAuth } from "@/redux/hooks/useAuth"
import { ConnectGmail } from "@/components/gmail/ConnectGmail"
import { sheetService, type SheetResponse, type SheetRowOut } from "@/services/sheet.service"
import { toast } from "sonner"
import { OptionMenu } from "@/components/ui/option-menu"
const SYNC_OPTIONS = [
  { value: "10", label: "10 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
  { value: "1440", label: "24 hours" },
]

export default function Sheet() {
  const [rows, setRows] = useState<SheetRow[]>(() => makeRows(20))
  const [syncMinutes, setSyncMinutes] = useState("30")
  const { user } = useAuth()
  const current = SYNC_OPTIONS.find((o) => o.value === syncMinutes)
  const [loaded, setLoaded] = useState(false)
  const [statuses, setStatuses] = useState<Record<string, SheetRowOut>>({})

  const applyServer = (res: SheetResponse) =>
    setStatuses(Object.fromEntries(res.rows.map((r) => [r.id, r])))



  async function changeSync(v: string) {
    const prev = syncMinutes
    setSyncMinutes(v)
    try {
      await sheetService.setSync(+v)
      toast.success(`Checking for new emails every ${SYNC_OPTIONS.find((o) => o.value === v)?.label}`)
    } catch {
      setSyncMinutes(prev)
      toast.error("Couldn't change the sync interval")
    }
  }



  // 1. Load saved rows
  useEffect(() => {
    sheetService.list().then((res) => {
      const saved = res.rows.map((r) => ({ ...newRow(), id: r.id, recruiter: r.email }))
      setRows([...saved, ...makeRows(Math.max(5, 20 - saved.length))])
      setSyncMinutes(String(res.syncMinutes))
      applyServer(res)
      setLoaded(true)
    }).catch(() => toast.error("Couldn't load your sheet"))
  }, [])

  // 2. Autosave one second after the user stops typing.
  //    `loaded` matters: saving the empty starting grid would delete the user's real rows.
  useEffect(() => {
    if (!loaded) return
    const t = setTimeout(() => {
      const payload = rows.filter((r) => r.recruiter.trim()).map((r) => ({ id: r.id, email: r.recruiter.trim() }))
      sheetService.save(payload).then(applyServer).catch(() => toast.error("Couldn't save your sheet"))
    }, 1000)
    return () => clearTimeout(t)
  }, [rows, loaded])


  // 3. Refresh delivered/failed columns
  useEffect(() => {
    if (!loaded) return
    const t = setInterval(() => sheetService.list().then(applyServer).catch(() => { }), 30_000)
    return () => clearInterval(t)
  }, [loaded])


  // 4. What the grid shows
  const view = rows.map((r) => {
    const s = statuses[r.id]
    return {
      ...r, delivered: s?.status === "sent" ? new Date(s.sentAt!).toLocaleString() : "",
      failed: s?.status === "failed" ? (s.lastError ?? "Failed") : ""
    }
  })

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Your sheet</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Add recruiter emails in the first column. Paste a whole list at once, one email per line.
            Sent and failed emails will appear in the other two columns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sync every</span>
          {/* <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Choose how often to check for new emails"
              className={buttonVariants({ variant: "outline" })}
            >
              <RefreshCw className="size-3.5" />
              {current?.label}
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={6} className="w-44">
              <DropdownMenuRadioGroup value={syncMinutes} onValueChange={(v) => setSyncMinutes(String(v))}>
                {SYNC_OPTIONS.map((o) => (
                  <DropdownMenuRadioItem key={o.value} value={o.value}>
                    {o.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu> */}
          <OptionMenu
            ariaLabel="Choose how often to check for new emails"
            value={syncMinutes}
            options={SYNC_OPTIONS}
            onChange={changeSync}
            icon={<RefreshCw className="size-3.5" />}
            contentClassName="w-44"
          />
        </div>
      </div>
      {!user?.gmail_connected && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed p-4">
          <p className="text-sm">
            Connect your Gmail so JobPilot can send these applications. Nothing is sent until you do.
          </p>
          <ConnectGmail />
        </div>
      )}
      <div className="mt-6">
        <SpreadsheetGrid rows={view} onChange={setRows} />
      </div>
    </section>
  )
}