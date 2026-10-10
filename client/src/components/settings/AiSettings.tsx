import { useEffect, useState } from "react"
import { isAxiosError } from "axios"
import { CheckCircle2, FileSearch, KeyRound, Loader2, Save, Sparkles, Trash2, Zap } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { gradientBtn, inputClass, SettingRow, SettingsCard } from "./primitives"
import { jobsService, type AiSettings as AiSettingsData, type ModelList } from "@/services/jobs.service"

const apiError = (e: unknown, fallback: string) => {
  const d = isAxiosError(e) ? e.response?.data?.detail : null
  return typeof d === "string" ? d : fallback
}

const KEY_HELP: Record<string, string> = {
  gemini: "Free key at aistudio.google.com/apikey. No card needed.",
  openai: "From platform.openai.com/api-keys. Billed to your OpenAI account.",
  anthropic: "From console.anthropic.com. Billed to your Anthropic account.",
}

/** Saves on its own (not through the Settings draft) so the key never sits in page state or the settings payload. */
export function AiSettings() {
  const [data, setData] = useState<AiSettingsData | null>(null)
  const [provider, setProvider] = useState("gemini")
  const [model, setModel] = useState("")
  const [dailyLimit, setDailyLimit] = useState(10)
  const [apiKey, setApiKey] = useState("")
  const [models, setModels] = useState<ModelList>({ models: [], live: false })
  const [custom, setCustom] = useState(false) // typing a model id by hand
  const [busy, setBusy] = useState<"save" | "test" | "profile" | "remove" | null>(null)

  const apply = (d: AiSettingsData) => {
    setData(d)
    setProvider(d.provider)
    setModel(d.model)
    setDailyLimit(d.dailyLimit)
    setApiKey("")
  }

  useEffect(() => {
    jobsService.getAi().then(apply).catch(() => toast.error("Couldn't load AI settings"))
  }, [])

  useEffect(() => {
    let off = false
    jobsService.models(provider).then((m) => { if (!off) setModels(m) }).catch(() => { if (!off) setModels({ models: [], live: false }) })
    return () => { off = true }
  }, [provider, data?.keySaved, data?.provider])

  if (!data) return null

  // keep the saved model selectable even if the list doesn't contain it
  const options = model && !models.models.includes(model) ? [model, ...models.models] : models.models

  const changed =
    apiKey.trim() !== "" || provider !== data.provider || model !== data.model || dailyLimit !== data.dailyLimit
  const canSave = changed && model.trim() !== "" && (data.keySaved || apiKey.trim() !== "")

  async function run<T>(kind: NonNullable<typeof busy>, fn: () => Promise<T>, ok: string, fail: string) {
    setBusy(kind)
    try {
      const out = await fn()
      toast.success(ok)
      return out
    } catch (e) {
      toast.error(fail, { description: apiError(e, "Please try again.") })
    } finally {
      setBusy(null)
    }
  }

  const save = async () => {
    const d = await run(
      "save",
      () => jobsService.saveAi({ provider, model: model.trim(), dailyLimit, apiKey: apiKey.trim() || undefined }),
      "AI settings saved",
      "Couldn't save AI settings"
    )
    if (d) apply(d)
  }

  return (
    <SettingsCard
      icon={Sparkles}
      title="AI applications"
      description="Use your own AI key to write a personalised email for each job you apply to from the Jobs page."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Your key is encrypted on our server and never shown again.</p>
          <div className="flex gap-2">
            {data.keySaved && (
              <Button
                variant="outline"
                disabled={busy !== null || changed}
                onClick={() => run("test", jobsService.testKey, "Key works", "Key test failed")}
              >
                {busy === "test" ? <Loader2 className="animate-spin" /> : <Zap />} Test key
              </Button>
            )}
            <Button className={gradientBtn} disabled={!canSave || busy !== null} onClick={save}>
              {busy === "save" ? <Loader2 className="animate-spin" /> : <Save />} Save
            </Button>
          </div>
        </div>
      }
    >
      <SettingRow label="Provider" help={KEY_HELP[provider]} htmlFor="ai-provider">
        <select
          id="ai-provider"
          value={provider}
          onChange={(e) => {
            setProvider(e.target.value)
            setCustom(false)
            setModel(data.providers.find((p) => p.value === e.target.value)?.defaultModel ?? "")
          }}
          className={inputClass}
        >
          {data.providers.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </SettingRow>

      <SettingRow label="API key" help={data.keySaved ? `Saved (ends in ${data.keyHint}). Paste a new one to replace it.` : "Paste your key to turn on AI applications."} htmlFor="ai-key">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="ai-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={data.keySaved ? "••••••••••••" : "Paste API key"}
              className={`${inputClass} pl-9`}
            />
          </div>
          {data.keySaved && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove saved key"
              disabled={busy !== null}
              onClick={async () => {
                const d = await run("remove", jobsService.removeKey, "Key removed", "Couldn't remove the key")
                if (d) apply(d)
              }}
            >
              <Trash2 className="text-destructive" />
            </Button>
          )}
        </div>
      </SettingRow>

      <SettingRow
        label="Model"
        help={models.live ? "Models your key can use, loaded from the provider." : "Common models. Save your key to load the full list from the provider."}
        htmlFor="ai-model"
      >
        {custom ? (
          <div className="flex items-center gap-2">
            <input id="ai-model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model id" className={inputClass} />
            <Button variant="ghost" size="sm" onClick={() => setCustom(false)}>List</Button>
          </div>
        ) : (
          <select
            id="ai-model"
            value={model}
            onChange={(e) => (e.target.value === "__custom__" ? setCustom(true) : setModel(e.target.value))}
            className={inputClass}
          >
            {options.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            <option value="__custom__">Other (type a model id)…</option>
          </select>
        )}
      </SettingRow>

      <SettingRow label="AI applications per day" help="Separate from your daily sending limit; the lower of the two wins.">
        <div className="flex items-center gap-3">
          <input
            type="range" min={1} max={50} value={dailyLimit}
            onChange={(e) => setDailyLimit(+e.target.value)}
            className="h-2 flex-1 cursor-pointer accent-primary"
            aria-label="AI applications per day"
          />
          <span className="w-8 text-right text-sm font-medium tabular-nums">{dailyLimit}</span>
        </div>
      </SettingRow>

      <SettingRow
        label="Resume profile"
        help="Read from your default resume, so you never fill in extra details. Used to rank jobs and write emails."
      >
        <div className="space-y-2 sm:text-right">
          {data.profile ? (
            <p className="flex items-start gap-1.5 text-sm sm:justify-end">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <span>{data.profile.headline || "Profile ready"} · {data.profile.skills.length} skills found</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Not analysed yet.</p>
          )}
          <Button
            variant="outline"
            disabled={!data.keySaved || busy !== null}
            onClick={async () => {
              const d = await run("profile", jobsService.analyseResume, "Resume analysed", "Couldn't analyse your resume")
              if (d) apply(d)
            }}
          >
            {busy === "profile" ? <Loader2 className="animate-spin" /> : <FileSearch />}
            {data.profile ? "Re-analyse resume" : "Analyse my resume"}
          </Button>
        </div>
      </SettingRow>
    </SettingsCard>
  )
}