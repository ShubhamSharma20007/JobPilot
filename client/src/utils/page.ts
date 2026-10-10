// One import function per page, shared by lazy() and the prefetcher,
// so a prefetch fills the same module cache that lazy() reads from.
export const pages = {
  profile: () => import("@/pages/Profile"),
  settings: () => import("@/pages/Settings"),
  sheet: () => import("@/pages/Sheet"),
  jobs: () => import("@/pages/Jobs"),
  legal: () => import("@/pages/Legal"),
}

export function prefetchPages() {
  const run = () => {
    pages.sheet().catch(() => {})
    pages.jobs().catch(() => {})
    pages.settings().catch(() => {})
    pages.profile().catch(() => {})
  }
  if ("requestIdleCallback" in window) window.requestIdleCallback(run)
  else setTimeout(run, 1500)
}