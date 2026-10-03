import { ThemeToggle } from "./ThemeToggle"
import { GoogleSignIn } from "./GoogleSignIn"
import { UserMenu } from "./UserMenu"
import { APP } from "./Content"
import { Link } from "react-router-dom"
import { useAuth } from "@/redux/hooks/useAuth"

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#pipeline", label: "Flow" },
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
]

export function Navbar() {
  const { user, initialized } = useAuth()



  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold tracking-tight">
          <svg viewBox="0 0 64 64" className="size-8" aria-hidden>
            <rect width="64" height="64" rx="16" className="fill-primary" />
            <path d="M11 50 C15 44 19 42 24 40" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 5" opacity="0.7" className="stroke-primary-foreground" />
            <path d="M49 15 L14 29 L27 36 L34 50 Z" strokeLinejoin="round" className="fill-primary-foreground" />
            <path d="M27 36 L49 15" fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-primary" />
          </svg>
          {APP.name}
        </Link>

        <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} to={{ pathname: "/", hash: l.href }} className="hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
  {!initialized ? (
    <>
      <ThemeToggle />
      <div className="h-10 w-[180px]" />
    </>
  ) : user ? (
    <UserMenu />
  ) : (
    <>
      <ThemeToggle />
      <GoogleSignIn />
    </>
  )}
</div>
      </nav>
    </header>
  )
}