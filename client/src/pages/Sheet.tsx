import { useState } from "react"
import { ChevronDown, RefreshCw } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { makeRows, SpreadsheetGrid } from "@/components/sheet/SpreadsheetGrid"
import type { SheetRow } from "@/types/sheet.type"
import { useAuth } from "@/redux/hooks/useAuth"
import { ConnectGmail } from "@/components/gmail/ConnectGmail"
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
          <DropdownMenu>
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
          </DropdownMenu>
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
        <SpreadsheetGrid rows={rows} onChange={setRows} />
      </div>
    </section>
  )
}