import { ThemeToggle } from "./ThemeToggle"
import { GoogleSignIn } from "./GoogleSignIn"
import { UserMenu } from "./UserMenu"
import { APP } from "./Content"
import { useAppSelector } from "@/redux/hook"
import { Link } from "react-router-dom"

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#pipeline", label: "Flow" },
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
]

export function Navbar() {
  const { user, initialized } = useAppSelector((s) => s.auth)

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="font-heading text-xl font-bold tracking-tight">{APP.name}</Link>

        <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
         {LINKS.map((l) => (
  <Link key={l.href} to={{ pathname: "/", hash: l.href }} className="hover:text-foreground">
    {l.label}
  </Link>
))}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!initialized ? (
            <div className="h-10 w-28" />
          ) : user ? (
            <UserMenu />
          ) : (
            <GoogleSignIn />
          )}
        </div>
      </nav>
    </header>
  )
}