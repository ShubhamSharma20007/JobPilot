import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Briefcase, Loader2, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { gradientBtn, inputClass } from '@/components/settings/primitives';
import { jobsService, type ProfileInfo } from '@/services/jobs.service';

const apiError = (e: unknown, fallback: string) => {
  const d = isAxiosError(e) ? e.response?.data?.detail : null;
  return typeof d === 'string' ? d : fallback;
};

function describe(d: ProfileInfo): string {
  if (d.source === 'manual') return 'You set this yourself. Jobs are matched to it.';
  if (d.source === 'resume' && d.exact) return 'Detected from your default resume. Edit it to override.';
  if (d.source === 'resume')
    return `We only found your field${d.field ? ` (${d.field})` : ''}, not an exact job title. Type your role for better matches.`;
  if (d.status === 'failed') return "We couldn't read your resume. Type your position instead.";
  return 'Tell us the role you want. Jobs are matched to it.';
}

const baseline = (d: ProfileInfo) => d.manualPosition ?? d.position ?? '';

/** Sits inside the profile card's grid. No card of its own. */
export function PositionField({ resumeKey }: { resumeKey?: string }) {
  const [data, setData] = useState<ProfileInfo | null>(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await jobsService.getProfile();
      setData(d);
      setValue((v) => v || baseline(d));
    } catch {
      /* silent */
    }
  }, []);

  // reload whenever the default resume changes
  useEffect(() => {
    setValue('');
    load();
  }, [load, resumeKey]);

  // poll while the server is reading the resume
  useEffect(() => {
    if (data?.status !== 'parsing') return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [data?.status, load]);

  async function save(next: string | null) {
    setSaving(true);
    try {
      const d = await jobsService.setPosition(next);
      setData(d);
      setValue(baseline(d));
      toast.success(next ? 'Position saved' : 'Using the position from your resume');
    } catch (e) {
      toast.error("Couldn't save position", { description: apiError(e, 'Please try again.') });
    } finally {
      setSaving(false);
    }
  }

  if (!data) return null;
  const parsing = data.status === 'parsing';
  const unchanged = value.trim() === baseline(data);

  return (
    <div id="position" className="scroll-mt-24 space-y-1.5 sm:col-span-2">
      <label htmlFor="target-position" className="flex items-center gap-1.5 text-sm font-medium">
        <Briefcase className="size-3.5 text-indigo-500" />
        Target position
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <input
          id="target-position"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && value.trim() && !unchanged && save(value)}
          maxLength={120}
          placeholder="e.g. Sales Executive, Staff Nurse, Full Stack Developer"
          className={`${inputClass} min-w-48 flex-1`}
        />
        <Button className={gradientBtn} disabled={saving || !value.trim() || unchanged} onClick={() => save(value)}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />} Save
        </Button>
        {data.manualPosition && data.status === 'ready' && (
          <Button variant="outline" disabled={saving} onClick={() => save(null)}>
            <RotateCcw /> Use resume's
          </Button>
        )}
        {data.status === 'failed' && data.hasResume && (
          <Button variant="outline" onClick={async () => setData(await jobsService.reparse())}>
            <RotateCcw /> Retry reading resume
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {parsing ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="size-3 animate-spin" /> Reading your resume…
          </span>
        ) : (
          describe(data)
        )}
      </p>
    </div>
  );
}