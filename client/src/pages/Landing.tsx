import { Hero, Stats, HowItWorks, Pipeline, Features, Faq, FinalCta } from "@/components/landing/Sections"
import { ComingSoon } from "@/components/landing/ComingSoon"
import { ExtensionSection } from "@/components/landing/ExtensionSection"

export default function Landing() {
  return (
    <>
      <Hero />
      <Stats />
      <HowItWorks />
      <Pipeline />
      <Features />
      <ExtensionSection />
      <ComingSoon />
      <Faq />
      <FinalCta />
    </>
  )
}