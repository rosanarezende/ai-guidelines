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
  },
  {
    label: "Repositório existente",
    command: "npx ai-guidelines adopt --target . --dry-run",
    text: "Mostra preview conservador antes de preservar e integrar o que já existe.",
  },
  {
    label: "Repo já governado",
    command: "npx ai-guidelines",
    text: "Abre o guia situado para entender estado, bloqueios, próximos passos e decisões.",
  },
] as const;

const commandRows = [
  ["init", "começar projeto novo"],
  ["adopt", "adotar repositório existente"],
  ["update", "reaplicar baseline, providers e práticas"],
  ["work", "gerar orientação da sessão para colar na IA"],
  ["decide", "preparar decisões humanas com briefing e preview"],
  ["review", "preparar revisão governada do PR"],
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
  return <img src={webp} alt={alt} />;
}

export function App(): JSX.Element {
  return (
    <main>
      <header className="siteHeader">
        <a className="brand" href="/">
          ai-guidelines
        </a>
        <nav aria-label="Navegação principal">
          <a href="#comecar">Começar</a>
          <a href="#ganhos">Ganhos</a>
          <a href="/flow/">Flow visual</a>
        </nav>
      </header>

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
          <a className="primaryAction" href="/flow/">
            Ver o fluxo visual
          </a>
          <a className="secondaryAction" href="#comecar">
            Começar em um repo
          </a>
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

      <section className="commandBand">
        <div>
          <p className="eyebrow">Comandos essenciais</p>
          <h2>Uma superfície pequena para operar o ciclo inteiro.</h2>
        </div>
        <div className="commandList">
          {commandRows.map(([command, description]) => (
            <div key={command}>
              <code>npx ai-guidelines {command}</code>
              <span>{description}</span>
            </div>
          ))}
        </div>
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
          <a className="primaryAction" href="/flow/">
            Explorar o Flow completo
          </a>
          <a className="secondaryAction" href="https://www.npmjs.com/package/ai-guidelines">
            Ver pacote npm
          </a>
        </div>
      </section>
    </main>
  );
}
