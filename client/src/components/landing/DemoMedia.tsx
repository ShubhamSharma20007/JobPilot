import { useState } from "react"
import { useTheme } from "@/context/theme-context"

export function DemoMedia({ alt = "Product demo" }: { alt?: string }) {
  const { theme } = useTheme()
  const [failed, setFailed] = useState(false)
  const src = theme === "dark" ? "/demo-dark.gif" : "/demo-light.gif"

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-primary/10">
      <div className="flex items-center gap-1.5 border-b bg-muted px-4 py-3">
        <span className="size-2.5 rounded-full bg-destructive/70" />
        <span className="size-2.5 rounded-full bg-muted-foreground/40" />
        <span className="size-2.5 rounded-full bg-muted-foreground/40" />
      </div>
      {failed ? (
        <div className="grid aspect-video place-items-center p-8" role="img" aria-label={alt}>
          <div className="w-full max-w-sm space-y-3">
            {[0.9, 0.7, 0.8].map((w, i) => (
              <div
                key={i}
                className="h-3 animate-pulse rounded-full bg-muted-foreground/25 motion-reduce:animate-none"
                style={{ width: `${w * 100}%`, animationDelay: `${i * 200}ms` }}
              />
            ))}
            <div className= "h-9 w-32 animate-pulse rounded-lg bg-primary/80 motion-reduce:animate-none" />
          </div>
        </div>
      ) : (
        <img
          key={src} // restarts the animation from the beginning when the theme changes
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className="aspect-video w-full object-cover"
        />
      )}
    </div>
  )
}