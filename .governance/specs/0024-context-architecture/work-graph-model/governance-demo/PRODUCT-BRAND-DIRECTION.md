---
artifact-kind: decision-brief
---

# Direcao de marca candidata - Guilda Governance

> **Status:** candidata principal visual, nao decisao final de marca.
> **Data:** 2026-07-08.
> **Autoridade:** registra a direcao visual/narrativa escolhida para continuar
> explorando; nao substitui clearance juridico, decisao final de nome nem
> vetorizacao manual.

## 1. Veredito da rodada visual

A direcao visual candidata principal para a hipotese de marca **Guilda
Governance** e:

```text
Workgraph assimetrico com decisao humana central, celulas de trabalho/contexto,
trilhas de evidencia/responsabilidade e fluxo de saida para repositorios,
integracoes e governance host.
```

A marca deixa de perseguir um monograma literal com **G**. A leitura mais forte
e um simbolo de sistema vivo: pessoas, areas de trabalho, evidencias, politicas
e saidas externas conectadas por um grafo de trabalho governado.

## 2. Narrativa

**Frase guia:** Pessoas decidem. O sistema apoia.

**Interpretacao:**

- o ponto central em latao representa a decisao humana;
- os blocos verdes representam areas de trabalho, times, iniciativas ou
  dominios;
- os blocos claros representam contexto, documentos, evidencias e insights;
- o bloco grafite representa restricoes, politicas, riscos e guardrails;
- as linhas representam trilhas de evidencia e responsabilidade;
- o fluxo para fora representa continuidade do trabalho para repositorios,
  integracoes e governance host.

Essa direcao encaixa com a arquitetura do produto: o portal ajuda pessoas a
operar governanca, mas a governanca real continua Git-backed e sob controle do
usuario.

## 3. Arquitetura de marca

| Camada                | Nome candidato        | Papel                                               |
| --------------------- | --------------------- | --------------------------------------------------- |
| Guarda-chuva          | **Guilda**            | nome informal do ecossistema                        |
| App principal         | **Guilda Governance** | portal visual de governanca de trabalho             |
| CLI publica futura    | **guilda flow**       | operacao em terminal, repositorios, CI e automacoes |
| Modelo tecnico        | **Guilda Workgraph**  | grafo derivado de trabalho, evidencia e autoridade  |
| Governance host       | **Guilda Host**       | local Git-backed onde a governanca mora             |
| Assistente contextual | **Guilda Cup**        | Contextual Work Partner; nao e copilot decisor      |
| Engine atual          | **ai-guidelines**     | engine/core repo-first durante a transicao          |

## 4. Diretrizes visuais registradas

- Evitar brasao medieval literal, castelo, espada, coroa, tocha ou pergaminho.
- Evitar simbolo generico de IA, estrela, robo, circuito neon ou grafo tecnico
  frio.
- Preservar a sensacao de casa de oficio moderna: trabalho coordenado,
  responsabilidade compartilhada, evidencias e fluxo.
- Manter **Guilda** como leitura principal e **Governance** como descritor do
  app.
- Manter **Guilda Cup** com icone de xicara de cha/cafe, nao taca/trofeu.
- Em textos do Cup, usar **Contextual Work Partner** e evitar "copilot" como
  promessa de autonomia.
- Usar a frase "Pessoas decidem. O sistema apoia." como promessa central em
  telas publicas/login.

## 5. Assets e design system

Primeira escolha visual versionada:

- [`brand/reference/2026-07-08-first-choice/guilda-symbol-light-reference.jpg`](brand/reference/2026-07-08-first-choice/guilda-symbol-light-reference.jpg)
- [`brand/reference/2026-07-08-first-choice/guilda-symbol-dark-reference.jpg`](brand/reference/2026-07-08-first-choice/guilda-symbol-dark-reference.jpg)
- [`brand/reference/2026-07-08-first-choice/guilda-consolidated-board-reference.jpg`](brand/reference/2026-07-08-first-choice/guilda-consolidated-board-reference.jpg)

Primeiro refinamento manual no Affinity, candidato para prototipo versionado:

- [`brand/assets/2026-07-08-affinity-symbol/guilda-symbol-color.png`](brand/assets/2026-07-08-affinity-symbol/guilda-symbol-color.png)
- [`brand/assets/2026-07-08-affinity-symbol/guilda-symbol-monochrome.png`](brand/assets/2026-07-08-affinity-symbol/guilda-symbol-monochrome.png)
- [`brand/assets/2026-07-08-affinity-symbol/guilda-symbol-line.png`](brand/assets/2026-07-08-affinity-symbol/guilda-symbol-line.png)

Familia de icones aplicada ao prototipo:

- [`brand/assets/2026-07-08-product-icons/README.md`](brand/assets/2026-07-08-product-icons/README.md)

Essa familia separa icones para **Guilda Governance**, **Guilda Workgraph**,
**Guilda Host**, **guilda flow** e **Guilda Cup**, com versoes para fundos
claros e escuros. No frontend, os mesmos arquivos sao servidos em
`frontend/public/brand/icons/`.

Imagem candidata de hero para a pagina publica:

- [`brand/assets/2026-07-08-public-hero/README.md`](brand/assets/2026-07-08-public-hero/README.md)

Essa imagem comunica o ecossistema em fluxo na landing. Ela nao substitui o
icone de **Guilda Workgraph**.

Design system inicial:

- [`PRODUCT-DESIGN-SYSTEM.md`](PRODUCT-DESIGN-SYSTEM.md)

Esses arquivos orientam a adaptacao visual do produto. Os JPGs sao referencia
visual; os PNGs do Affinity podem entrar no prototipo versionado como assets
candidatos. A versao final ainda precisa de SVG manual, favicon simplificado e
clearance de marca.

## 6. Checagem preliminar de nome - 2026-07-08

Esta checagem e operacional e preliminar. Ela nao e parecer juridico nem
clearance de trademark.

### 6.1 Risco publico conhecido

Existe uma empresa **GUILDA Cyber Solutions** atuando em cybersecurity, digital
transformation, software/hi-tech e compliance/governance. O site publico da
empresa declara **GUILDA(R)** como marca registrada nos Estados Unidos e no
Mexico. Isso nao elimina automaticamente **Guilda Governance**, mas torna
obrigatoria uma checagem formal antes de repo publico, dominio, npm/package,
landing page publica ou campanha.

Fontes registradas:

- https://guilda.io/industries/software-hi-tech/
- https://www.wipo.int/en/web/global-brand-database

### 6.2 Pacotes e handles exatos

Comandos executados localmente em 2026-07-08:

- `npm view <name> name version description --json`
- `gh api users/<name>`
- `https://pypi.org/pypi/<name>/json`

Resultado: nenhum dos nomes abaixo apareceu como pacote npm, pacote PyPI ou
usuario/organizacao exata no GitHub no momento da checagem.

```text
guilda-governance
guilda-flow
guilda-workgraph
guilda-host
guilda-cup
use-guilda
guilda-cli
guilda-platform
guilda-app
guildagovernance
guildaflow
guildaworkgraph
```

Interpretacao: os compostos parecem operacionalmente mais promissores que
`Guilda` isolado. Ainda precisam de busca em repositorios, marcas, dominios,
redes sociais e registros nacionais/regionais.

### 6.3 Dominios

RDAP preliminar em 2026-07-08:

| Dominio                 | Resultado preliminar |
| ----------------------- | -------------------- |
| `guilda-governance.dev` | not found            |
| `guilda-governance.app` | not found            |
| `guilda-governance.io`  | not found            |
| `guildagovernance.org`  | not found            |
| `guildagovernance.dev`  | not found            |
| `guildagovernance.app`  | not found            |
| `guilda-flow.com`       | not found            |
| `guilda-flow.org`       | not found            |
| `guilda-flow.app`       | not found            |
| `guilda-flow.io`        | not found            |
| `guildaflow.com`        | found                |
| `guildaflow.org`        | not found            |
| `guildaflow.dev`        | not found            |
| `use-guilda.com`        | not found            |
| `guilda.dev`            | found                |
| `guilda.app`            | found                |
| `guilda.com`            | found                |
| `guilda.org`            | found                |
| `guilda.io`             | not found via RDAP   |

Algumas consultas RDAP/DNS deram timeout; portanto, dominios com timeout devem
ser rechecados antes de qualquer decisao:

```text
guilda-governance.com
guilda-governance.org
guildagovernance.com
guildagovernance.io
guilda-flow.dev
guildaflow.app
guildaflow.io
useguilda.com
```

## 7. Condicoes antes de fechar marca

Antes de declarar **Guilda Governance** como nome publico final:

1. rodar busca formal em WIPO Global Brand Database, USPTO e INPI;
2. checar classes Nice relevantes para software, SaaS, open-source tooling,
   governance, cybersecurity, developer tools e collaboration tools;
3. checar GitHub org/repo, npm, PyPI, crates.io e dominios prioritarios;
4. fazer busca visual por simbolo/grafo semelhante;
5. vetorizar manualmente o simbolo, sem depender de imagem gerada por IA;
6. testar favicon 16px e icone app 24px/48px em contexto real;
7. confirmar se a proximidade com GUILDA Cyber Solutions e aceitavel ou se exige
   alternativa de nome.

## 8. Proxima decisao

**Guilda Governance** segue como candidata principal de narrativa e sistema
visual. A decisao final de nome ainda esta aberta ate a checagem formal de
marca/disponibilidade e a vetorizacao manual.
