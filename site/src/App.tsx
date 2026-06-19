import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  audiencePaths,
  contributorBlock,
  dailyJourney,
  type FlowScenario,
  FlowStep,
  glossary,
  Journey,
  peerReviewJourney,
  productProblems,
  productSolutions,
  publicHumanDecisions,
  referenceGroups,
  routeFromPath,
  routePath,
  routes,
  routeTitle,
  safetyRails,
  scenarioById,
  startJourneys,
  teamJourney,
  TerminalLine,
  type RouteId,
} from "./flowData";

const flowImageWebp = new URL("./assets/generated/ai-guidelines-flow.webp", import.meta.url).href;
const layersImageWebp = new URL(
  "./assets/generated/ai-guidelines-governance-layers.webp",
  import.meta.url
).href;

// ── Primitivos ────────────────────────────────────────────────────────────

function OptimizedImage({
  alt,
  webp,
}: {
  readonly alt: string;
  readonly webp: string;
}): JSX.Element {
  return <img src={webp} alt={alt} loading="lazy" decoding="async" />;
}

function useRoute(): [RouteId, (route: RouteId) => void] {
  const initialRoute = useMemo(() => routeFromPath(window.location.pathname), []);
  const [route, setRoute] = useState<RouteId>(initialRoute);

  function navigate(nextRoute: RouteId): void {
    window.history.pushState({}, "", routePath(nextRoute));
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    const handlePopState = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return [route, navigate];
}

function SiteLink({
  children,
  className,
  route,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly route: RouteId;
}): JSX.Element {
  return (
    <a
      className={className}
      href={routePath(route)}
      onClick={(event) => {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("site:navigate", { detail: route }));
      }}
    >
      {children}
    </a>
  );
}

function SiteHeader({ current }: { readonly current: RouteId }): JSX.Element {
  return (
    <header className="siteHeader">
      <SiteLink className="brand" route="home">
        ai-guidelines
      </SiteLink>
      <nav aria-label="Navegação principal">
        {routes
          .filter((route) => route.id !== "home")
          .map((route) => (
            <SiteLink
              className={route.id === current ? "navLink isCurrent" : "navLink"}
              key={route.id}
              route={route.id}
            >
              {route.shortLabel}
            </SiteLink>
          ))}
      </nav>
    </header>
  );
}

function SectionHead({
  eyebrow,
  title,
  lead,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly lead?: string;
}): JSX.Element {
  return (
    <div className="sectionHead">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {lead ? <p className="lead">{lead}</p> : null}
    </div>
  );
}

// ── Terminais (camada de fidelidade preservada) ───────────────────────────

export type TerminalKind = "real" | "guided" | "illustrative";

const TERMINAL_BADGE: Record<TerminalKind, string> = {
  real: "Exemplo gerado",
  guided: "Exemplo guiado",
  illustrative: "Exemplo ilustrativo",
};

function scenarioLineTone(line: string): TerminalLine["tone"] {
  if (/^\$ /.test(line)) return "active";
  if (/^# /.test(line)) return "muted";
  if (/atenção|conflito|warn|skip/i.test(line)) return "warn";
  if (/\[dry-run\]|sync|ok\b/i.test(line)) return "success";
  return "normal";
}

function TerminalFrame({
  title,
  kind,
  children,
  exitCode,
}: {
  readonly title: string;
  readonly kind: TerminalKind;
  readonly children: ReactNode;
  readonly exitCode?: number | null;
}): JSX.Element {
  return (
    <figure
      className={`terminalDemo terminal-${kind}`}
      aria-label={`${TERMINAL_BADGE[kind]}: ${title}`}
    >
      <figcaption>
        <span></span>
        <span></span>
        <span></span>
        <strong>{title}</strong>
        <em className="terminalBadge">{TERMINAL_BADGE[kind]}</em>
      </figcaption>
      <pre>{children}</pre>
      {exitCode !== undefined && exitCode !== null ? (
        <p className="scenarioExit">exit code: {exitCode}</p>
      ) : null}
    </figure>
  );
}

function ScenarioTerminal({ scenario }: { readonly scenario: FlowScenario }): JSX.Element {
  return (
    <TerminalFrame title={scenario.command} kind={scenario.kind} exitCode={scenario.exitCode}>
      {scenario.lines.map((line, index) => (
        <span className={`terminalLine ${scenarioLineTone(line)}`} key={`${line}-${index}`}>
          {line === "" ? " " : line}
        </span>
      ))}
    </TerminalFrame>
  );
}

function ScenarioPanel({ scenarioId }: { readonly scenarioId: string }): JSX.Element | null {
  const scenario = scenarioById(scenarioId);
  if (!scenario) return null;
  return (
    <div className="scenarioPanel">
      <p className="scenarioNote">{scenario.note}</p>
      <ScenarioTerminal scenario={scenario} />
    </div>
  );
}

// Tabs/segmentos para alternar cenários reais — terminal como apoio, não protagonista.
function ScenarioTabs({ scenarioIds }: { readonly scenarioIds: readonly string[] }): JSX.Element {
  const available = scenarioIds
    .map((id) => scenarioById(id))
    .filter((scenario): scenario is FlowScenario => Boolean(scenario));
  const [active, setActive] = useState(0);
  const scenario = available[active] ?? available[0];
  if (!scenario) return <></>;

  return (
    <div className="scenarioTabs">
      <div className="segmented" role="tablist" aria-label="Cenários de terminal">
        {available.map((item, index) => (
          <button
            aria-selected={index === active}
            className={index === active ? "segment isActive" : "segment"}
            key={item.id}
            onClick={() => setActive(index)}
            role="tab"
            type="button"
          >
            {item.title.split("—")[0].trim()}
          </button>
        ))}
      </div>
      <p className="scenarioNote">{scenario.note}</p>
      <ScenarioTerminal scenario={scenario} />
    </div>
  );
}

function StepTerminal({ step }: { readonly step: FlowStep }): JSX.Element {
  return (
    <TerminalFrame title={step.command ?? "npx ai-guidelines"} kind="illustrative">
      {step.lines.map((line, index) => (
        <span className={`terminalLine ${line.tone ?? "normal"}`} key={`${line.text}-${index}`}>
          {line.text}
        </span>
      ))}
    </TerminalFrame>
  );
}

// ── Stepper de jornada ────────────────────────────────────────────────────

function StepNavigator({ steps }: { readonly steps: readonly FlowStep[] }): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = steps[activeIndex] ?? steps[0];

  return (
    <div className="stepNavigator">
      <ol className="stepList" aria-label="Passos do fluxo">
        {steps.map((step, index) => (
          <li key={step.title}>
            <button
              aria-current={index === activeIndex ? "step" : undefined}
              className={index === activeIndex ? "stepButton isActive" : "stepButton"}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <span className="stepNum">{String(index + 1).padStart(2, "0")}</span>
              <span className="stepText">
                <strong>{step.title}</strong>
                <small>{step.text}</small>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <article className="stepDetail">
        <div className="stepCopy">
          <h3>{activeStep.title}</h3>
          <p>{activeStep.text}</p>
          {activeStep.command ? <code>{activeStep.command}</code> : null}
        </div>
        <StepTerminal step={activeStep} />
      </article>
    </div>
  );
}

// ── Callouts de produto ───────────────────────────────────────────────────

function HumanDecisionCallout(): JSX.Element {
  return (
    <aside className="callout calloutHuman" aria-label="O que o humano decide">
      <h3>O que o humano decide</h3>
      <p>
        Estas decisões são reservadas a pessoas — o sistema prepara, mas não executa por conta
        própria.
      </p>
      <ul>
        {publicHumanDecisions.map((decision) => (
          <li key={decision.id}>{decision.title}</li>
        ))}
      </ul>
    </aside>
  );
}

function SafetyRail(): JSX.Element {
  return (
    <section className="safetySection">
      <SectionHead
        eyebrow="Segurança do fluxo"
        title="O que o framework impede para evitar erro humano."
        lead="Ações sensíveis não viram atalhos: aparecem como decisões explícitas ou bloqueios com motivo."
      />
      <div className="safetyLayout">
        <div className="safetyGrid">
          {safetyRails.map((rail) => (
            <article className="safetyCard" key={rail.title}>
              <h3>{rail.title}</h3>
              <p>{rail.text}</p>
            </article>
          ))}
        </div>
        <HumanDecisionCallout />
      </div>
    </section>
  );
}

function ProductCTA(): JSX.Element {
  return (
    <section className="ctaBand">
      <h2>Pronto para experimentar?</h2>
      <p>
        Comece em uma pasta nova ou adote em um repo existente — o preview mostra tudo antes de
        aplicar.
      </p>
      <div className="ctaActions">
        <SiteLink className="primaryAction" route="start">
          Começar agora
        </SiteLink>
        <a className="secondaryAction" href="https://www.npmjs.com/package/ai-guidelines">
          Ver pacote npm
        </a>
      </div>
    </section>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────

function HomePage(): JSX.Element {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Governança de engenharia para times com IA</p>
        <h1>Trabalho com IA que não esquece o contexto.</h1>
        <p className="lead heroLead">
          O <strong>ai-guidelines</strong> guarda o estado do projeto no próprio repositório e
          mostra a próxima ação certa — para humanos e múltiplas IAs trabalharem do mesmo mapa.
        </p>
        <div className="heroActions">
          <SiteLink className="primaryAction" route="flow">
            Ver como funciona
          </SiteLink>
          <SiteLink className="secondaryAction" route="start">
            Começar
          </SiteLink>
        </div>
        <figure className="heroFigure">
          <OptimizedImage
            webp={flowImageWebp}
            alt="Ciclo ai-guidelines: backlog, spec, plano, execução, PR, gate humano e merge"
          />
        </figure>
      </section>

      <section className="problemSection">
        <SectionHead
          eyebrow="O problema"
          title="Construir com IA hoje vaza contexto por todos os lados."
        />
        <div className="problemGrid">
          {productProblems.map((problem) => (
            <article className="problemCard" key={problem.title}>
              <h3>{problem.title}</h3>
              <p>{problem.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="solutionSection">
        <div className="solutionCopy">
          <SectionHead
            eyebrow="A solução"
            title="Um fluxo governado que vive no repositório."
            lead="Automação absorve o mecânico, a governança organiza o sistema e o humano decide o que importa."
          />
          <div className="solutionGrid">
            {productSolutions.map((point) => (
              <article className="solutionCard" key={point.title}>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </article>
            ))}
          </div>
        </div>
        <figure className="visualFrame">
          <OptimizedImage
            webp={layersImageWebp}
            alt="Camadas do ai-guidelines: automação estrutural, governança operacional e julgamento humano"
          />
        </figure>
      </section>

      <section className="audienceSection">
        <SectionHead
          eyebrow="Por onde começar"
          title="Três caminhos, conforme o momento do repositório."
        />
        <div className="audienceGrid">
          {audiencePaths.map((path) => (
            <article className="audienceCard" key={path.id}>
              <span className="pill">{path.label}</span>
              <h3>{path.title}</h3>
              <p>{path.text}</p>
              <code>{path.command}</code>
              <SiteLink route={path.route}>Ver passo a passo →</SiteLink>
            </article>
          ))}
        </div>
      </section>

      <section className="teamTeaser">
        <div>
          <SectionHead
            eyebrow="Em time"
            title="Várias pessoas, várias specs, sem pisar no mesmo estado."
            lead="Escolher a frente certa, revisar o PR de um colega e trocar de contexto com segurança fazem parte do fluxo."
          />
          <div className="teaserActions">
            <SiteLink className="textLink" route="team">
              Trabalho em time e múltiplas specs →
            </SiteLink>
            <SiteLink className="textLink" route="peerReview">
              Review entre pares →
            </SiteLink>
          </div>
        </div>
      </section>

      <SafetyRail />
      <ProductCTA />
    </>
  );
}

// ── /flow (visão geral) ───────────────────────────────────────────────────

function FlowOverview(): JSX.Element {
  const areas = [
    {
      route: "start" as const,
      label: "Começar",
      text: "Init para projeto novo, adopt para repo existente.",
    },
    {
      route: "daily" as const,
      label: "Uso diário",
      text: "Próxima ação, validação, review e decisões.",
    },
    {
      route: "team" as const,
      label: "Em time",
      text: "Múltiplas specs e troca segura de contexto.",
    },
    {
      route: "peerReview" as const,
      label: "Review entre pares",
      text: "Revisar o PR de um colega sem perder sua branch.",
    },
  ];

  return (
    <FlowShell
      eyebrow="Como funciona"
      title="O caminho muda conforme o momento do repositório."
      lead="Comece pela intenção. Cada área tem um passo a passo e um exemplo de terminal de apoio."
    >
      <div className="overviewGrid">
        {areas.map((area) => (
          <SiteLink className="overviewCard" key={area.route} route={area.route}>
            <span className="pill">{area.label}</span>
            <p>{area.text}</p>
            <span className="textLink">Abrir →</span>
          </SiteLink>
        ))}
      </div>

      <section className="previewSection">
        <SectionHead
          eyebrow="Veja de verdade"
          title="Exemplos de terminal gerados do runtime real."
          lead="Estes transcripts são capturados de execução real em dry-run — não são telas inventadas."
        />
        <ScenarioTabs
          scenarioIds={["new-project", "existing-repo", "governed-repo", "update-providers"]}
        />
      </section>
    </FlowShell>
  );
}

function FlowShell({
  children,
  eyebrow,
  lead,
  title,
}: {
  readonly children: ReactNode;
  readonly eyebrow: string;
  readonly lead: string;
  readonly title: string;
}): JSX.Element {
  return (
    <>
      <section className="flowHero">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
        <nav className="flowNav" aria-label="Áreas do flow">
          {routes
            .filter((route) => route.id !== "home" && route.id !== "flow")
            .map((route) => (
              <SiteLink key={route.id} route={route.id}>
                {route.label}
              </SiteLink>
            ))}
        </nav>
      </section>
      {children}
    </>
  );
}

function JourneyPage({
  intro,
  journeys,
}: {
  readonly intro: { readonly eyebrow: string; readonly title: string; readonly lead: string };
  readonly journeys: readonly Journey[];
}): JSX.Element {
  return (
    <FlowShell eyebrow={intro.eyebrow} lead={intro.lead} title={intro.title}>
      <div className="journeyStack">
        {journeys.map((journey) => (
          <JourneySection journey={journey} key={`${journey.title}-${journey.command}`} />
        ))}
      </div>
    </FlowShell>
  );
}

function JourneySection({ journey }: { readonly journey: Journey }): JSX.Element {
  return (
    <section className="journeySection">
      <div className="journeyIntro">
        <span className="pill">{journey.eyebrow}</span>
        <h2>{journey.title}</h2>
        <p>{journey.summary}</p>
        <code>{journey.command}</code>
        <div className="whenBox">
          <h3>Quando usar</h3>
          <ul>
            {journey.whenToUse.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="journeyBody">
        <StepNavigator steps={journey.steps} />
        {journey.scenarioId ? <ScenarioPanel scenarioId={journey.scenarioId} /> : null}
      </div>
    </section>
  );
}

// ── Referência + glossário ────────────────────────────────────────────────

function ReferencePage(): JSX.Element {
  return (
    <FlowShell
      eyebrow="Referência"
      title="Comandos, conceitos e glossário em um lugar só."
      lead="Os comandos e práticas vêm do mesmo catálogo da CLI — site e wizard nunca divergem."
    >
      <div className="referenceGrid">
        {referenceGroups.map((group) => (
          <section className="referenceGroup" key={group.title}>
            <h2>{group.title}</h2>
            <p>{group.text}</p>
            <div className="referenceList">
              {group.items.map((item) => (
                <article key={`${group.title}-${item.label}`}>
                  <strong>{item.label}</strong>
                  <span>{item.hint}</span>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="glossarySection">
        <SectionHead eyebrow="Glossário" title="Termos que aparecem no fluxo." />
        <dl className="glossary">
          {glossary.map((entry) => (
            <div className="glossaryItem" key={entry.term}>
              <dt>{entry.term}</dt>
              <dd>{entry.definition}</dd>
            </div>
          ))}
        </dl>
      </section>
    </FlowShell>
  );
}

// ── Contribuidor (superfície secundária) ──────────────────────────────────

function ContributePage(): JSX.Element {
  const scenario = scenarioById(contributorBlock.scenarioId);
  return (
    <section className="contributeSection">
      <p className="eyebrow">{contributorBlock.eyebrow}</p>
      <h1>{contributorBlock.title}</h1>
      <p className="lead">{contributorBlock.lead}</p>
      <aside className="callout calloutInternal" role="note">
        <strong>Uso interno.</strong> {contributorBlock.note}
      </aside>
      <div className="contributeGrid">
        {contributorBlock.points.map((point) => (
          <article className="contributeCard" key={point.title}>
            <h3>{point.title}</h3>
            <p>{point.text}</p>
          </article>
        ))}
      </div>
      <div className="contributeCommands">
        {contributorBlock.commands.map((command) => (
          <div className="contributeCommand" key={command.label}>
            <code>{command.label}</code>
            <span>{command.hint}</span>
          </div>
        ))}
      </div>
      {scenario ? (
        <div className="scenarioPanel">
          <p className="scenarioNote">{scenario.note}</p>
          <ScenarioTerminal scenario={scenario} />
        </div>
      ) : null}
      <div className="heroActions">
        <SiteLink className="secondaryAction" route="home">
          Voltar ao site do produto
        </SiteLink>
      </div>
    </section>
  );
}

// ── 404 ───────────────────────────────────────────────────────────────────

function NotFoundPage(): JSX.Element {
  return (
    <section className="notFound">
      <p className="eyebrow">Erro 404</p>
      <h1>Esta página não existe.</h1>
      <p className="lead">
        O endereço pedido não corresponde a nenhuma área do site. Volte ao produto ou veja como o
        fluxo funciona.
      </p>
      <div className="heroActions">
        <SiteLink className="primaryAction" route="home">
          Voltar ao produto
        </SiteLink>
        <SiteLink className="secondaryAction" route="flow">
          Ver como funciona
        </SiteLink>
      </div>
    </section>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────

function ActivePage({ route }: { readonly route: RouteId }): JSX.Element {
  if (route === "home") return <HomePage />;
  if (route === "flow") return <FlowOverview />;
  if (route === "start") {
    return (
      <JourneyPage
        intro={{
          eyebrow: "Começar",
          title: "init para projeto novo, adopt para repo existente.",
          lead: "São entradas diferentes. Depois que o repo está governado, o caminho normal vira uso diário.",
        }}
        journeys={startJourneys}
      />
    );
  }
  if (route === "daily") {
    return (
      <JourneyPage
        intro={{
          eyebrow: "Uso diário",
          title: "O guia mostra o próximo passo e evita atalhos inseguros.",
          lead: "Para quem já usa ai-guidelines no repo: trabalhar, validar, revisar, marcar pronto e preparar decisões.",
        }}
        journeys={[dailyJourney]}
      />
    );
  }
  if (route === "team") {
    return (
      <JourneyPage
        intro={{
          eyebrow: "Em time",
          title: "Antes de trabalhar, confirme a frente correta.",
          lead: "Escolher a spec certa, evitar branch errada e saber quando criar uma spec nova exige autorização.",
        }}
        journeys={[teamJourney]}
      />
    );
  }
  if (route === "peerReview") {
    return (
      <JourneyPage
        intro={{
          eyebrow: "Review entre pares",
          title: "Revisar o PR de um colega deve ser um fluxo próprio.",
          lead: "Abra o PR em worktree separado ou checkout guiado, sem misturar com sua spec atual.",
        }}
        journeys={[peerReviewJourney]}
      />
    );
  }
  if (route === "reference") return <ReferencePage />;
  if (route === "contribute") return <ContributePage />;
  return <NotFoundPage />;
}

function SiteFooter(): JSX.Element {
  return (
    <footer className="siteFooter">
      <p>ai-guidelines — governança de IA multi-agente, agnóstica de modelo, IDE e linguagem.</p>
      <div className="footerLinks">
        <SiteLink route="flow">Como funciona</SiteLink>
        <SiteLink route="reference">Referência</SiteLink>
        <SiteLink route="contribute">Contribuindo</SiteLink>
        <a href="https://github.com/rosanarezende/ai-guidelines">GitHub</a>
        <a href="https://www.npmjs.com/package/ai-guidelines">npm</a>
      </div>
    </footer>
  );
}

export function App(): JSX.Element {
  const [route, navigate] = useRoute();

  useEffect(() => {
    const handler = (event: Event) => navigate((event as CustomEvent<RouteId>).detail);
    window.addEventListener("site:navigate", handler);
    return () => window.removeEventListener("site:navigate", handler);
  }, [navigate]);

  // Título por rota (SEO/a11y): cada área navegável tem <title> próprio.
  useEffect(() => {
    document.title = routeTitle(route);
  }, [route]);

  return (
    <>
      <a className="skipLink" href="#conteudo">
        Pular para o conteúdo
      </a>
      <SiteHeader current={route} />
      <main id="conteudo">
        <ActivePage route={route} />
      </main>
      <SiteFooter />
    </>
  );
}
