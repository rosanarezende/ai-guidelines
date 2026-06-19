import { AudiencePathCards } from "@pages/home/sections/AudiencePathCards/AudiencePathCards";
import { ProblemSection } from "@pages/home/sections/ProblemSection/ProblemSection";
import { ProductCTA } from "@pages/home/sections/ProductCTA/ProductCTA";
import { ProductHero } from "@pages/home/sections/ProductHero/ProductHero";
import { SafetyRail } from "@pages/home/sections/SafetyRail/SafetyRail";
import { SolutionSection } from "@pages/home/sections/SolutionSection/SolutionSection";
import { TeamTeaser } from "@pages/home/sections/TeamTeaser/TeamTeaser";

export function HomePage(): JSX.Element {
  return (
    <>
      <ProductHero />
      <ProblemSection />
      <SolutionSection />
      <AudiencePathCards />
      <TeamTeaser />
      <SafetyRail />
      <ProductCTA />
    </>
  );
}
