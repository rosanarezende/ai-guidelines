---
artifact-kind: research
---

# Comunicação cross-repo: manifesto-por-repo, descoberta automática e os eixos vertical × horizontal

- Data: 2026-06-29 · Spec 0024 · Natureza: **research, não-autoridade** (insumo de DEC; não decide sozinho).
- Em divergência vencem `state.yml`, `tasks.md`, `decision-brief.md`, reviews/gates, Git/GitHub.
- Continua a research [`2026-06-28-per-repo-self-contained-data-and-view.md`](2026-06-28-per-repo-self-contained-data-and-view.md) (contrato-first, backend plugável) e ataca a 🔴🔥 da Parte 2 do tracker (_framework × conhecimento do projeto-alvo_).
- Prior art **pública** abaixo (§9); padrões genéricos. Docs externos privados **inspiram, não se versionam/citam**.

---

## 1 · O problema

O framework precisa saber **ONDE** rodar uma exploration e **COMO** quebrar uma intent (quais repos/works/
contratos) **sem depender da memória humana** (não escala; a IA não tem essa memória). Isso exige uma **camada de
conhecimento do projeto** (org · repos + _o que cada um É_ · capabilities · contratos · ownership) que **informe
o roteamento** e seja **navegável**. Reformulando como comunicação:

- **vertical (host ↔ repo):** o repo **publica pra cima** (o que é/provê/consome/quem cuida); o host **agrega** e
  **injeta pra baixo** (intents, políticas, decisões transversais).
- **horizontal (repo ↔ repo):** repos **coordenam direto, por contrato**, sem passar pelo centro.

Com **os dois eixos** extrai-se valor de **governança** (visão do todo: métricas, caminho crítico, gate, drift) e
de **informação/conteúdo** (a resposta "onde rodar / como quebrar" vem do **vizinho**, não da memória do centro).

## 2 · Compartilhar entre repos NÃO exige um registry público (nem npm)

Questão levantada: para a comunicação entre repos, precisamos de um registry de pacotes (estilo npm)? **Não.** O
protocolo de registry é **HTTP** — qualquer servidor compatível serve como **registry privado interno** (opções
open-source self-hosted ou cloud gerenciado), proxiando o público quando útil. Mas há **3 modos** de compartilhar
e só **um** exige registry:

| modo                      | registry?                    | publicar?     | quando                                                  |
| ------------------------- | ---------------------------- | ------------- | ------------------------------------------------------- |
| **monorepo + workspaces** | ❌                           | ❌            | mesmo monorepo (resolução por symlink)                  |
| **registry publish**      | ✅ (pode ser interno/grátis) | ✅ versionado | polyrepo, **build-time**                                |
| **federation em RUNTIME** | ❌                           | ❌            | polyrepo, composição viva por **referência (URL/nome)** |

O modo **runtime** (ex. **Module Federation**: `host` consome `remote` por URL com deps negociadas em runtime;
e a tendência **Native ESM Federation** via _import maps_) compartilha **sem publicar nada**. **Conclusão pro
nosso caso** (comunicação de **governança/conteúdo**, não de bundles de UI): não precisamos de npm/registry —
precisamos de **(i) um contrato compartilhado** (já temos: as portas `Repository`/`HostRepository`) e **(ii) um
resolver de refs cross-repo** (`<repo>/<tipo>/<id>` a partir do grafo agregado). O ecossistema confirma o
princípio que já adotamos: **acoplar por CONTRATO + resolver por referência**, não por import/publish.

## 3 · Descoberta = MANIFESTO-POR-REPO + auto-discovery (o blueprint público)

O padrão maduro de "o host descobre os repos" (portais de desenvolvedor / software catalogs) é:

1. **Manifesto no repo** — cada repo carrega um arquivo de **auto-declaração** na raiz (ex. `catalog-info.yaml`):
   o que ele **é** (`Component`/`API`/`Resource`/`System`/`Domain`), **ownership** (`spec.owner`, obrigatório),
   o que **provê** (`providesApis`) e **consome/depende** (`consumesApis`/`dependsOn`).
2. **Relações DERIVADAS** — as arestas (`ownedBy`/`partOf`/`providesApi`/`consumesApi`/`dependsOn`) são
   **read-only, deduzidas por processors** a partir dos manifestos. **É exatamente a nossa regra da Lente 3:
   "anota 1 lado, o banco deriva o reverso."**
3. **Auto-discovery via providers** — um provider **varre a org** e registra **qualquer repo que contenha o
   manifesto** (sem hard-code). O repo só **declara**; o central **descobre + agrega**.

→ é o mecanismo que resolve a metade-**vertical** (manifesto sobe, host agrega) e habilita a **horizontal**
(provides × consumes casam → o grafo de "quem coordena com quem" **emerge**).

## 4 · Os 2 eixos, lado a lado (como cada família de tecnologia faz)

| família                       | VERTICAL (host↔unidade)                                            | HORIZONTAL (unidade↔unidade)                                               |
| ----------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **runtime federation**        | host consome remotes                                               | remote consome remote por URL                                              |
| **software catalog / portal** | manifesto sobe + scorecards/políticas descem                       | relações `dependsOn`/`providesApi` derivadas entre componentes             |
| **protocolos de agente (IA)** | agente↔ferramenta/dado central                                     | agente↔agente (descoberta + delegação por **capability card**)             |
| **nosso modelo (Spec 0024)**  | camada **EXTERNA** publica → host agrega; intents/contratos descem | **`coordinates-with`** + **`depends-on`** + **`derives-from`** entre repos |

Padrão convergente: **vertical = manifesto sobe + contexto desce**; **horizontal = contrato declarado + resolução
por referência**. Ninguém acopla por import; todos por **contrato**.

## 5 · O salto da IA (como a prática se aprimorou — benchmark)

A evolução recente (≈2024→2026) transforma o catálogo de **diretório estático** em **knowledge graph consultável
por agentes**:

- **Protocolo agente→ferramenta** (ex. _Model Context Protocol_): o grafo/catálogo é **exposto como um serviço**
  que qualquer agente consulta — adoção massiva no período.
- **Protocolo agente→agente** (ex. _Agent2Agent_): unidades **anunciam capacidades** num **capability card**
  (metadados: capabilities/skills/auth) e agentes **descobrem + delegam** — a forma-IA da comunicação
  **horizontal** (o capability card ≈ o nosso manifesto).
- **Knowledge graph + GraphRAG**: o grafo como **memória persistente consultável**; extração de entidades +
  relações + busca global/local → **raciocínio multi-hop** "atravessando informações por atributos
  compartilhados". **É exatamente o nosso grafo de governança+conhecimento** (o backend `neo4j` já existe) **e a
  🔴🔥** ("a IA raciocina sobre o grafo no lugar da memória humana").

Arquitetura integrada (o desenho do diferencial): _unidades mantêm um knowledge graph → expõem por um protocolo
de ferramenta → anunciam capacidades por um capability card → coordenam por um protocolo de agente_ → queries em
linguagem natural disparam raciocínio multi-hop através dos silos.

**Linha do tempo (resumo):** registro **manual** no catálogo → **manifesto self-register** → **auto-discovery
providers** + **runtime federation** (sem publish) → **catálogo como contexto p/ IA** (auto-cataloging por LLM,
GraphRAG, protocolos de agente). **Direção da indústria = a nossa: grafo derivado, auto-descoberto, consultável.**

## 6 · Mapa pro nosso modelo

| padrão (público)                             | nosso modelo (Spec 0024)                                                                |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| manifesto-por-repo (`catalog-info.yaml`)     | **`.governance/manifest.yml`** (Lente 5: a casa do manifesto de capabilities/contratos) |
| `Component/API/Resource/System/Domain`       | os tipos/agrupamentos do grafo de conhecimento (repo/contrato/capability/iniciativa)    |
| `spec.owner` (obrigatório)                   | `owner` no manifesto (base do roteamento)                                               |
| `providesApis` / `consumesApis`/`dependsOn`  | `provides` / `consumes` → derivam **`coordinates-with`** / **`depends-on`**             |
| relações **deduzidas por processors**        | "**anota 1 lado, o banco deriva**" (Lente 3)                                            |
| **provider varre a org**                     | o **host de governança descobre os repos** (sem hard-code)                              |
| knowledge graph + GraphRAG + capability card | o **neo4j** + (futuro) consulta por IA + repos como agentes que anunciam capabilities   |

## 7 · Direção proposta (seed — o detalhe vai no plano/DEC; ADITIVO, não reabre nada)

1. **`.governance/manifest.yml` por repo** — auto-declaração: `role` (o que é) · `owner` · `domain` · **`provides`**
   (contratos/capabilities ofertados) · **`consumes`** (deps cross-repo) · `references`. = a face **EXTERNA** +
   a camada de CONHECIMENTO. **Resolve a metade-vertical da 🔴🔥.**
2. **Auto-discovery no host** — um "provider" que **varre** as `.governance/` e agrega os manifestos (file hoje;
   plugável p/ git-org-scan depois).
3. **Derivação cross-repo** — o `HostRepository` casa `provides` × `consumes` no mesmo contrato → **deriva
   `coordinates-with`/`depends-on`** (anota 1 lado). **Resolve a metade-horizontal.** Habilita o resolver de refs
   `<repo>/<contrato>` → "quem provê X?", "onde rodar a exploration sobre Y?".
4. **Exposição à IA (futuro):** o grafo derivado consultável (GraphRAG/protocolo de ferramenta) + repos que
   anunciam capabilities — a IA raciocina sobre o grafo **no lugar da memória humana**.

**Fronteira preservada:** isto **estende** (adiciona manifesto + provider + derivação), **não redesenha**. O grafo
segue **derivado** (anota 1 lado); o backend segue **plugável** (file→neo4j→…); a IA é **camada de consulta**.
Honra a 🔴🔥 (modelar é a direção) e não toca o já-decidido (Lentes 1–5, GG-0005).

## 8 · Perguntas abertas (o que a DEC/plano decide)

- **Q1 — campos do manifesto:** o conjunto mínimo (`role`/`owner`/`provides`/`consumes`) basta? `domain`/`status`
  por contrato entram já ou depois?
- **Q2 — quem deriva `coordinates-with`:** confirmar que é **só** o casamento `provides×consumes` no mesmo
  contrato (vs declarar explícito). Provável: derivar.
- **Q3 — auto-discovery:** começa **file-scan** das `.governance/` (sim) e prevê **git-org-scan** (real)? (provável sim — backend plugável.)
- **Q4 — identidade cross-repo:** o contrato é identificado por `<repo>/<nome>` (caminho) — confirma alinhamento
  com a regra de ids (Parte 3) e cross-repo (`2026-06-26-cross-repo-feature-graph.md`).
- **Q5 — relação manifesto × intent:** os `contracts` da intent (declarados no t0) vs os `provides`/`consumes` dos
  manifestos — a intent **planeja** o contrato; o manifesto **declara** quem o provê/consome. Como reconciliar
  (provável: a intent referencia; o manifesto realiza; o banco cruza).
- **Q6 — IA (fora de escopo agora, só prever):** GraphRAG/protocolo de ferramenta sobre o grafo; repos-como-agentes.

## 9 · Prior art (pública)

- **Software catalog / manifesto-por-repo:** [Backstage — descriptor format](https://backstage.io/docs/features/software-catalog/descriptor-format/) · [software catalog](https://backstage.io/docs/features/software-catalog/) · [system model (Roadie)](https://roadie.io/blog/understanding-the-backstage-system-model/). IDP landscape: [platform engineering tools compared (Encore)](https://encore.cloud/resources/platform-engineering-tools).
- **Runtime sharing sem publish:** [Module Federation (webpack)](https://webpack.js.org/concepts/module-federation/) · [Module Federation 2.0 estável (InfoQ, 2026)](https://www.infoq.com/news/2026/04/module-federation-2-stable/).
- **Registries privados (não-npmjs):** [comparação de artifact managers](https://cloudutsuk.com/posts/artifacts/comparing-artifact-management-solutions/).
- **IA — protocolos de agente + grafo:** [MCP + A2A + knowledge graphs + GraphRAG](https://medium.com/@visrow/a2a-mcp-knowledge-graphs-and-graphrag-for-next-generation-intelligent-systems-9954d9ded8ee) · [mapa de protocolos de agente 2026](https://www.digitalapplied.com/blog/ai-agent-protocol-ecosystem-map-2026-mcp-a2a-acp-ucp).
