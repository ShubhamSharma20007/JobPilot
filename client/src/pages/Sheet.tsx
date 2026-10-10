import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  makeRows,
  newRow,
  SpreadsheetGrid,
} from '@/components/sheet/SpreadsheetGrid';
import type { SheetRow } from '@/types/sheet.type';
import { useAuth } from '@/redux/hooks/useAuth';
import { ConnectGmail } from '@/components/gmail/ConnectGmail';
import {
  sheetService,
  type SheetResponse,
  type SheetRowOut,
} from '@/services/sheet.service';
import { toast } from 'sonner';
import { OptionMenu } from '@/components/ui/option-menu';
import { Link } from 'react-router-dom';
import Loader from '@/components/Loader';

const SYNC_OPTIONS = [
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '1440', label: '24 hours' },
];

// Shared look for the notice banners: dashed border with a faint indigo wash
const banner =
  'mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-indigo-500/30 bg-linear-to-r from-indigo-500/[0.07] via-transparent to-transparent p-4';

export default function Sheet() {
  const [rows, setRows] = useState<SheetRow[]>(() => makeRows(20));
  const [syncMinutes, setSyncMinutes] = useState('30');
  const { user, resumes } = useAuth();
  const [loaded, setLoaded] = useState(false); // true only after a successful load
  const [loading, setLoading] = useState(true); // first load only: later syncs stay silent
  const [loadFailed, setLoadFailed] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, SheetRowOut>>({});
  const [paused, setPaused] = useState(false);

  const applyServer = (res: SheetResponse) => {
    setStatuses(Object.fromEntries(res.rows.map((r) => [r.id, r])));
    setPaused(!!res.paused);
  };

  async function changeSync(v: string) {
    const prev = syncMinutes;
    setSyncMinutes(v);
    try {
      await sheetService.setSync(+v);
      toast.success(
        `Checking for new emails every ${SYNC_OPTIONS.find((o) => o.value === v)?.label}`
      );
    } catch {
      setSyncMinutes(prev);
      toast.error("Couldn't change the sync interval");
    }
  }

  // 1. Load saved rows (runs once, when the page mounts)
  const load = useCallback(() => {
    setLoading(true);
    setLoadFailed(false);
    sheetService
      .list()
      .then((res) => {
        const saved = res.rows.map((r) => ({
          ...newRow(),
          id: r.id,
          recruiter: r.email,
        }));
        setRows([...saved, ...makeRows(Math.max(5, 20 - saved.length))]);
        setSyncMinutes(
          SYNC_OPTIONS.some((o) => o.value === String(res.syncMinutes))
            ? String(res.syncMinutes)
            : '30'
        );
        applyServer(res);
        setLoaded(true);
      })
      .catch(() => {
        setLoadFailed(true);
        toast.error("Couldn't load your sheet");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 2. Autosave one second after the user stops typing.
  //    `loaded` matters: saving the empty starting grid would delete the user's real rows.
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      const payload = rows
        .filter((r) => r.recruiter.trim())
        .map((r) => ({ id: r.id, email: r.recruiter.trim() }));
      sheetService
        .save(payload)
        .then(applyServer)
        .catch(() => toast.error("Couldn't save your sheet"));
    }, 1000);
    return () => clearTimeout(t);
  }, [rows, loaded]);

  // 3. Refresh delivered/failed columns
  // useEffect(() => {
  //   if (!loaded) return
  //   const t = setInterval(() => sheetService.list().then(applyServer).catch(() => { }), 30_000)
  //   return () => clearInterval(t)
  // }, [loaded])
  const hasActive = Object.values(statuses).some(
    (s) => s.status === 'pending' || s.status === 'sending'
  );

  useEffect(() => {
    if (!loaded) return;

    const refresh = () => {
      if (document.visibilityState === 'visible') {
        sheetService
          .list()
          .then(applyServer)
          .catch(() => {});
      }
    };

    // one catch-up refresh whenever you come back to the tab
    document.addEventListener('visibilitychange', refresh);

    // keep polling only while something is still being sent
    const t = hasActive ? setInterval(refresh, 30_000) : undefined;

    return () => {
      document.removeEventListener('visibilitychange', refresh);
      if (t) clearInterval(t);
    };
  }, [loaded, hasActive]);

  // 4. What the grid shows
  const view = rows.map((r) => {
    const s = statuses[r.id];
    return {
      ...r,
      delivered:
        s?.status === 'sent' ? new Date(s.sentAt!).toLocaleString() : '',
      failed: s?.status === 'failed' ? (s.lastError ?? 'Failed') : '',
    };
  });

  // Loader on the first load only. Autosave and the 30s refresh never set `loading`.
  if (loading) return <Loader />;

  // If loading failed, show a retry instead of the empty grid, so autosave can't
  // overwrite the user's real rows with a blank sheet.
  if (loadFailed) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-sm place-items-center px-4 text-center">
        <div className="space-y-3">
          <p className="font-medium">We couldn't load your sheet.</p>
          <Button variant="outline" onClick={load}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate overflow-hidden">
      {/* Soft glow behind the heading, same colours as the landing hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72"
      >
        <div className="absolute top-[-9rem] left-1/2 h-[18rem] w-[40rem] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl dark:bg-indigo-500/20" />
      </div>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold">
              Your{' '}
              <span className="bg-linear-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                sheet
              </span>
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Add recruiter emails in the first column. Paste a whole list at
              once, one email per line. Sent and failed emails will appear in
              the other two columns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sync every</span>
            <OptionMenu
              ariaLabel="Choose how often to check for new emails"
              value={syncMinutes}
              options={SYNC_OPTIONS}
              onChange={changeSync}
              icon={<RefreshCw className="size-3.5 text-indigo-500" />}
              contentClassName="w-44"
            />
          </div>
        </div>

        {paused && (
          <div className={banner}>
            <p className="text-sm">
              Sending is paused, so nothing will go out. Check your template,
              then turn off "Pause sending" in Settings.
            </p>
            <Link
              to="/settings"
              className={buttonVariants({ variant: 'outline' })}
            >
              Open Settings
            </Link>
          </div>
        )}
        {user?.gmail_connected && resumes.length === 0 && (
          <div className={banner}>
            <p className="text-sm">
              Upload a resume so JobPilot has something to attach. Nothing is
              sent until you do.
            </p>
            <Link
              to="/profile#upload-resumes"
              className={buttonVariants({ variant: 'outline' })}
            >
              Upload resume
            </Link>
          </div>
        )}
        {!user?.gmail_connected && (
          <div className={banner}>
            <p className="text-sm">
              Connect your Gmail so JobPilot can send these applications.
              Nothing is sent until you do.
            </p>
            <ConnectGmail />
          </div>
        )}
        {view.every((r) => !r.recruiter.trim()) && (
          <div className={banner}>
            <p className="text-sm">
              Finding emails while you browse? The Chrome extension adds them to
              this sheet in one click.
            </p>
            <Link
              to={{ pathname: '/', hash: '#extension' }}
              className={buttonVariants({ variant: 'outline' })}
            >
              Get the extension
            </Link>
          </div>
        )}
        <div className="mt-6">
          <SpreadsheetGrid rows={view} onChange={setRows} />
        </div>
      </section>
    </div>
  );
}
