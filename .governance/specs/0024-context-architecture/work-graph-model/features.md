# Features a implementar — roadmap da frente work-graph

> **O modelo prevê TODOS os fluxos; a construção se faseia aqui** (princípio da [Lente 1](tracker.md)). Este doc lista o que **modelamos** e ainda falta **implementar** — pra não confundir "fora do modelo" com "ainda não construído". Não-autoridade; alimentado junto com o [`tracker.md`](tracker.md) e as [`deliberation/`](deliberation/).
> Legenda: **P0** = base da taxonomia v2 (destrava o resto) · **P1** = lifecycles/dimensões core · **P2** = escala/enterprise. ✅ feito · 🚧 parcial · ⬜ a fazer.

> **Nota 2026-07-02:** a frente ativa de prova saiu da sim v2/\_lib para a [`_org-simulation-v3/`](_org-simulation-v3/) repo-first. Nela, o host central fica em `acme-governance/`, os repos adotados ficam em `repos/<repo>/`, e os templates operacionais da sim ficam em `_org-simulation-v3/_templates/`. O `_templates/` raiz virou ponte histórica; os moldes v2 foram arquivados em `_archive/templates-v2/`.
>
> **Correção importante:** "ativo na v3" NÃO significa "tudo da v2 foi migrado". A v2 provou `_lib` DDD, portas, adapters file/sqlite/neo4j/mongo, read-models por repo e app de autoria. A v3 ainda NÃO tem essa camada; hoje ela usa scripts determinísticos + `graph.js` gerado. Esses aprendizados ficam preservados abaixo como itens a portar, não como feitos da v3.
>
> **Contrato da próxima fatia de app:** [`app-requirements.md`](app-requirements.md) consolida requisitos de dados, backend, frontend, assistência por IA e robustez para a aplicação ponta-a-ponta. O `model.yml` continua sendo o SSOT; o documento de requisitos orienta a implementação.

---

## Matriz v2 → v3 — o que foi migrado, preservado ou ainda falta

| aprendizado/feature da v2                           | estado na v3                                                                                                      | decisão / próximo passo                                                                                                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.governance/` por repo + host agregador            | ✅ migrado e endurecido: `repos/<repo>/.governance/*` + `acme-governance/*`                                       | manter como base física.                                                                                                                                  |
| `context.json` publicado e agregado pelo host       | ✅ migrado e endurecido: freshness contra manifest/package/src + `repo-context-*`                                 | próximo dente: envelope/ttl/producer real no `context.json`, não só `contentHash`.                                                                        |
| Manifesto/capabilities por repo                     | ✅ migrado com `manifest.yml`, `capability-candidates.yml` e pacote de capability review                          | falta mecanismo de `owner-attested-by`/`observed-from` com dente real.                                                                                    |
| Matcher léxico/local/LLM/API                        | 🚧 preservado conceitualmente; v3 só tem routing fixture e pacote de capability review, sem matcher executável    | portar depois da estabilização do manifesto v3: matcher deve consumir `context.json`, respeitar L9 e produzir saída com score/unknown/evidence/freshness. |
| `_lib` DDD (`domain`, `ports`, `adapters`)          | ⬜ não migrado para v3                                                                                            | portar como próxima camada de runtime, sem substituir os YAML: domínio puro + portas para host/repo/projection, reaproveitando invariantes do `org.mjs`.  |
| Backends plugáveis file/sqlite/neo4j/mongo          | ⬜ não migrados para v3; existem só na v2                                                                         | preservar prova v2; reintroduzir em v3 só quando houver contrato de porta sobre os nós v3 (`objective/intent/repo-work/outcome/contract/policy`).         |
| Read-models `db.json` por repo + dashboard estático | ⬜ não migrados; v3 usa `context.json`, repo-work/contract registries e `_apps/graph.js` gerado                   | decidir se v3 precisa read-model por repo ou se `context.json` + registries publicados bastam; não declarar banco derivado v3 enquanto isso não existir.  |
| App de autoria registro→triagem→gate                | ⬜ não migrado; v3 tem apps de visualização (`owner`/`company`), não authoring UI                                 | futuro: app de autoria deve escrever por comandos/envelope, não editar YAML solto nem contornar o validador.                                              |
| Scaffold de repo novo                               | 🚧 v3 tem `adopt-existing-repos.mjs` para repos já existentes; não tem scaffold completo de repo novo/backend     | manter foco "empresa já tem repos"; se voltar scaffold, separar `adopt existing` de `create new`.                                                         |
| Backend.yml por repo                                | ⬜ modelado em `physical.por-repo`, mas sem executor na v3                                                        | ou remover do layout v3 até portar adapters, ou manter marcado como "modelado, não implementado"; hoje NÃO pode ser aceito como evidência.                |
| Templates v2 de work/brief/closing                  | 🧊 arquivados em `_archive/templates-v2`; v3 usa `_org-simulation-v3/_templates` apenas para prompts/artefatos v3 | não usar `_templates/` raiz como fonte ativa.                                                                                                             |
| Deliberação q/r/d interna por work/repo             | ⬜ não migrada para v3 física                                                                                     | quando voltar, precisa morar no repo/host correto e projetar só o resultado necessário, não todo histórico privado.                                       |
| Projeção visual                                     | ✅ migrada de outra forma: `_apps/graph.js` + owner/company apps sem build                                        | é uma projeção de sim, não um backend operacional.                                                                                                        |

---

## P0 · Migrar o modelo p/ a taxonomia v2 (destrava tudo)

- ⬜ **`model.ts`: famílias + membros** — `WorkKind` (5) → `delivery`/`maintenance` (CAPACIDADE) + mover `experiment`/`exploration` (APRENDIZADO), `incident` (RESPOSTA), `proposal`/`register` (INTAKE). Colapsar `fix`+`patch` em `maintenance`.
- ⬜ **Dimensões no domínio** — `source` · `visibility` · `maintenance-mode` · `change-class` · `service-class` · `planned-in` (ortogonais; opcionais no modelo, exigidas conforme a família).
- ⬜ **Presets (UX)** — "fix"/"security patch"/"bump de dep"/… → preenchem família + dimensões. Alias, não ontologia.
- ⬜ **Migração da sim + templates** — os `registry-entry`/briefs; migrar os works existentes (login) p/ a forma nova.
- ⬜ **Tirar `incident` das promoções planejadas** (proposal `promote-to`, breakdown) — incident nasce por gatilho.

## P0 · Integridade transacional & segurança (o envelope — o que torna o file-first confiável)

_(Da auditoria rodada 3 — o buraco sistêmico. Ver [Lente 8](tracker.md) + [`_audits/`](_audits/).)_

- ⬜ **Envelope universal** em toda mutação/publicação: `actor` · `authority` · `base-revision` · `command-id`/`idempotency-key` · `revision`/`etag` · `schema-version` · `source-commit` · `generated-at` · `ttl` · `invalidates`.
- ⬜ **Classificação & egress** — `classification` (public/internal/confidential/restricted) + `visibility/access` por nó; a escolha do matcher **léxico-local × API externa** se **amarra à classificação** (sensível não sai da máquina) + redaction.
- ⬜ **Gate append-only + reversal** — `gate-decision` + `gate-reversal` + nova decisão; nunca overwrite.
- ⬜ **`explore-resolution` ≠ gate** — renomear a derivada (`deriveGovernance`) p/ `unanswered|answered|pursued|not-pursued`; `accepted/rejected` só pro humano.
- ⬜ **Stale-invalidation** — triage/gate guardam `base-revision`/digest do register; mudança **invalida** ou exige re-triagem.
- ⬜ **Move idempotente com recuperação** — `promote`/`discard` como transação (`command-id`); falha no meio → retoma sem intent-órfã; lock curto por candidato.
- ⬜ **`GlobalRef` + tombstone** — `family:namespace/id#anchor@revision`; random maior; tombstone p/ descartados; resolver desambiguador (candidate/intent/archived) + colisão.
- ⬜ **Contrato = nó versionado** — owner/provider/consumers/compatibility/lifecycle/change-windows (não string); referenciado por GlobalRef.
- ⬜ **`context.json` com envelope** — schema-version/source-commit/producer/ttl/hash; o host **valida** ao agregar.
- ⬜ **Matcher accountability** — o gate registra `followed|overrode` + rationale; a sugestão fica versionada (score/why/unknown/freshness).

## P0 · Confiança, política & red-team (Lente 9 — o que a autocertificação não resolve)

_(Da auditoria rodada 4. Ver [Lente 9](tracker.md) + [`_audits/round-4-trust-boundaries.md`](_audits/round-4-trust-boundaries.md). **Segurança precisa de controle NORMATIVO versionado**, não "inspira-não-define".)_

- ⬜ **Artefatos de política governados:** `threat-model.yml` · `egress-policy.yml` · `agent-delegation-policy.yml` · `policy-catalog.yml` · `red-team-corpus/` (register malicioso · capability envenenada · prompt injection).
- ⬜ **Trust boundary de 1ª classe** — modelar onde a confiança termina, quem atravessa, com qual prova (matcher/agente/backend/API são fronteiras).
- ⬜ **Egress por taint/classificação derivada** — nó que usa contexto restrito herda **teto de egress**; matcher externo só recebe fatias aprovadas por política (fecha o vazamento por **inferência**).
- ⬜ **Matcher como input hostil** — validação estrutural da saída do matcher/agente; nunca vira ação direta; harness de red-team no CI.
- ⬜ **Delegação formal do agente** — `actor=agent` → principal humano · workload-id · escopo · TTL · policy-id · max-mutations · confirmação-humana p/ gate/egress/escalation.
- ⬜ **Verificação vs autocertificação** — trusted-producers · provenance (SLSA/transparência) · policy-check antes de aceitar `context.json`. **Capability** com `evidence`/`owner-attested-by`/`observed-from`/`last-verified` (IA só abre PR).
- ⬜ **Anti-gaming (invariantes + quotas)** — `expedite` budget por time · `incident` exige evento/severidade/telemetria · downgrade de `classification` exige approver separado.
- ⬜ **Hardening dos backends/matchers** — allowlist · secrets fora do YAML · least-privilege no DB · TLS/pin fora da sim · CLI-delegate em **sandbox** (sem rede/home/tokens). _(sim atual: `simsim123`/CORS `*`/`/match` client-config — só p/ sim.)_
- ⬜ **Retenção & remoção** — `retention-class` · `purge-redaction-event` · anexos fora do git · secret-scanning antes de publicar contexto (append-only/tombstone × direito de remoção).

## P0/P1/P2 · Achados da simulação adversarial (red-team 2026-07-01)

_(Da sim adversarial rounds 1+2 — [deliberação](deliberation/2026-07-01-adversarial-simulation-red-team-deliberation.md). Veredito: o modelo está **sub-mecanizado, não over-engineered**. **Barra:** um controle só conta como enforcement quando especifica **resolver/invariante + fail-closed + evidência independente** — "controle nomeado" (acima) sem mecanismo ainda é cerimônia. Nada a **podar**; as 3 leis viram princípios na [Lente 9](tracker.md).)_

**P0 — dar dente (cerimônia = perigo):**

- ⬜ **A1 · contrato de aceitação do matcher** — a saída do matcher/agente só vira ação com evidência exigida · `unknown` · threshold · **comparação com capability/contrato** (afia o "matcher como input hostil" acima; advisory+gate humano sozinho ainda é carimbo).
- ⬜ **B1 · evidência mínima com dente** — capability sem `owner-attested-by` **independente** / `evidence` / `observed-from` fresco → **excluída ou `unknown`** (não usada com peso igual). A _verdade_ semântica fica advisory + drift (rebaixada).
- ⬜ **C2 · anti-replay da delegação** — revogação/nonce/TTL por `authority-ref` (idempotência L8 só barra duplicata, não replay pós-expiração).
- ⬜ **D1 · fallback local rastreável** — quando o egress externo é bloqueado, oferecer alternativa local útil **e registrar o bloqueio** (Lei do fallback: senão o humano faz egress-sombra manual).
- ⬜ **D2 · ACL por edge/consulta (deputy local)** — `visibility/access` no host por consulta/aresta, não só na saída p/ API externa (bloquear leitura lateral `restricted` entre repos).
- ⬜ **E1 · invariantes de conteúdo** — validar `context.json` assinado contra código/contratos/fonte (provenance prova origem, não verdade; conteúdo org-wide).
- ⬜ **F2 · telemetria verificável no incident** — `incident` exige **referência verificável** a alerta/SLO (não texto de severidade) como **pré-condição de declaração**.
- ⬜ **F3 · break-glass** — todo controle anti-gaming que bloqueia emergência precisa de caminho break-glass rastreável (TTL + review post-facto); a _existência_ do caminho é modelo, o _threshold_ é policy-pack.
- ⬜ **H1 · prevenção de segredo (pre-commit)** — secret-scan **pre-commit/pre-receive/quarantine** + purge de VCS/projeções (a reclassificação tardia não recupera git/archive/cache).
- ⬜ **X · separação de deveres (SoD)** — `authority` carrega independência de 1ª classe: `requester ≠ approver ≠ owner-attester` p/ ações sensíveis (não só papel nominal).
- ⬜ **O1 · independência do oráculo** — `red-team-corpus`/`policy-catalog`/expected-outcomes com autoria/aprovação **independente** dos atores que governam (o SoD no meta-nível).

**P1:** ⬜ A2 (fetch/scan/egress de link externo) · ⬜ B2 (detecção de capability **subdeclarada** via `observed-from`×provides/código) · ⬜ C3 (risk-budget agregado/amostragem além do `max-mutations`) · ⬜ E2 (revogação/expiração de trusted-producer + namespace-reuse) · ⬜ G2 (bloquear ação sobre projeção derivada **stale** sem `source-revision` atual) · ⬜ H2 (`invalidates` inclui `policy-revision`).

**P2:** ⬜ G1 (adapter-contract de import Jira/Linear: campo autoritativo/direção-sync/resolução/freeze-window) · ⬜ H3 (migrator-registry + fail-closed + log de perda semântica no salto de schema).

**MOVER → policy-pack (config, não ontologia):** quota exata de `expedite` (F1 — o **contador** fica no modelo) · scoring/amostragem (C3) · regras finas de break-glass (F3).

## P1 · Lifecycles próprios (cada família com o seu)

- ⬜ **`experiment` — lifecycle operacional:** `experiment-brief` sela **hipótese + métricas**; roda atrás de **feature-flag** com **exposição · guardrails · duração · decision-rule**; fecha em **`experiment-outcome`** (won/lost/inconclusive) + **cleanup** (flag/variante morta). `won → delivery`.
- ⬜ **`incident` — lifecycle dedicado (RESPOSTA):** **severidade** · **declarar** (destrava merge/CI com **prazo**, blameless) · **mitigar** · **resolver** · **postmortem** (garantido por **alerta**) → gera `fix`/`maintenance`/`proposal`. + arestas `occurred-during`/`caused-by`/`related-to`.
- ⬜ **`maintenance` — modos:** `maintenance-mode` (corrective/adaptive/perfective/preventive, ISO 14764) + `reason`/`impact` (anti-buraco-negro).
- 🚧 **`exploration` — endurecer:** timebox (✅ tem) + **pergunta falsificável** + **stop-rule** + `fate` obrigatório. Disparar a exploration **de verdade** no work-repo (hoje a triagem só registra a disposição).
- ⬜ **Enforcement das dimensões** — cada dimensão afeta **workflow · lint · dashboard** (senão vira tag decorativa): ex. `change-class: emergency` destrava bypass; `service-class: expedite` prioriza; `security-visible` exige revisão.

## P1 · Triagem, matcher & métricas

- 🚧 **Matcher com contrato de confiança** — persistir **score + explicação + threshold + "unknown"** (fallback) + **freshness** da capability + escalonamento de owner. (Simulação já existe; falta o contrato.)
- ⬜ **Gerador de capabilities** (skill/CLI) — apoia a IA a escrever/atualizar as capabilities dos manifestos (a **alavanca** da qualidade do match).
- ⬜ **Métrica de tempo-bloqueado** (`needs-info`) — vista derivada: **quem** segura e **por quanto tempo** (a dor do remoto, medível).
- ⬜ **Confirmar/anexar** as conexões sugeridas (hoje a sugestão só é exibida).

## P1 · Release, entrega & acompanhamento

- ⬜ **`release ≠ merge`** — separar o merge do **release**: rollout gradual/**canary** · **rollback** · feature-flag · **janela de verificação** (o momento "acompanhar" ganha dentes).
- ⬜ **Anexos** (além de links) na iniciativa (upload).

## P2 · Governança de portfólio & escala (enterprise)

- ⬜ **Capacidade / WIP / classes of service** — limites, aging, políticas explícitas (Kanban).
- ⬜ **Priorização entre iniciativas** — RICE/ICE no nível do portfólio; roadmap.
- ⬜ **SLA / dono de fila / escalonamento** na triagem (aging + escalation).
- ⬜ **SLO / error-budget / observabilidade** — manifestos ligam a **SLIs/SLOs · alertas · dashboards**; alertas **disparam** incident.
- ⬜ **RACI / accountability** — accountable por fila, contrato, serviço, incidente, decisão, pós-ação.
- ⬜ **Event-log append-only + resolver estável + snapshot publicado assinado** — o file-first ganha trilha semântica de domínio (além do git), concorrência e consulta operacional.
- ⬜ **Query-API / provenance / envelope de tarefa-artefato p/ agentes** (MCP/A2A) — o grafo consultável por IA com permissões.

## Backend & app (infra do modelo)

- ✅ **Nova simulação robusta sobre a taxonomia v2** — `_org-simulation-v3` é a frente ativa repo-first; `_org-simulation-v2` permanece como histórico/fonte de aprendizados de matcher/app/backend.
- ✅ **Especificação do app ponta-a-ponta** — [`app-requirements.md`](app-requirements.md) define a aplicação alvo antes da implementação: modelo operacional, command pipeline, read-models, UI por persona, assistências de IA e critérios de aceite.
- ⬜ **Portar a `_lib` DDD para v3** — domínio puro + portas sobre os nós v3 (`business-objective`, `intent`, `repo-work`, `contract`, `outcome`, `policy`), sem reimportar os 5 kinds antigos.
- ⬜ **Porta de repositório v3** — separar `HostGovernanceRepository`, `ProductRepoProjectionRepository` e `PublishedProjectionStore`; scripts atuais (`org.mjs`, `repo-*.mjs`) viram harness/fixtures ou adaptadores file.
- ⬜ **Backends plugáveis v3** — file primeiro; depois sqlite/neo4j/mongo sobre a MESMA porta. O critério de pronto é: validações/adoption-journey passam sem mudar domínio nem resolvers.
- ⬜ **Read-model v3 derivado** — decidir formato (`db.json`, SQLite, Neo4j ou `graph.js` como snapshot) e declarar qual projeção é operacional versus só visualização.
- ⬜ **Matcher executável v3** — portar o espectro léxico/local/API da v2 para consumir `context.json` v3 e produzir saída fail-closed (`score`, `unknown`, `evidence`, `freshness`, `policy/egress`).
- ⬜ **Authoring app v3** — substituir o app v2 por uma UI/CLI que escreve via comandos/envelope e nunca por mutação YAML direta.
- ⬜ **Revisitar a D3** (arestas cross-repo derivadas) à luz de `repo-contract`, `repo-work-ack` e `contract-revision-proposal` da v3.
- ⬜ **Aposentar o `_viewer`/`_app` legado** só depois que a v3 cobrir autoria + runtime; até lá, são arquivo histórico, não fonte ativa.

---

## Já entregue nesta frente (contexto)

✅ **v2 entregue/preservada como aprendizado:** modelo file-first + banco derivado + backend plugável (4 paradigmas) · matcher advisory (léxico/LLM local/API) · app `_app` com fluxo registro→triagem→gate→ativação · estrutura `registers/{candidates,archived}` + `intents/` com `promote`/`discard` · deliberações q/r/d.

✅ **v3 entregue/ativa:** host `acme-governance/` + repos adotados `repos/<repo>/` · código MVP por repo · manifests/contextos publicados · repo-work ack com lifecycle · repo-contract registry · outcome resolver · trust-policy física · graph/company/owner apps · red-team/adoption-journey. **Ainda não entregue na v3:** `_lib` DDD, backends plugáveis, read-model operacional por banco, matcher executável e authoring app.
