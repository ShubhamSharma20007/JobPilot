import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Briefcase, Loader2, Lock, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { inputClass } from '@/components/settings/primitives';
import { jobsService, type ProfileInfo } from '@/services/jobs.service';

const apiError = (e: unknown, fallback: string) => {
  const d = isAxiosError(e) ? e.response?.data?.detail : null;
  return typeof d === 'string' ? d : fallback;
};

export function PositionField({ resumeKey }: { resumeKey?: string }) {
  const [data, setData] = useState<ProfileInfo | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await jobsService.getProfile());
    } catch {
      /* silent */
    }
  }, []);

  // re-read whenever the default resume changes (upload, make default, delete)
  useEffect(() => {
    load();
  }, [load, resumeKey]);

  // poll while the server is reading the resume
  useEffect(() => {
    if (data?.status !== 'parsing') return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [data?.status, load]);

  async function retry() {
    try {
      setData(await jobsService.reparse());
    } catch (e) {
      toast.error("Couldn't re-read resume", { description: apiError(e, 'Please try again.') });
    }
  }

  if (!data) return null;

  const parsing = data.status === 'parsing';
  const weak = data.hasResume && !parsing && !(data.source === 'resume' && data.exact);

  return (
    <div id="position" className="scroll-mt-24 space-y-1.5 sm:col-span-2">
      <label htmlFor="target-position" className="flex items-center gap-1.5 text-sm font-medium">
        <Briefcase className="size-3.5 text-indigo-500" />
        Target position
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          {parsing ? (
            <div className="flex h-10 items-center gap-2 rounded-lg border bg-muted/60 px-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Reading your resume…
            </div>
          ) : (
            <>
              <input
                id="target-position"
                value={data.position ?? (data.hasResume ? 'Not detected' : 'Upload a resume to detect it')}
                readOnly
                disabled
                className={`${inputClass} cursor-not-allowed bg-muted/60 pr-9 text-foreground disabled:opacity-100`}
              />
              <Lock className="absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            </>
          )}
        </div>
        {weak && (
          <Button variant="outline" onClick={retry}>
            <RotateCcw /> Re-read resume
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {parsing
          ? 'This takes a few seconds.'
          : !data.hasResume
            ? "We'll detect your position and find matching jobs."
            : weak
              ? "We couldn't find an exact job title. Try re-reading, or upload a resume that shows your role near the top."
              : 'Detected from your default resume. Upload or switch your default resume to change it.'}
      </p>
    </div>
  );
}