import { LogOut, Moon, Settings, Sun, TableIcon, User as UserIcon } from "lucide-react"
import { useTheme } from "@/context/theme-context"
import { Switch } from "@/components/settings/primitives"
import { useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/redux/hooks/useAuth"
import { UserAvatar } from "./UserAvatar"

const DEFAULT_AVATAR = "https://github.com/shadcn.png"
const itemClass = "gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer"
const iconClass = "size-4 text-muted-foreground"

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  const label = user.name ?? user.email
  const initials = label.slice(0, 2).toUpperCase()
  const src = user.picture ?? DEFAULT_AVATAR

  async function handleLogout() {
    await logout()
    navigate("/", { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        openOnHover
        delay={80}
        closeDelay={150}
        aria-label="Open profile menu"
        className="rounded-full outline-none ring-2 ring-transparent transition hover:ring-border focus-visible:ring-ring/50"
      >
        <UserAvatar src={src} label={label} initials={initials} className="size-10" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-xl p-1.5">
        <div className="mb-1 flex items-center gap-3 rounded-lg bg-muted/60 p-3">
          <Avatar className="size-10">
            <AvatarImage src={src} alt={label} referrerPolicy="no-referrer" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name ?? "Signed in"}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <DropdownMenuItem
          className={itemClass}
          closeOnClick={false} // keep the menu open so the switch visibly flips
          onClick={toggleTheme}
        >
          {isDark ? <Moon className={iconClass} /> : <Sun className={iconClass} />}
          Dark mode
          <span className="pointer-events-none ml-auto" aria-hidden>
            <Switch label="Dark mode" checked={isDark} onChange={() => { }} />
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass} onClick={() => navigate("/profile")}>
          <UserIcon className={iconClass} />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass} onClick={() => navigate("/sheet")}>
          <TableIcon className={iconClass} />
          Sheet
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass} onClick={() => navigate("/settings")}>
          <Settings className={iconClass} />
          Settings
        </DropdownMenuItem>


        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          className={`${itemClass} text-destructive focus:bg-destructive/10 focus:text-destructive`}
        >
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}