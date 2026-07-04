# Org simulada v3 — a acme de ponta a ponta (a "virada de chave")

> **O que é:** a org-exemplo da P12 (acme — 2 objetivos · 2 áreas · 5 times · 13 repos · 3 contratos · 7 intents · 3 reativos) instanciada como **arquivos de verdade**, com **validador executável**, runtime file-first e app operacional Next/MUI. Decidida pela owner em 2026-07-02: "quero começar a validar de ponta a ponta".
>
> **Autoridade:** o MODELO mora em [`../model.yml`](../model.yml) (SSOT v2 limpo aplicado). Esta sim **valida** o modelo — quando a sim contradiz o modelo, ou se corrige a sim, ou se abre provocação no modelo. Substitui a `_org-simulation-v2` como frente ativa; a v2 está fisicamente arquivada em [`../_archive/org-simulation-v2`](../_archive/org-simulation-v2). Os protótipos estáticos F3/F4 da v3 estão em [`../_archive/org-simulation-v3-static-apps-v1`](../_archive/org-simulation-v3-static-apps-v1); a superfície ativa é [`frontend/`](frontend/). Próximos passos operacionais: [`NEXT-STEPS.md`](NEXT-STEPS.md).

## O plano ponta-a-ponta (fases)

| fase | entrega                                                                                                                                                                                                                                                                                                                                             | status |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| F0   | fechar a fase de iteração do flow-explorer (commit selado)                                                                                                                                                                                                                                                                                          | ✅     |
| F1   | **a org file-first** — `acme/governance/` como host central (`business/`, `contracts/`, `intake/`, `intents/`, `decisions/`, `incidents/`, `outcomes/`, `repos.yml`, `trust-policy.yml`) + `acme/repos/<repo>/.governance/` como sidecar dos repos adotados + `templates/` (rascunhos v3, pendentes do gate da P12)                                 | ✅     |
| F2   | **ferramentas** — `backend/tools/validate.mjs`, `test-adversarial.mjs`, runtime `backend/` e checks repo-first/backend/app — mecanismos reais da barra do red-team sem depender de projeção estática                                                                                                                                                | ✅     |
| F3   | **protótipo estático da owner** — antigo `_apps/owner/` (React UMD + Cytoscape) usado para explorar o grafo; hoje arquivado em `_archive/org-simulation-v3-static-apps-v1` e substituído pelo console técnico do `governance-next`                                                                                                                  | ✅     |
| F4   | **protótipo estático das empresas** — antigo `_apps/company/` usado para perfis/dashboards; hoje arquivado em `_archive/org-simulation-v3-static-apps-v1` e substituído pela Home/Settings/Console do `governance-next`                                                                                                                             | ✅     |
| F5   | **rodada Codex** — FEITA: 16/16 findings aceitos; reconciliação em [`_reviews/2026-07-02-f5-adversarial-review.md`](_reviews/2026-07-02-f5-adversarial-review.md) (veredito: a sim ainda aceita texto bem-formado como evidência — blocos I–N aguardam gate)                                                                                        | ✅     |
| F6   | aplicar os blocos da F5 NA ORDEM (**I/J/K/L/M/N aplicados**: schema fail-closed + resolver + authority/envelope + self-attested targets com colapso logado + fila de revisão de contrato/deps cross-intent + derivação/drift/follow-ups/matcher + vendor/CSP) + substrate repo-first (código MVP, contextos, repo-work ack, repo-contract registry) | ✅     |
| F7   | outcomes reais + lifecycle repo-local + aprofundamento dos repos críticos (`NEXT-STEPS.md`): primeiro outcome válido, peças `done` com evidência, testes locais, interfaces de contrato, trust-policy e fixtures adversariais novas                                                                                                                 | ✅     |
| F8   | file backend transacional mínimo: lock global por comando, escrita atômica, marker de recovery, event-log append-only, fixtures de concorrência/replay/crash e primeiro `verdict.accept` real via runtime                                                                                                                                           | ✅     |
| F9   | segundo outcome real: fechar peças repo-local da `intent-checkout-stack` via comando e publicar outcome com `contract-revisions: [acme-user-context@v4]`                                                                                                                                                                                            | ✅     |
| F10  | operacional sem intent: fechar standalone repo-local via `standalone.complete` e publicar outcome operacional sem intent emissora, preservando badge de self-attestation quando a fonte colapsa com o time medido                                                                                                                                   | ✅     |
| F11  | próxima iteração assistida: walkthrough da owner, decisões append-only remanescentes, matcher/authoring e revisão adversarial pós-R5                                                                                                                                                                                                                | ⬜     |

## Como rodar

```bash
cd governance-demo
node backend/tools/validate.mjs        # lints da org (exit 1 se houver ERRO)
node backend/tools/adopt-existing-repos.mjs # cria sidecars minimos para repos existentes (idempotente)
node backend/tools/adopt-existing-repos.mjs --check # confere se todo repo tem scaffold minimo
node backend/tools/prepare-capability-review.mjs --write # gera pacotes p/ AI-assisted capability extraction
node backend/tools/prepare-capability-review.mjs --check # confere freshness dos pacotes de revisao
node backend/tools/publish-contexts.mjs # publica acme/repos/*/.governance/context.json a partir dos manifestos + codigo
node backend/tools/check-repo-contexts.mjs # falha se repos.yml, manifestos e context.json divergirem
node backend/tools/publish-repo-works.mjs # publica acks repo-local p/ as peças do breakdown central
node backend/tools/check-repo-works.mjs # falha se intent.works e repo/.governance/works divergirem
node backend/tools/publish-repo-contracts.mjs # publica registry/contracts nos owner repos
node backend/tools/check-repo-contracts.mjs # falha se contracts.yml e registry local divergirem
node backend/tools/check-local-repo-tests.mjs # roda os testes locais dos repos criticos
node backend/tools/check-runtime.mjs # prova backend runtime: file adapter + dominio + read-model + command dry-run
node backend/tools/check-governance-app.mjs # prova app Next/MUI v2: TypeScript strict + snapshot runtime + next build
node backend/tools/export-backend-examples.mjs # gera exemplos file/sqlite/neo4j/mongo a partir do read-model
node backend/tools/export-backend-examples.mjs --check # confere freshness dos exemplos de banco
node backend/tools/check-backend-examples.mjs # smoke operacional: file read-model + Neo4j Cypher + contrato de ação
node backend/tools/load-neo4j-example.mjs --dry-run # valida plano executável de carga Neo4j sem tocar banco
node backend/tools/adoption-journey.mjs # dogfood completo da adoção repo-existente → host agregado
node backend/tools/test-adversarial.mjs # fixtures adversariais: cada quebra plantada DEVE ser pega
# app operacional Next/MUI:
npm --workspace acme-governance-next-app run dev
# abrir http://127.0.0.1:3024
```

## O loop de iteração (o ponto da v3)

1. Editar os YAML de `acme/governance/` ou dos sidecars `acme/repos/<repo>/.governance/` (ou pedir ao Claude) — o SSOT da sim é o arquivo.
2. `node backend/tools/validate.mjs` → os erros aparecem nos checks e no app operacional.
3. `npm --workspace acme-governance-next-app run dev` → a Home, o onboarding, as configurações e o console técnico refletem a runtime v3.
4. O que a sim provar que está errado NO MODELO vira provocação no `model.yml`.

## Loop de adoção de uma empresa existente

1. A empresa aponta a ferramenta para repos que já têm código.
2. `node backend/tools/adopt-existing-repos.mjs` cria o sidecar mínimo `.governance/` sem sobrescrever manifestos existentes.
3. `node backend/tools/prepare-capability-review.mjs --write` monta o pacote revisável para IA/humano.
4. A IA sugere patch; o humano dono do repo revisa e edita `.governance/manifest.yml`.
5. `node backend/tools/publish-contexts.mjs` publica `context.json` por repo.
6. `node backend/tools/publish-repo-works.mjs` publica o reconhecimento repo-local das peças já quebradas.
7. `node backend/tools/publish-repo-contracts.mjs` publica o contrato no registry do owner repo.
8. `node backend/tools/check-repo-contexts.mjs` prova que `repos.yml`, manifestos e contexts não divergiram.
9. `node backend/tools/check-repo-works.mjs` prova que o breakdown central e os repos não divergiram.
10. `node backend/tools/check-repo-contracts.mjs` prova que `contracts.yml` e os owner repos não divergiram.
11. `node backend/tools/check-local-repo-tests.mjs` prova comportamento nos repos críticos sem depender só do manifesto.
12. `node backend/tools/check-backend-examples.mjs` prova que `file/read-model.json`, event-log exemplo e Cypher Neo4j não têm refs penduradas.
13. `node backend/tools/load-neo4j-example.mjs --dry-run` prova o plano de carga Neo4j sem credenciais nem rede.
14. `node backend/tools/adoption-journey.mjs` executa o dogfood completo.

## Decisões de desenho

- **File-first, com fronteira física explícita:** `acme/governance/` é o host central da org; `acme/repos/` representa os repos já existentes da empresa; cada repo tem sidecar próprio (`acme/repos/<repo>/.governance/manifest.yml` → `context.json`). O `repos.yml` central é inventário; a publicação por repo impede que ele vire a única fonte de verdade.
- **Escopo honesto da v3:** esta sim agora porta a base `backend` DDD (`domain`, `adapters/file`, command dry-run/execute, transação file-first mínima e read-model de grafo), exemplos verificáveis de backends derivados em `examples/backends/` (`file`, `neo4j`, `sqlite`, `mongo`) e smoke operacional para `file + Neo4j`. Ainda não porta adapters transacionais sqlite/neo4j/mongo write-capable nem a autoria completa da v2. A v3 prova dogfood repo-first, runtime file-first, app operacional Next/MUI, projeções multi-backend, loader Neo4j dry-run e resolvers fail-closed; a portabilidade multi-backend write-capable fica como próxima camada, registrada em `features.md`.
- **App operacional Next/MUI v2:** `frontend/` é a primeira superfície de produto do app-requirements e agora roda como app TypeScript strict, sem camada JS/JSX legada. Ele lê a runtime v3 server-side, separa a navegação por audiência (stakeholder, owner, tech lead, operação, admin de adoção, auditoria e admin), mostra planning/intake/execução/contratos/outcomes/repos/operação e envia comandos governados para dry-run/execute. A entrada atual é a Home de Adoção/Governança orientada a tarefa humana; grafo, YAML/JSON, comandos, resolvers e event-log ficam como console técnico ou detalhe progressivo. Nesta fatia, os comandos mutáveis mecanizados são `proposal.create`, `triage.save`, `gate.decide`, `intent.activate`, `breakdown.apply`, `repo-work.ack`, `standalone.complete`, `contract.propose-revision`, `outcome.publish`, `verdict.accept`, `incident.declare` e `policy.break-glass`; qualquer expansão de authoring precisa entrar como comando com resolver, não como edição direta de YAML pela UI.
- **Contrato TypeScript compartilhado:** novos contratos de domínio do app ficam em `backend/domain/*.ts` e são compilados por `tsconfig.domain.json`. O app importa `GovernanceSnapshot`, comandos, adoption shell e i18n dali, em vez de manter uma ontologia própria em `lib/types.ts`.
- **Locale versionado e colocalizado:** strings centrais de produto ficam junto do menor dono estável da copy (view, step, section, componente compartilhado, subdomínio ou shell) em `frontend/app/**/_locales/pt-br.json`. Backend/domínio deve evoluir para emitir `messageKey` + `params`, não frases soltas. O check do app rejeita o antigo locale global e locales amplos por feature.
- **Dependências explícitas do app:** `frontend/` é o workspace npm `acme/governance-next-app`, com dependências declaradas no próprio package do app e lockfile único na raiz. `check-governance-app.mjs` falha se o app importar pacote externo sem declarar no package do workspace.
- **Configurações de adoção e integrações:** a aba `Configuracoes` projeta o `integration-catalog.yml` dentro do app e simula o onboarding inicial: escolha de perfil de governança (`full`, `compact`, `trio`, `solo`), contrato de papéis (`admin`, `sponsor`, `payer`, `security`, `technical owner`, `actual-attester`) e primeira integração de assistente (`ollama`/runtime local-cloud). Ela não grava YAML ainda; serve para validar UX e revelar colapsos de autoridade antes de mecanizar persistence. A evolução multi-organização deve partir do `adoption-shell` tipado (`account → workspace → governance-host → work-sources`) e não de estado local inventado na tela.
- **Primeiro adapter local/open-source:** o app expõe `GET /api/integrations/assistant/ollama/health`, que testa somente `/api/tags` em endpoint loopback (`127.0.0.1`/`localhost`). Ele não envia prompt, arquivo, contexto do repo nem classificação; endpoints não-locais falham fechado até existir política de egress aprovada.
- **Iteração guiada do walkthrough:** [`WALKTHROUGH-ITERATION.md`](WALKTHROUGH-ITERATION.md) registra as observações da owner, os bugs de UI/hydration já tratados no app v2 e os próximos recortes de usabilidade.
- **Read-model não age sozinho:** `examples/backends/ACTION-CONTRACT.md` declara que toda ação governada relê YAML/event-log autoritativo e falha fechado se o hash/base-revision divergir. O loader Neo4j só aplica com `--apply --source-hash <hash>` e credenciais explícitas; por padrão roda em dry-run.
- **Standalone é repo-local:** fixes/dep-bumps avulsos moram em `acme/repos/<repo>/.governance/works/*.yml` com `schema: acme.standalone-work/v1`. O host só agrega. Incidente é instrumento central em `acme/governance/incidents/incidents.yml` e gera follow-ups para standalone/proposal.
- **Adoção por empresa existente:** `backend/tools/adopt-existing-repos.mjs` faz scaffold minimo e gera `capability-candidates.yml` como rascunho revisavel. `backend/tools/prepare-capability-review.mjs` monta um pacote de revisão por repo com evidência estática para IA/humano. A extração por IA fica como canal assistivo (template em `templates/capability-extraction-prompt.md`), nunca como mutação silenciosa do manifesto.
- **Breakdown reconhecido pelo repo:** `intent.works` continua sendo a quebra central, mas cada repo publica `.governance/works/<intent>--<work>.yml` com hash do breakdown e touchpoint de código. Se a peça muda e o repo não reconhece a nova versão, o host falha em `repo-work-stale`.
- **Lifecycle repo-local:** o acknowledgement não é só presença. Peças podem estar `acknowledged`, `active`, `blocked`, `done` ou `dropped`; `done` exige evidência de código/teste e verificação, e outcome não entra no dashboard enquanto peça necessária estiver aberta ou descartada.
- **Contratos reconhecidos pelo owner repo:** `contracts.yml` continua sendo a visão coordenada da org, mas cada owner repo publica `.governance/registry/contracts/<contract>.yml` com hash do contrato central e touchpoint de código. Se a revisão, consumers ou owner mudam sem publicação local, o host falha em `repo-contract-stale`.
- **Interfaces de contrato são parte do contrato:** o registry local replica também a interface/payload versionado. A sim não trata contrato como label solto.
- **Outcome real é evento governado:** `outcomes.yml` só alimenta target/dashboard quando o resolver fecha fonte, janela, métrica, agregação, revisão, contratos derivados, envelope, idempotência, nonce e independência de atestação.
- **Verdict real passa por event-log:** `verdict.accept` do `intent-cta-upgrade` foi executado via runtime file-first, gravando `decisions/verdicts.yml` e `events/events.jsonl`; novas mutações passam por lock de comando, escrita atômica e detector de transação pendente.
- **Segundo outcome real toca contrato:** `intent-checkout-stack` fechou suas sete peças repo-local via `repo-work.ack` e publicou `out-checkout-stack-2027h2` via `outcome.publish`, citando `acme-user-context@v4`. O check da runtime falha se esse outcome ou a contract-revision sumirem.
- **Outcome operacional sem intent:** `fix-checkout-timeout` é follow-up de `incident:incidente-checkout`, mora no repo `acme-checkout-api`, fecha via `standalone.complete` com evidência e publica `out-fix-checkout-timeout-2027h1` em `tgt-sre-incidents`. O resolver falha se standalone aberto tentar emitir outcome, e o dashboard deve manter visível o colapso de attestation do `acme-obs-stack`.
- **Trust-policy físico:** `acme/governance/trust-policy.yml` materializa ACL local, fallback de matcher/egress, revogações, quarantine de segredo e independência do oráculo. O validador rejeita política declarativa sem referência resolvível.
- **Integrações externas são opcionais:** o framework funciona sem ferramentas externas; adapters entram como evidence providers/importers/projections para aproveitar o que a empresa já usa. O catálogo versionado mora em [`../integration-catalog.yml`](../integration-catalog.yml).
- **Legado estático arquivado:** os antigos apps sem build (`owner`, `company`, `vendor`, `graph.js`, `build-graph.mjs`, `check-app-security.mjs`) ficam em `_archive/org-simulation-v3-static-apps-v1` como histórico F3/F4. A pasta ativa `_apps/` deve conter somente `governance-next`; `check-governance-app.mjs` e `test-adversarial.mjs` falham se o legado voltar para a superfície ativa.
- O validador implementa **um subconjunto honesto** das regras da P10/P11/P12/P13: schema fail-closed, resolver de outcome, repo-first substrate, lifecycle repo-work, contrato local, drift de contexto e controles físicos de confiança. O que não está mecanizado fica registrado como próxima fatia, não como campo cerimonial.
- **Self-attested target não é maquiado:** se a fonte que atesta pertence ao próprio time medido, o target exige `attestation-collapse` aprovado por sponsor; o dashboard mantém o badge/warning em vez de fingir independência.
- **Contenção de contrato não é nota solta:** se múltiplas intents mudam o mesmo contrato, o contrato precisa de `revision-proposals` com intents cobertas, consumers afetados, owner-approval resolvido e decision não-pendente; deps cross-intent resolvem e o grafo global não pode ciclar.
- **Derivação não vira campo editável:** observed approach/signal/form/collapse são calculados; drift é warning. Follow-ups de incidente apontam para `standalone:<id>`/`proposal:<id>` e o matcher registra score/unknown/evidence/decisão.
- **Supply chain local:** o app ativo declara dependências no workspace `acme/governance-next-app`, roda por Next/MUI e mantém integrações externas atrás de adapters e políticas explícitas. A evidência histórica de CSP/vendor local dos protótipos estáticos permanece no arquivo arquivado.
- **Handoff para Claude Code/Fable 5:** [`CLAUDE-CODE-FABLE-5-HANDOFF.md`](CLAUDE-CODE-FABLE-5-HANDOFF.md) registra como usar o modelo novo como revisor/implementador de próxima fatia sem reabrir decisões já mecanizadas.
