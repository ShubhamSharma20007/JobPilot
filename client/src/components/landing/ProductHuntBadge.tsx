import { useTheme } from "@/context/theme-context"
import { PRODUCT_HUNT } from "./Content"

export function ProductHuntBadge() {
  const { theme } = useTheme()
  const { url, postId } = PRODUCT_HUNT

  return (<>
    <a href={url} target="_blank"><img src={`https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=${postId}&theme=${theme}`} alt="CRM&#0032;App&#0032;for&#0032;Real&#0032;Estate&#0032;companies - realestate | Product Hunt" style={{ width: "250px", height: "54px" }} width="250" height="54" /></a>
  </>


  )
}
