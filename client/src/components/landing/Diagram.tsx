import { Fragment } from "react"
import { ArrowDown, ArrowRight } from "lucide-react"

type Node = { title: string; sub: string }

export function FlowRow({ nodes, highlight, dashed }: { nodes: Node[]; highlight?: number; dashed?: boolean }) {
  return (
    <ol className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
      {nodes.map((n, i) => {
        const on = i === highlight
        return (
          <Fragment key={n.title}>
            <li
              className={[
                "relative flex-1 rounded-2xl border p-4 transition",
                on
                  ? "border-transparent bg-linear-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25"
                  : dashed
                    ? "border-dashed border-indigo-500/30 bg-transparent"
                    : "bg-card hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-md",
              ].join(" ")}
            >
              <span
                className={[
                  "mb-3 grid size-6 place-items-center rounded-full font-heading text-xs font-bold",
                  on ? "bg-white/20 text-white" : "bg-indigo-500/10 text-indigo-500",
                ].join(" ")}
              >
                {i + 1}
              </span>
              <p className="font-heading font-semibold">{n.title}</p>
              <p className={`mt-1 text-sm ${on ? "text-white/80" : "text-muted-foreground"}`}>{n.sub}</p>
            </li>
            {i < nodes.length - 1 && (
              <span aria-hidden className="grid place-items-center text-indigo-500/60">
                <ArrowRight className="hidden size-4 lg:block" />
                <ArrowDown className="size-4 lg:hidden" />
              </span>
            )}
          </Fragment>
        )
      })}
    </ol>
  )
}