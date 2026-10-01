import { useEffect, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type Props = { src: string; label: string; initials: string; className?: string }

export function UserAvatar({ src, label, initials, className }: Props) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])

  return (
    <Avatar className={className}>
      {failed ? (
        <AvatarFallback>{initials}</AvatarFallback>
      ) : (
        <img
          src={src}
          alt={label}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="aspect-square size-full rounded-full object-cover"
        />
      )}
    </Avatar>
  )
}