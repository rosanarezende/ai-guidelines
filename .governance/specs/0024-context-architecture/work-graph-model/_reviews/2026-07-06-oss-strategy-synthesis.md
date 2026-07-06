# Síntese — estratégia open-source (control plane, produto/nome, extração, grafos, Google)

> **Frente:** Spec 0024 · work-graph-model · governance-demo
> **Data:** 2026-07-06 · **Tipo:** review de estratégia (não-autoridade; subordinado a `model.yml`/`APP-DECISIONS.md`)
> **Base:** branch `feat/spec-0024-artifact-taxonomy-and-model-review-contract`, HEAD `c934ade6`, PR [#45](https://github.com/rosanarezende/ai-guidelines/pull/45) (checks passing).
> **Researches irmãs:** [posicionamento/nome](../research/2026-07-06-oss-product-positioning-and-naming.md) · [control plane](../research/2026-07-06-control-plane-registry-options.md) · [extração](../research/2026-07-06-work-graph-model-extraction-strategy.md) · [grafos](../research/2026-07-06-open-graph-ecosystem-opportunities.md) · [Google/OSS](../research/2026-07-06-google-oss-programs-and-tools.md)
> **Escopo desta rodada:** só research/review/docs. Nenhum código de produto/teste/schema alterado.

## Veredito curto

A estratégia OSS **não exige nenhuma decisão irreversível agora**, e é bom que não exija. O trabalho já está arquiteturalmente pronto (packages `@demo/*`, backend hexagonal, file-first SSOT) para virar "core + app + CLI + docs + adapters" sem espaguete. As decisões de alto valor e **baixo risco** são: (1) fixar a postura "self-hostable primeiro, hosted opcional depois"; (2) eleger **Better Auth** como candidato primário do control plane a validar num spike; (3) cravar a tese de grafo "**portável entre backends**" com Neo4j Community **+ Apache AGE** como opções OSS; (4) adotar ferramentas de supply-chain neutras (OSV/deps.dev/OSV-Scanner) como checks. As decisões caras/irreversíveis (nome público, licença do app, repo separado, control plane hospedado) devem **continuar research-open**, agora com critérios objetivos para saírem disso.

FATO dominante: o repositório já respeita os três planos (`identity ≠ governance ≠ content`) e o file-first como SSOT. Nada na pesquisa justifica quebrar isso; tudo reforça.

## Decisões recomendadas (em ordem)

1. **Confirmar QRD-12 e QRD-13 como DECIDIDOS** (app = superfície humana OSS-first; CLI = headless; mesmo runtime). Já maduros.
2. **Postura de control plane:** "self-hostable primeiro". O 1º release entrega o control plane como software self-hostável (mesmo artefato do app), não como serviço operado por nós.
3. **Candidato de control plane = Better Auth** (MIT, roda no app TS, accounts/orgs/convites no próprio SQLite/Postgres) — **a validar em spike** antes de virar QRD decidido. Descartar Cloudflare D1 como SSOT (lock-in: sem export Postgres, single-writer).
4. **Tese de grafo:** "camada de governança em grafo, portável entre backends". 1º release = Neo4j Community **+ Apache AGE** (Apache-2.0, grafo no Postgres) como opções de `graph-read-model`; SQLite recursivo p/ grafos pequenos; **não** adotar Kuzu upstream (arquivado out/2025); FalkorDB/Memgraph/ArangoDB só como adapters opcionais (source-available, não OSI).
5. **Supply-chain:** adotar OSV-Scanner + OSV.dev + deps.dev como checks/adapters neutros; rodar OpenSSF Scorecard + OSPS Baseline nível 1 como baseline de maturidade.
6. **Taxonomia de produto (não o nome):** registrar os 5 corpos (core/packages · runtime · app · CLI · docs/adapters) e a licença-alvo por corpo (core permissivo; app a decidir).

## Decisões que ainda NÃO devem ser tomadas

- **Nome público do produto** e organização GitHub própria (decisão humana + checagem de disponibilidade npm/domínio/marca).
- **Licença do app/server** (AGPL vs permissivo) — depende de QRD-36 (hosted ou não).
- **Repo separado / extração física** — só quando os 6 gatilhos baterem (ver plano de fases).
- **Control plane hospedado por nós** — só com demanda real de convite cross-máquina.
- **Sigma vs ECharts** no console técnico — decisão de UX da owner, em QRD próprio.
- **IdP externo default** para `controlled` (Keycloak/Authentik/Zitadel-AGPL) — junto com QRD-20, depois.
- **ArcadeDB embedded** como default local (depende de aceitar runtime JVM).

## Riscos

**P0 (bloqueiam se ignorados):**

- **Mistura de planos.** Adotar Better Auth _deixando_ authority efetiva vazar para o control plane quebraria QRD-36. Mitigação: authority continua no reducer `@demo/domain`; control plane só guarda metadados; guard de import cruzado.
- **Grafo virar SSOT.** Qualquer adapter que aceite escrita governada no read-model viola QRD-16/`model.yml`. Mitigação: guard "read-model nunca é destino de escrita" + `sourceRevision`/fail-closed já provados.
- **Secrets de provider em payload/event-log/read-model** (SEC-13). Mitigação: contrato SEC-13 antes de qualquer código de auth.

**P1 (custo real se mal-timed):**

- **Fork prematuro** (repo separado antes de nome/licença/estabilidade) → dois repos, CI duplicado, sync caro.
- **Lock-in por conveniência** (Cloudflare D1 / Assured OSS-GCP entrando "porque é fácil"). Mitigação: regra explícita "portável primeiro".
- **Licença source-available** (BSL/SSPL) entrando como default de grafo por desempenho. Mitigação: AGE/Neo4j-Community/SQLite no default.

**P2 (observar):**

- Better Auth é projeto jovem — superfície de segurança própria a auditar antes de `controlled`.
- Kuzu forks (Vela/RyuGraph) ainda imaturos — não depender.
- AGPL no app afastaria adoção corporativa — pesar se hosted virar meta.

## Plano de migração/extração em fases

- **Fase 0 (agora):** decisões 1–6 acima; nenhum arquivo de produto movido. Baseline OpenSSF/OSV.
- **Fase 1 (nome+licença decididos):** _opcional_ — promover produto para pasta de 1ª classe via `git mv` (histórico preservado), reconciliando workspaces/`repoRoot`/guards/CI. Reversível.
- **Fase 2 (gatilhos batidos):** extrair para repo próprio via `git filter-repo --path governance-demo/ --path-rename governance-demo/:.` (histórico completo). Spec 0024 mantém a evidência histórica; registrar commit de corte no tracker.

**6 gatilhos objetivos para autorizar Fase 2:** (1) nome público decidido+disponível; (2) licença por corpo decidida; (3) fronteira `@demo/*` estável sem refactor estrutural por ≥ período definido; (4) checks focados verdes com `repoRoot` novo; (5) demanda real de contribuição externa ou decisão de release público; (6) control plane (QRD-36) resolvido o suficiente.

## Backlog de research/implementação

**Spikes (fora do caminho de produto, padrão visual-stack):**

- **S1 — Better Auth:** signup→org→convite→aceite com dados em SQLite; provar authority ainda vem do reducer, control plane não lê governance host, SQLite↔Postgres não muda contrato.
- **S2 — Apache AGE:** exportar read-model derivado p/ AGE no mesmo Postgres; paridade com adapter Neo4j nas queries de `graph.ts`; `sourceRevision`/fail-closed idênticos.

**Checks/adapters (implementação futura, após decisão):**

- SEC-13, APP-40, APP-41 como testes; guard de separação control-plane ↔ governance host.
- `osv-scanner` no CI; adapter deps.dev/OSV como evidence provider advisory (QRD-33).
- Exporter AGE espelhando exporter Neo4j; teste de paridade multi-backend.
- OpenSSF Scorecard job como evidência de maturidade.

**Docs:** taxonomia de 5 corpos + licença-alvo em `APP-PRODUCT-STATEMENT.md`; 6 gatilhos no decision-brief/tracker; nota supply-chain neutra em `POLICY-HANDBOOK.md`.

## Matriz "decidir agora vs pesquisar mais"

| Tema                              | Decidir agora                 | Pesquisar/validar mais                      |
| --------------------------------- | ----------------------------- | ------------------------------------------- |
| Natureza app / CLL (QRD-12/13)    | ✅ confirmar decidido         | —                                           |
| Postura control plane             | ✅ self-hostable primeiro     | operar casca hospedada (depende de demanda) |
| Auth/registry lib                 | ⚠️ Better Auth como candidato | cravar só após spike S1                     |
| Store do control plane            | ✅ vetar Cloudflare-D1 SSOT   | Postgres vs SQLite vs PocketBase p/ piloto  |
| Grafo 1º release                  | ✅ Neo4j Community + AGE      | ArcadeDB embedded; Sigma×ECharts (UX)       |
| Grafo source-available (BSL/SSPL) | ✅ fora do default            | adapters opcionais                          |
| Supply-chain (OSV/deps.dev)       | ✅ adotar como check          | OSS Rebuild (futuro)                        |
| Google Cloud/Assured OSS          | ✅ não-default                | —                                           |
| Taxonomia de produto              | ✅ registrar 5 corpos         | —                                           |
| Nome público                      | ❌                            | decisão humana + disponibilidade            |
| Licença do app                    | ❌                            | depende de QRD-36                           |
| Extração p/ repo                  | ❌                            | após 6 gatilhos                             |

## Prompt curto para a próxima rodada (se autorizado)

> Implementar **Spike S1 (Better Auth)** em rota interna fora da navegação de produto (padrão `/spikes/visual-stack`), sem tocar produto/governança. Provar, com testes: (a) signup→org→convite→aceite persistido em SQLite via Better Auth; (b) authority efetiva continua resolvida pelo reducer `@demo/domain` (control plane NÃO concede role/authority — APP-41); (c) nenhum dado do governance host entra no control plane (APP-40); (d) nenhum secret em payload/event-log/read-model (SEC-13); (e) trocar SQLite↔Postgres não muda contrato. Registrar evidência em `_reviews/`. Só depois abrir QRD de decisão do control plane. Não fazer commit/merge sem autorização; rodar os checks focados da `governance-demo`.

---

### Nota de método e limites

FATO vs INTERPRETAÇÃO foi mantido em cada research. Limite de confiança: meu corte de conhecimento é jan/2026; as buscas rodaram jul/2026 — fatos voláteis (licenças, aquisições como Kuzu/Apple, mudança do Zitadel p/ AGPL, convergência Auth.js→Better Auth) estão marcados com fonte e, quando não abri o arquivo LICENSE/anúncio primário, sinalizados como "não verificado na fonte primária". Nenhuma stack foi tratada como decisão por inércia; Cloudflare/Google/Neo4j foram avaliados com lock-in explícito. O read-model de grafo permanece projeção, não SSOT. Nenhuma decisão humana (nome, licença, extração, hosted) foi tomada por mim — todas ficam para o Human Gate.
