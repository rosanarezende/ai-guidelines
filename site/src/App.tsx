import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  dailyJourney,
  FlowStep,
  Journey,
  peerReviewJourney,
  referenceGroups,
  routeFromPath,
  routePath,
  routes,
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
const beforeAfterImageWebp = new URL(
  "./assets/generated/ai-guidelines-before-after.webp",
  import.meta.url
).href;

const benefits = [
  {
    title: "Responsabilidades separadas",
    text: "Automação cuida do mecânico, governança organiza o processo e humanos continuam decidindo o que importa.",
  },
  {
    title: "Estado canônico no repositório",
    text: "Specs, decisões, reviews, gates e próximos passos vivem em arquivos versionados, não em memória de agente.",
  },
  {
    title: "Gates humanos explícitos",
    text: "Ready, Human Gate e merge deixam de ser gestos soltos e viram decisões situadas com evidência e bloqueios claros.",
  },
  {
    title: "Integração AI-agnóstica",
    text: "O contexto é preparado para Claude, Codex, Gemini, Copilot, Cursor, Windsurf, Aider e outros canais.",
  },
  {
    title: "Atualizações seguras",
    text: "Managed blocks preservam conteúdo local e permitem reaplicar runtime, templates, providers e práticas governadas.",
  },
  {
    title: "Living documentation",
    text: "Testes, scripts e artefatos governados viram documentação verificável, protegida contra drift por validações.",
  },
] as const;

const quickStarts = [
  {
    label: "Projeto novo",
    command: "npx ai-guidelines init",
    text: "Cria baseline governance-first com wizard interativo.",
    route: "start" as const,
  },
  {
    label: "Repositório existente",
    command: "npx ai-guidelines adopt --target . --dry-run",
    text: "Mostra preview conservador antes de preservar e integrar o que já existe.",
    route: "start" as const,
  },
  {
    label: "Repo já governado",
    command: "npx ai-guidelines",
    text: "Abre o guia situado para entender estado, bloqueios, próximos passos e decisões.",
    route: "daily" as const,
  },
] as const;

const lifecycle = [
  "Backlog",
  "Spec",
  "Plano",
  "Implementação",
  "Review",
  "Human Gate",
  "Integração",
  "Merge",
] as const;

interface OptimizedImageProps {
  alt: string;
  webp: string;
}

function OptimizedImage({ alt, webp }: OptimizedImageProps): JSX.Element {
  return <img src={webp} alt={alt} loading="lazy" decoding="async" />;
}

interface LinkProps {
  children: ReactNode;
  className?: string;
  route: RouteId;
}

function useRoute(): [RouteId, (route: RouteId) => void] {
  const initialRoute = useMemo(() => routeFromPath(window.location.pathname), []);
  const [route, setRoute] = useState<RouteId>(initialRoute);

  function navigate(nextRoute: RouteId): void {
    const nextPath = routePath(nextRoute);
    window.history.pushState({}, "", nextPath);
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

function SiteLink({ children, className, route }: LinkProps): JSX.Element {
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
          .filter((route) => route.id !== "reference")
          .map((route) => (
            <SiteLink
              className={route.id === current ? "isCurrent" : undefined}
              key={route.id}
              route={route.id}
            >
              {route.shortLabel}
            </SiteLink>
          ))}
        <SiteLink className={current === "reference" ? "isCurrent" : undefined} route="reference">
          Referência
        </SiteLink>
      </nav>
    </header>
  );
}

function HomePage(): JSX.Element {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Governança de engenharia para times com IA</p>
        <h1>ai-guidelines</h1>
        <p className="tagline">
          Automação absorve o mecânico. Governança organiza o sistema. Humanos decidem o que
          importa.
        </p>
        <p className="lead">
          Um framework repo-first para transformar specs, decisões, revisões e gates em fluxo
          rastreável, auditável e pronto para humanos e múltiplas IAs.
        </p>
        <div className="heroActions">
          <SiteLink className="primaryAction" route="flow">
            Ver o Flow visual
          </SiteLink>
          <SiteLink className="secondaryAction" route="start">
            Começar em um repo
          </SiteLink>
        </div>
        <figure className="heroFigure">
          <OptimizedImage
            webp={flowImageWebp}
            alt="Ciclo ai-guidelines: backlog, spec, plano, execução, PR, gate humano e merge"
          />
        </figure>
      </section>

      <section className="statementBand" aria-label="Princípio central">
        <div>
          <p className="eyebrow">Princípio central</p>
          <h2>O objetivo não é automatizar decisões.</h2>
        </div>
        <p>
          O objetivo é remover trabalho mecânico para que o julgamento humano aconteça apenas onde
          existe incerteza real. A CLI organiza o estado, mostra o próximo passo e bloqueia caminhos
          inseguros.
        </p>
      </section>

      <section className="visualSection">
        <div className="sectionCopy">
          <p className="eyebrow">Como funciona</p>
          <h2>Três camadas que normalmente ficam misturadas.</h2>
          <p>
            A automação estrutural remove ruído, a governança operacional protege o fluxo e o
            julgamento humano fica reservado para Ready, Human Gate, merge e decisões reais de
            produto.
          </p>
        </div>
        <figure className="visualFrame">
          <OptimizedImage
            webp={layersImageWebp}
            alt="Camadas do ai-guidelines: automação estrutural, governança operacional e julgamento humano"
          />
        </figure>
      </section>

      <section className="quickStart" id="comecar">
        <div className="sectionCopy">
          <p className="eyebrow">Comece pelo estado do repositório</p>
          <h2>O comando certo depende do momento do projeto.</h2>
        </div>
        <div className="quickGrid">
          {quickStarts.map((item) => (
            <article className="quickCard" key={item.label}>
              <span>{item.label}</span>
              <code>{item.command}</code>
              <p>{item.text}</p>
              <SiteLink route={item.route}>Ver passo a passo</SiteLink>
            </article>
          ))}
        </div>
      </section>

      <section className="benefits" id="ganhos">
        <div className="sectionCopy">
          <p className="eyebrow">O que você ganha</p>
          <h2>Menos reconstrução de contexto. Mais coerência operacional.</h2>
        </div>
        <div className="benefitGrid">
          {benefits.map((benefit) => (
            <article className="benefitCard" key={benefit.title}>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="visualSection">
        <div className="sectionCopy">
          <p className="eyebrow">Antes e depois</p>
          <h2>O contexto deixa de ser reconstruído a cada sessão.</h2>
          <p>
            O estado passa a viver no repositório. Handoff, work, decide, reviews e gates leem a
            mesma base factual e mostram o que está disponível, bloqueado ou proibido.
          </p>
        </div>
        <figure className="visualFrame">
          <OptimizedImage
            webp={beforeAfterImageWebp}
            alt="Antes e depois do ai-guidelines: do contexto reconstruído para o contexto canônico versionado"
          />
        </figure>
      </section>

      <section className="lifecycle">
        <div className="sectionCopy">
          <p className="eyebrow">Ciclo governado</p>
          <h2>Da ideia ao merge, sem depender de memória humana.</h2>
        </div>
        <ol>
          {lifecycle.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="finalActions">
          <SiteLink className="primaryAction" route="flow">
            Explorar o Flow completo
          </SiteLink>
          <a className="secondaryAction" href="https://www.npmjs.com/package/ai-guidelines">
            Ver pacote npm
          </a>
        </div>
      </section>
    </>
  );
}

function FlowOverview(): JSX.Element {
  const cards = [
    {
      route: "start" as const,
      label: "Começar uma vez",
      title: "Projeto novo ou repo existente",
      text: "Init e adopt colocam o repositório no framework sem misturar com o uso diário.",
    },
    {
      route: "daily" as const,
      label: "Uso diário",
      title: "Trabalho, validação e decisões",
      text: "Depois da adoção, o guia mostra próxima ação, bloqueios, updates e validações.",
    },
    {
      route: "team" as const,
      label: "Time e specs",
      title: "Escolher a frente certa",
      text: "Para múltiplas specs, branch esperada, PR correto e criação segura de spec nova.",
    },
    {
      route: "peerReview" as const,
      label: "Review entre pares",
      title: "Revisar PR de colega",
      text: "Abre o PR em worktree separado ou checkout guiado sem perder o trabalho atual.",
    },
  ];

  return (
    <FlowShell
      eyebrow="Flow visual"
      title="O caminho muda conforme o momento do repositório."
      lead="A página agora é navegável: comece por intenção humana e entre no detalhe apenas quando fizer sentido."
    >
      <div className="journeyGrid">
        {cards.map((card) => (
          <article className="journeyCard" key={card.route}>
            <span className="pill">{card.label}</span>
            <h2>{card.title}</h2>
            <p>{card.text}</p>
            <SiteLink route={card.route}>Abrir fluxo</SiteLink>
          </article>
        ))}
      </div>
      <section className="plainPanel">
        <h2>Regra simples</h2>
        <p>
          `init` e `adopt` acontecem uma vez. Depois disso, o uso normal passa por `npm run flow`,
          `update`, `specs`, `peer-review`, validações e decisões governadas.
        </p>
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
        <div className="flowNav" aria-label="Áreas do flow">
          {routes
            .filter((route) => route.id !== "home")
            .map((route) => (
              <SiteLink key={route.id} route={route.id}>
                {route.label}
              </SiteLink>
            ))}
        </div>
      </section>
      {children}
    </>
  );
}

function JourneyPage({
  intro,
  journeys,
}: {
  readonly intro: {
    readonly eyebrow: string;
    readonly title: string;
    readonly lead: string;
  };
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
      <StepNavigator steps={journey.steps} />
    </section>
  );
}

function StepNavigator({ steps }: { readonly steps: readonly FlowStep[] }): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = steps[activeIndex] ?? steps[0];

  return (
    <div className="stepNavigator">
      <div className="stepList" aria-label="Passos do fluxo">
        {steps.map((step, index) => (
          <button
            aria-current={index === activeIndex ? "step" : undefined}
            className={index === activeIndex ? "stepButton isActive" : "stepButton"}
            key={step.title}
            onClick={() => setActiveIndex(index)}
            type="button"
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step.title}</strong>
            <small>{step.text}</small>
          </button>
        ))}
      </div>
      <StepDetail step={activeStep} />
    </div>
  );
}

function StepDetail({ step }: { readonly step: FlowStep }): JSX.Element {
  return (
    <article className="stepDetail">
      <div className="stepCopy">
        <h3>{step.title}</h3>
        <p>{step.text}</p>
        {step.command ? <code>{step.command}</code> : null}
      </div>
      <TerminalDemo lines={step.lines} title={step.command ?? "npm run flow"} />
    </article>
  );
}

function TerminalDemo({
  lines,
  title,
}: {
  readonly lines: readonly TerminalLine[];
  readonly title: string;
}): JSX.Element {
  return (
    <figure className="terminalDemo" aria-label={`Simulação de terminal: ${title}`}>
      <figcaption>
        <span></span>
        <span></span>
        <span></span>
        <strong>{title}</strong>
      </figcaption>
      <pre>
        {lines.map((line, index) => (
          <TerminalLineView key={`${line.text}-${index}`} line={line} />
        ))}
      </pre>
    </figure>
  );
}

function TerminalLineView({ line }: { readonly line: TerminalLine }): JSX.Element {
  return <span className={`terminalLine ${line.tone ?? "normal"}`}>{line.text}</span>;
}

function ReferencePage(): JSX.Element {
  return (
    <FlowShell
      eyebrow="Referência"
      title="Comandos, providers e práticas em um lugar só."
      lead="Esta área é para consulta rápida. Ela usa o mesmo catálogo de textos da CLI, para evitar divergência entre site e wizard."
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
    </FlowShell>
  );
}

function ActivePage({ route }: { readonly route: RouteId }): JSX.Element {
  if (route === "home") return <HomePage />;
  if (route === "flow") return <FlowOverview />;
  if (route === "start") {
    return (
      <JourneyPage
        intro={{
          eyebrow: "Começar uma vez",
          title: "Escolha init ou adopt pelo estado real do repo.",
          lead: "Projeto novo e repo existente são entradas diferentes. Depois que o repo está governado, o caminho normal vira uso diário.",
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
          lead: "Esta é a experiência para quem já usa ai-guidelines no repo e precisa trabalhar, validar, atualizar ou preparar decisões.",
        }}
        journeys={[dailyJourney]}
      />
    );
  }
  if (route === "team") {
    return (
      <JourneyPage
        intro={{
          eyebrow: "Time e múltiplas specs",
          title: "Antes de trabalhar, confirme a frente correta.",
          lead: "O fluxo ajuda a escolher a spec certa, evitar branch errada e entender quando criar uma spec nova exige autorização.",
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
          title: "Revisar PR de colega deve ser um fluxo próprio.",
          lead: "A pessoa pode abrir o PR em worktree separado ou checkout guiado, sem misturar com sua spec atual.",
        }}
        journeys={[peerReviewJourney]}
      />
    );
  }
  return <ReferencePage />;
}

export function App(): JSX.Element {
  const [route, navigate] = useRoute();

  useEffect(() => {
    const handler = (event: Event) => {
      const routeId = (event as CustomEvent<RouteId>).detail;
      navigate(routeId);
    };
    window.addEventListener("site:navigate", handler);
    return () => window.removeEventListener("site:navigate", handler);
  }, [navigate]);

  return (
    <main>
      <SiteHeader current={route} />
      <ActivePage route={route} />
    </main>
  );
}
