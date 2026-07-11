<!--
═════════════════════════════════════════════════════════════════════════════
METADADOS GOVERNADOS DO PR

Título:
  Deve seguir `.core/process/pr-title-conventions.md`.

Tipo do PR:
  Refletido no título por emoji/convenção:
  - 🧾 governance
  - 🛠️ execution
  - 🔗 integration
  - 🚑 fast-track

Perfis de PR body (contrato-base comum + perfil por tipo):
  Este arquivo é o perfil EXECUTION (default). Os demais perfis vivem em
  .github/PULL_REQUEST_TEMPLATE/ e são selecionáveis na criação do PR via
  query param ?template=governance.md | integration.md | fast-track.md.
  O governance-pr-check seleciona o contrato pelo tipo (role na topologia
  do state.yml + label fast-track) — não exige seções de outro perfil.

Stack:
  Refletida no título, branch, base/head e `state.yml § topology`.
  Não liste todas as opções no corpo visível.

Lifecycle:
  Draft/Ready é estado nativo do GitHub.
  Não duplicar como checklist visível.
  Ready ≠ merge autorizado (cf. ADR 0024).
  Antes de converter para Ready: npm run pr-ready:check -- --pr <n>
  (sequência canônica de fechamento: WORKFLOW.md § "Fechamento de PR").

Merge:
  Se a stack estiver em modo unit, este PR NÃO autoriza merge isolado.
  Human Gate pode autorizar próximo checkpoint sem autorizar merge em main.

Comentários HTML:
  São parte intencional do template.
  Não apagar automaticamente ao preencher.
  O humano pode limpar manualmente se quiser.
═════════════════════════════════════════════════════════════════════════════
-->

<!--
═════════════════════════════════════════════════════════════════════════════
GOVERNANÇA VISUAL

Visão pretendida:
  Preencher ao abrir o Draft PR.
  Mostra o problema e a solução pretendida.
  É a BASELINE de intenção do Draft: após preenchida (imagem + prompt),
  atualizações do PR body durante a implementação devem PRESERVÁ-LA —
  nunca reescrever/apagar para refletir o estado atual. Ela existe para
  ser comparada com "Valor entregue" ao final. Se a visão mudar
  excepcionalmente (decisão da owner), adicione um
  "Prompt complementar — atualização de visão pretendida" abaixo do
  baseline, sem apagar o original.

Valor entregue:
  Preencher ao final, antes de entregar para revisão final / Human Gate.
  Mostra o antes/depois real do slice entregue.

Seções por mutabilidade (enforçado por `npm run pr-body:update` — FU-1):
  Preservada por padrão: "Visão pretendida" (baseline do Draft).
  Atualizáveis na implementação: "Resumo", "Escopo", "Test plan",
    "Validação, evidências e checklist", "Cross-refs", "Disclosure de IA".
  Preenchida ao final: "Valor entregue".

Imagens:
  A imagem renderizada é recomendada, mas o prompt final paste-ready é o
  artefato mínimo preservado quando o gerador estiver indisponível.

Prompts complementares:
  Use um `<details>` separado para cada prompt complementar.
  Não usar `<details open>`.
═════════════════════════════════════════════════════════════════════════════
-->

## Visão pretendida

<!--
Preencher ao abrir o Draft PR.

Inclua:
- imagem principal, se já existir; e/ou
- prompt final paste-ready; ou
- briefing governado gerado por `pr-body:create`, apontando para o template
  versionado que deve produzir o prompt final.

Use o padrão versionado `.governance/visual-prompts/pr-intended-vision.prompt.md`
para gerar/refinar este prompt quando houver apoio de IA. Não escreva um prompt
solto sem explicitar problema, mudança pretendida, estado esperado, autoridade e
fora de escopo.

Objetivo: deixar claro o que este PR pretende entregar antes da implementação.

BASELINE: depois de preenchida, esta seção é preservada até o fim do PR —
atualizações de body (manuais ou por agente) não devem reescrevê-la nem
remover a imagem/prompt originais. Mudança excepcional de visão entra como
"Prompt complementar — atualização de visão pretendida", mantendo o baseline.
-->

![Visão pretendida do PR #45 — taxonomia de artefatos e revisão antes do código](https://raw.githubusercontent.com/rosanarezende/ai-guidelines/feat/spec-0024-artifact-taxonomy-and-model-review-contract/.governance/specs/0024-context-architecture/assets/pr-value-images/pr-45.png)

Arquivo versionado:
`.governance/specs/0024-context-architecture/assets/pr-value-images/pr-45.png`.

<details>
<summary><strong>Prompt final — visão pretendida</strong></summary>

```text
LANGUAGE CONSTRAINT: every visible word inside the generated image must be in Brazilian Portuguese (pt-BR). Do not render English labels. Keep code identifiers, branch names, file names, PR numbers and DEC/ADR ids exactly as written.

Generate a clean technical 16:9 infographic for PR #45 of ai-guidelines, titled "PR #45 — Taxonomia de artefatos e revisão antes do código".

Visual goal: show a governance repository moving from mixed artifacts to clear authority lanes. The image must be understandable without knowing the repository beforehand.

Layout: three horizontal zones from left to right, connected by thin arrows.

LEFT ZONE — "Hoje: artefatos misturados"
Render a compact workbench with documents/cards labeled:
- "pesquisa"
- "dogfood"
- "review"
- "decisão"
- "mapa visual"
- "handoff legado"
Add a small warning card: "Apoio pode parecer fonte da verdade".

CENTER ZONE — "Mudança pretendida"
Render organized classification rails with visible labels:
- "kind no frontmatter"
- "autoridade explícita"
- "model-review antes do código"
- "visão pretendida padronizada"
- "próxima etapa aberta com contexto"
Show that each rail points to the right use, not to a single bucket.

RIGHT ZONE — "Depois esperado"
Render humans and AI assistants consulting the correct lane:
- "state.yml / tasks.md / DEC / ADR = fonte da verdade"
- "research / dogfood / reviews = evidência"
- "mapas / site / imagens = projeção"
- "Ready / Human Gate / merge = decisão humana"
Add one outcome card: "Cada artefato declara o que é, qual autoridade tem e como deve ser usado".

BOTTOM AUTHORITY RAIL:
Use four small color-coded chips:
- "Fonte da verdade"
- "Evidência"
- "Projeção"
- "Decisão humana"
Make clear that projections never override governed state.

BOUNDARY CALLOUT:
"Fora deste PR: migração física do dual-root, merge em main e Human Gate automático".

Style: engineering documentation aesthetic, light background, compact cards, thin connector lines, restrained color palette, high contrast, no mascot, no vendor logos, no marketing hero composition, no decorative gradients. The image should feel like a precise architecture map for maintainers, not a product advertisement.
```

</details>

## Resumo

Este PR consolida a frente da Spec 0024 que modela o trabalho como grafo tipado e agora separa com clareza duas coisas que tinham se misturado: o **framework `ai-guidelines`** e o **produto Guilda** que nasceu como incubação dentro de `work-graph-model/governance-demo`.

O produto vivo foi extraído para o repo irmão `git@github.com:rosanarezende/guilda.git`. Neste PR, o antigo `governance-demo/` deixa de ser workspace executável do `ai-guidelines`; o conteúdo completo fica preservado como evidência histórica em `work-graph-model/_archive/guilda-incubation-2026-07/`, e o caminho antigo passa a ter apenas um tombstone.

Isso muda o contrato de leitura do PR: a antiga simulação continua valendo como aprendizado e evidência da Spec 0024, mas **não** como produto pronto, não como app a validar neste repositório e não como parte do test plan operacional do `ai-guidelines`.

O valor atual do PR fica focado no framework: artifact taxonomy, model-review contract, research index, PR/body governance, script contracts, mapa vivo do trabalho governado derivado de `state.yml`, e preservação auditável da trilha que originou Guilda.

Histórico preservado: durante a incubação, a simulação provou org Acme file-first, repos adotados com código MVP, resolvers fail-closed, backend file-first transacional mínimo, schemas Zod, testes de contrato, Better Auth como control plane separado, e superfícies React/Next/MUI. Esses artefatos agora são arquivo histórico neste PR e base de migração para o repo Guilda.

Nota de honestidade de produto: este PR **não** declara readiness do app Guilda. A owner ainda não validou o aplicativo como v1. O app, o desktop, o portal, o site, a marca e o dogfood do produto continuam no repo Guilda.

## Escopo

<details>
<summary><strong>Escopo técnico e limites</strong></summary>

<!--
Esta seção é recolhida de propósito: humanos veem primeiro Resumo, Valor
entregue, Test plan e riscos. Agentes/revisores podem abrir quando precisarem
auditar limites de implementação.
-->

### Dentro do escopo

- **Decisão de vocabulário (`[DEC-0024-G22]`)**: adotar **Spec › Frente › Checkpoint › Etapa › Tarefa** (`Frente` no lugar de `Fase`, como leitura derivada de `state.yml` — não SSOT); reconciliar a tensão estrutural do #45 (`sequence: 12` ⇒ é nó topológico ativo); projetar isso na V4 (`assets/spec-0024-map-v4.html`) e na leitura viva derivada de `state.yml`.
- Implementar a entrega nomeada do checkpoint: taxonomia de artefatos, contrato de model-review/pre-coding review, research index, governança de PR body e mapa vivo do trabalho governado.
- Materializar o checkpoint `checkpoint-artifact-taxonomy-and-model-review-contract`.
- Trabalhar somente o nó `artifact-taxonomy-and-model-review-contract`.
- Arquivar a sim file-first que nasceu em `work-graph-model/governance-demo/` para `work-graph-model/_archive/guilda-incubation-2026-07/`, preservando repos acme adotados, código MVP, contextos publicados, repo-work ack, registry de contratos, outcomes, trust-policy, runtime, frontend, mock-api, testes, packages, assets e docs.
- Manter `work-graph-model/governance-demo/README.md` como tombstone, apontando para o repo Guilda e para o arquivo histórico.
- Remover `governance-demo` da superfície executável do `ai-guidelines`: npm workspaces, scripts específicos e test plan ativo.
- Registrar a disposição em `work-graph-model/GUILDA-EXTRACTION-DISPOSITION.md`.
- Comandos mutáveis mecanizados nesta fatia: `proposal.create`, `triage.save`, `gate.decide`, `intent.activate`, `breakdown.apply`, `repo-work.ack`, `standalone.complete`, `contract.propose-revision`, `outcome.publish`, `verdict.accept`, `incident.declare` e `policy.break-glass`, com `base-revision`, authority resolvida, idempotency, nonce, escrita YAML atômica, lock global de comando, recovery marker e event-log append-only.
- Exemplos derivados de backend nos quatro formatos estudados (`file`, `neo4j`, `sqlite`, `mongo`), com file/Neo4j priorizados para smoke.
- Sanitização documental de `model.yml`, `tracker.md`, `features.md`, `app-requirements.md`, README/NEXT-STEPS/handoff da sim v3.
- Catálogo versionado de adapters externos opcionais em `work-graph-model/integration-catalog.yml` + explicação em `integration-catalog.md`, incluindo assistentes locais/cloud, knowledge assistants, coding-agent channels, FinOps/custo, deploy/release evidence e gateways agentivos adiados.
- Primeiro adapter mecanizado do catálogo: `GET /api/integrations/assistant/ollama/health`, restrito a loopback, consultando só `/api/tags` e retornando resultado tipado com `messageKey`.
- Manter a stack em modo unit, com base em `feat/spec-0024-co-flow-continuation` e head `feat/spec-0024-artifact-taxonomy-and-model-review-contract`.

### Fora do escopo

- Merge em `main`.
- Human Gate automático.
- Backend transacional write-capable para SQLite/Neo4j/Mongo.
- Backend transacional multi-store write-capable além da sim file-first.
- Tornar qualquer ferramenta externa SSOT ou autoridade de mutação.
- Automação que decide gate sem humano.
- Declarar Guilda como app v1 validado ou produto pronto para release.
- Continuar desenvolvimento de app, desktop, portal, site, marca ou assets de Guilda dentro deste PR.
- Hospedar o portal público da mantenedora, decidir billing ou assumir senha de usuário final.

</details>

## Valor entregue

<!--
Preencher ao final, antes de entregar para revisão final / Human Gate.
Mostra o antes/depois real do slice entregue (sintomas → capacidades).
Em Draft este slot pode permanecer como placeholder.
-->

Implementado/preservado nesta fatia:

- Artifact taxonomy e model-review contract permanecem como entrega viva do framework.
- `[DEC-0024-G25]` reconciliou a linguagem: "Spec" permanece como invólucro histórico/caminho físico, enquanto novas projeções usam "trabalho governado" e "work graph".
- `assets/spec-0024-map-v5.html` preserva a leitura humana/manual do PR #45, e `assets/governed-work-map-data.json` + `assets/governed-work-map.html` viram projeção gerada de `state.yml`, validada por `npm run governed-work-map:check`.
- A incubação Guilda foi extraída da superfície executável do `ai-guidelines` e preservada em `_archive/guilda-incubation-2026-07/`.
- `governance-demo/` virou tombstone, não workspace.
- `package.json`, `package-lock.json` e script contracts deixam de carregar workspaces/scripts da antiga demo.
- `model.yml`, `tracker.md`, `features.md`, catálogo de integrações e docs de arquivo passam a apontar a incubação como evidência histórica.
- O PR body deixa de instruir revisores a rodar comandos em `governance-demo`.

Histórico preservado da incubação:

- Runtime file-first deixou de ser só leitura: `proposal.create`, `triage.save`, `gate.decide`, `intent.activate`, `breakdown.apply`, `repo-work.ack`, `standalone.complete`, `contract.propose-revision`, `outcome.publish`, `verdict.accept`, `incident.declare` e `policy.break-glass` executavam em comando governado, falhavam fechado por `base-revision` stale e registravam event-log.
- File backend ganhou transação mínima: lock global por comando, escrita atômica por temp+rename, append real em `events.jsonl`, replay por event-log e marker `.runtime` que bloqueia nova mutação após crash entre write e evento.
- `verdict.accept` do `intent-cta-upgrade` foi executado no estado canônico via runtime, criando `acme-governance/decisions/verdicts.yml` e `acme-governance/events/events.jsonl`.
- `intent-checkout-stack` teve sete repo-work acks fechados como `done` via runtime e publicou `out-checkout-stack-2027h2` com `contract-revisions: [acme-user-context@v4]`.
- `fix-checkout-timeout`, follow-up de `incident:incidente-checkout`, foi fechado via `standalone.complete` com evidência repo-local e publicou `out-fix-checkout-timeout-2027h1` contra `tgt-sre-incidents`; outcome de standalone aberto agora falha fechado.
- Sidecars repo-local entram na revisão fonte: triages, repo-work claims e repo-contract registries agora participam de `currentRevision()`.
- App Next/MUI cobria a navegação ponta-a-ponta do grafo e consumia API routes sobre a runtime da demo; essa superfície agora pertence ao repo Guilda.
- Adoption shell foi promovido para contrato de modelo e código: conta local, múltiplos workspaces, governance host, pessoas/memberships, fontes de trabalho e perfil vivem em tipos compartilhados, não em estado improvisado da tela.
- Durante a incubação, facades antigos de `frontend/lib` foram removidos; o app passou a consumir `@demo/domain`, `@demo/contracts` e o SDK server-side curado. Essa superfície foi extraída para o repo Guilda e não é mais workspace ativo deste PR.
- Durante a incubação, `GET /api/integrations/assistant/ollama/health` validava integração local gratuita/open-source sem egress de contexto; o check do app garantia que a rota usava `/api/tags` e não endpoints de geração/chat/embeddings. Esse teste agora é histórico da extração.
- Durante a incubação, `tools/checks/check-governance-app.ts` provava snapshot + `next build` + guards de fronteira; a suíte `test:e2e` cobria jornadas e contratos funcionais. Esses checks pertencem ao repo Guilda daqui em diante.
- Dependências de build auditadas: `npm audit --audit-level=moderate` fica sem vulnerabilidades com overrides explícitos de `esbuild` e `postcss`.
- Documentação de estado atualizada: o app segue incubado na sim/spec; o primeiro backend transacional file + event-log/lock já está provado; Neo4j fica read-model derivado por padrão; authoring completo começa no Next/MUI; capability extraction continua assistiva; o perfil compact detecta/revisa dangerous mutations em cadência; adapters externos entram como evidence providers/importers/projections/assistant channels.
- `model.yml` e `tracker.md` deixam de apontar para o layout v2 `registers/candidates` como estrutura ativa e passam a refletir o intake físico da sim v3.
- `integration-catalog.yml` separa assistant runtime, knowledge assistant, coding-agent channel e agent gateway deferred; OpenClaw-like gateways ficam adiados até delegação formal, sandbox, isolamento de secrets e auditoria.
- Limite declarado: o app ainda não implementa backend transacional multi-store write-capable; a runtime v3 prova file-first antes de SQLite/Neo4j/Mongo write-capable.
- Spike S1e de control plane: Better Auth HTTP persiste invite/accept em SQLite com 2 usuários, 2 sessões, 1 organização, 2 memberships e 1 convite aceito; a fronteira fica explícita (`invitedUserOperatedGitHub=false`, `governanceAuthorityGrantedByPortal=false`, `contentPlaneRead=false`).
- PostgreSQL não é simulado como verde: `runBetterAuthPostgresPortalLiveSpike()` só executa com `GOVERNANCE_PORTAL_POSTGRES_URL` + `GOVERNANCE_PORTAL_POSTGRES_SPIKE_APPLY=1|true`; sem isso, o relatório fica `skipped-*` fail-visible.
- APP-45 e APP-23 foram ativados durante a incubação, mas agora são histórico da extração e devem evoluir no repo Guilda.

<details>
<summary><strong>Prompt final — valor entregue</strong></summary>

```text
Crie um quadro visual de valor entregue para o PR #45 da Spec 0024 do repositório ai-guidelines.

Objetivo da imagem:
mostrar, de forma clara e auditável, que o PR deixou de validar um app incubado como se fosse produto final e passou a entregar o framework de governança que a Spec 0024 precisava: taxonomia de artefatos, contrato de model-review/pre-coding review, research index, governança de PR body, script contracts e mapa vivo do trabalho governado derivado de state.yml.

Estrutura visual:
- Título principal: "PR #45 — Taxonomia de artefatos e revisão antes do código"
- Subtítulo: "Framework ai-guidelines focado em governança; Guilda preservada como produto extraído."
- Três colunas:
  1. "Antes": work-graph-model misturava framework, produto Guilda, app demo, validação de telas e experimentos de graph/workflow.
  2. "Agora": ai-guidelines entrega contratos governados do framework; Guilda foi extraída para repo irmão; governance-demo virou tombstone; a incubação foi preservada em arquivo histórico.
  3. "Próximo": Technical Audit, Architectural Review e Human Gate decidem o próximo movimento da stack, sem declarar o app Guilda como v1 pronta e sem merge isolado em main.

Elementos de evidência:
- state.yml como fonte estrutural do mapa vivo.
- artifact taxonomy + model-review contract como entrega central.
- research index e script contracts como checks governados.
- pull-requests/pr-45/body.md como PR body reconciliado.
- work-graph-model/_archive/guilda-incubation-2026-07/ como histórico preservado.
- work-graph-model/governance-demo/README.md como tombstone.

Tom visual:
governance-first, repo-first, técnico mas legível para decisão humana. Use metáfora de grafo/fluxo de trabalho, trilha auditável e separação de planos. Evite parecer dashboard de produto Guilda pronto, landing page comercial ou tela de app validada. Não usar medieval literal, mascotes, robôs, estrelas de IA, SaaS genérico ou promessas de automação autônoma.

Mensagem central:
"Produto incubado preservado. Framework governado entregue. Próximo movimento depende de revisão técnica, revisão arquitetural e Human Gate."
```

</details>

<details>
<summary><strong>Prompt complementar (opcional — um detalhe por bloco)</strong></summary>

```text
Não usado nesta rodada. O prompt final acima é suficiente para gerar a imagem de valor entregue; prompts complementares só devem ser adicionados se a owner pedir refinamento visual específico.
```

</details>

## Test plan

<!--
Como o reviewer valida? Comandos chave + 1-2 observações.
Para runtime/wizard/UX: explique o caminho de uso real, não apenas "tests green".
Para governance: cite os artefatos que mudam de estado (DECs, ADRs, status agregado).
-->

```bash
npm run build
npm run script-contracts:check
npm run artifact-kind:check
npm run research-index:check
npm run governed-work-map:check
npm run validate:changed
npm run validate
git commit   # pre-commit: lint-staged + script-contracts/runtime sync + build + test:unit
git push     # pre-push: validate:changed
```

## Validação, evidências e checklist

### Evidências e gates

- Technical Audit: pendente — será executada antes de qualquer Ready/Human Gate.
- Architectural Review: pendente — será executada depois da auditoria técnica e antes do Human Gate.
- Human Gate: pendente — decisão reservada à owner; não é autorização de merge.
- Merge: fora do escopo deste PR individual; a stack segue em modo unit.
- CI: estado do PR reconciliado via GitHub nesta revisão — `governance-pr-check`, `validate-changed`, `repo-validation`, `smoke`, `osv-scan`/OSV-Scanner e Cloudflare Pages verdes; `scan-full-advisory` e `validate-os` aparecem como skipped esperado. Repetir a reconciliação no HEAD final antes de Ready.

### Checklist operacional

- [x] Formatação verde
- [x] Validação canônica verde
- [x] Commits atômicos
- [x] Sem secrets, credenciais ou contexto pessoal vazado
- [x] PR body atualizado com estado real
- [x] Fora de escopo registrado

## Cross-refs

- **Spec**: 0024
- **ADRs aplicáveis**: ADR 0018, ADR 0021, ADR 0022, ADR 0025, ADR 0026
- **DECs aplicáveis**: DEC-0024-G21, DEC-0024-G22, DEC-0024-G24, DEC-0024-G25
- **Issues/PRs relacionados**: Nó anterior: `co-flow-continuation`; nó ativo: `artifact-taxonomy-and-model-review-contract`

## Disclosure de IA

Implementação assistida por IA.

<!--
A linha acima é EDITORIAL — frase padrão do template, editável. Não é dado
governado, schema nem check. Se este PR for puro-humano, edite/remova.

Os FATOS DE PROCESSO abaixo são DERIVADOS de reviews/gates via topologia
(G07), não escritos à mão. Para PRs de spec, gere e cole dentro dos
marcadores:

  npm run disclosure
-->

<details>
<summary><strong>Disclosure derivado (fatos de processo)</strong></summary>

<!-- fatos-derivados:início -->
<!-- (cole a saída de `npm run disclosure`; vazio até haver revisão registrada em artefato) -->
<!-- fatos-derivados:fim -->

</details>

<details>
<summary><strong>Notas qualitativas (opcional — divergências, segunda opinião, nuance)</strong></summary>

<!--
Só o que a evidência derivada NÃO captura (julgamento humano):
- divergências documentadas (onde escolheu A vs B, citação do raciocínio);
- gates humanos por commit (CORE-07/14).
-->

</details>
