const cloudflareSettings = [
  ["Framework preset", "React (Vite)"],
  ["Build command", "npm run site:build"],
  ["Build output directory", "site/dist"],
  ["Root directory", "/"],
  ["Production branch", "main"],
  ["Environment variables", "nenhuma por enquanto"],
] as const;

const productTracks = [
  {
    title: "Flow visual",
    text: "Mostra as jornadas de inicializar, adotar e usar o framework em um repositório vivo.",
    href: "/flow/",
    action: "Abrir o Flow",
  },
  {
    title: "Documentacao governada",
    text: "Este site passa a ser produto do repositório: revisado, testado e publicado junto do fluxo governado.",
    href: "#cloudflare",
    action: "Ver deploy",
  },
  {
    title: "Base React/Vite",
    text: "A estrutura já permite evoluir para componentes, rotas e visualizacoes mais ricas sem inflar o pacote npm.",
    href: "#arquitetura",
    action: "Entender arquitetura",
  },
] as const;

export function App(): JSX.Element {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">ai-guidelines</p>
        <h1>Documentacao viva para acompanhar o fluxo governado.</h1>
        <p className="lead">
          Esta pagina é a nova entrada React/Vite do site. O Flow visual atual continua disponivel
          em
          <a href="/flow/"> /flow/</a>, e a Cloudflare Pages publica o build estático em{" "}
          <code>site/dist</code>.
        </p>
        <div className="heroActions">
          <a className="primaryAction" href="/flow/">
            Ver Flow visual
          </a>
          <a className="secondaryAction" href="#cloudflare">
            Configurar Cloudflare
          </a>
        </div>
      </section>

      <section className="trackGrid" aria-label="Áreas do site">
        {productTracks.map((track) => (
          <article className="trackCard" key={track.title}>
            <h2>{track.title}</h2>
            <p>{track.text}</p>
            <a href={track.href}>{track.action}</a>
          </article>
        ))}
      </section>

      <section className="sectionBand" id="cloudflare">
        <div>
          <p className="eyebrow">Cloudflare Pages</p>
          <h2>Configuração para publicar o site</h2>
          <p>
            Use estas opções na tela de deploy. O comando de build valida que os textos do Flow
            continuam sincronizados com a CLI antes de gerar o pacote estático.
          </p>
        </div>
        <dl className="settingsList">
          {cloudflareSettings.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="sectionBand" id="arquitetura">
        <div>
          <p className="eyebrow">Arquitetura</p>
          <h2>Site fora do pacote npm</h2>
          <p>
            React, Vite e o build do site ficam em <code>devDependencies</code>. O pacote publicado
            continua focado no runtime <code>ai-guidelines</code>, sem enviar <code>site/</code>{" "}
            para consumidores.
          </p>
        </div>
        <div className="architectureBox">
          <span>repo</span>
          <strong>site/</strong>
          <span>npm run site:build</span>
          <strong>site/dist</strong>
          <span>Cloudflare Pages</span>
        </div>
      </section>
    </main>
  );
}
