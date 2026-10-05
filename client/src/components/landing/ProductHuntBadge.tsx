import { useTheme } from "@/context/theme-context"
import { PRODUCT_HUNT } from "./Content"

export function ProductHuntBadge() {
  const { theme } = useTheme()
  const { url, postId } = PRODUCT_HUNT

  return (<>
    {/* <a href="https://www.producthunt.com/products/crm-app-for-real-estate-companies?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-jobpilot-3" target="_blank" rel="noopener noreferrer"><img alt="JobPilot - JobPilot – Automated Job Application Emailer | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1269562&amp;theme=light&amp;t=1791185389885"/></a> */}
  <a href={url} target="_blank" rel="noopener noreferrer" aria-label="JobPilot on Product Hunt">
    {postId ? (
      <img
        src={`https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=${postId}&theme=${theme}`}
        alt="JobPilot on Product Hunt"
        width={250}
        height={54}
      />
    ) : (
      <span className="inline-flex items-center gap-2.5 rounded-full border bg-background/60 py-1.5 pr-4 pl-1.5 text-sm font-medium backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
        <span className="grid size-7 place-items-center rounded-full bg-[#ff6154] text-sm font-bold text-white">P</span>
        Live on Product Hunt
      </span>
    )}
  </a>
  

  </>

    
  )
}
