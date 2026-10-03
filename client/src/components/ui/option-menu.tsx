import type { ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type Option = { value: string; label: string }

export function OptionMenu({ value, options, onChange, icon, ariaLabel, className, contentClassName }: {
  value: string
  options: Option[]
  onChange: (v: string) => void
  icon?: ReactNode
  ariaLabel: string
  className?: string
  contentClassName?: string
}) {
  const current = options.find((o) => o.value === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={ariaLabel} className={cn(buttonVariants({ variant: "outline" }), className)}>
        {icon}
        <span className="flex-1 text-left">{current?.label}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className={contentClassName}>
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(String(v))}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>{o.label}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}