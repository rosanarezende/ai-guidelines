import { AudiencePathCards } from "../AudiencePathCards/AudiencePathCards";
import { ProblemSection } from "../ProblemSection/ProblemSection";
import { ProductCTA } from "../ProductCTA/ProductCTA";
import { ProductHero } from "../ProductHero/ProductHero";
import { SafetyRail } from "../SafetyRail/SafetyRail";
import { SolutionSection } from "../SolutionSection/SolutionSection";
import { TeamTeaser } from "../TeamTeaser/TeamTeaser";

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
