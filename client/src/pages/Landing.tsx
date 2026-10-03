import { Hero, Stats, HowItWorks, Pipeline, Features, Faq, FinalCta } from "@/components/landing/Sections"
import { ComingSoon } from "@/components/landing/ComingSoon"

export default function Landing() {
  return (
    <>
      <Hero />
      <Stats />
      <HowItWorks />
      <Pipeline />
      <Features />
      <ComingSoon />
      <Faq />
      <FinalCta />
    </>
  )
}