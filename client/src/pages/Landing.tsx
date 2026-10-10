import { Hero, Stats, HowItWorks, Pipeline, Features, Faq, FinalCta } from "@/components/landing/Sections"
import { AiJobs } from "@/components/landing/AiJobs"
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
      <AiJobs />
      <Faq />
      <FinalCta />
    </>
  )
}