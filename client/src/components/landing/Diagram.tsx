import { Fragment } from "react"
import { ArrowDown, ArrowRight } from "lucide-react"

type Node = { title: string; sub: string }

export function FlowRow({ nodes, highlight, dashed }: { nodes: Node[]; highlight?: number; dashed?: boolean }) {
  return (
    <ol className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
      {nodes.map((n, i) => (
        <Fragment key={n.title}>
          <li
            className={[
              "flex-1 rounded-2xl border p-4",
              dashed ? "border-dashed bg-transparent" : "bg-card",
              i === highlight ? "border-transparent bg-primary text-primary-foreground" : "",
            ].join(" ")}
          >
            <p className="font-heading font-semibold">{n.title}</p>
            <p className={`mt-1 text-sm ${i === highlight ? "opacity-80" : "text-muted-foreground"}`}>{n.sub}</p>
          </li>
          {i < nodes.length - 1 && (
            <span aria-hidden className="grid place-items-center text-muted-foreground">
              <ArrowRight className="hidden size-4 lg:block" />
              <ArrowDown className="size-4 lg:hidden" />
            </span>
          )}
        </Fragment>
      ))}
    </ol>
  )
}