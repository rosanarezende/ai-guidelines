# Org simulada v3 — a acme de ponta a ponta (a "virada de chave")

> **O que é:** a org-exemplo da P12 (acme — 2 objetivos · 2 áreas · 5 times · 13 repos · 3 contratos · 7 intents · 3 reativos) instanciada como **arquivos de verdade**, com **validador executável** (o começo do resolver da P11) e **apps dedicados** de visualização/iteração. Decidida pela owner em 2026-07-02: "quero começar a validar de ponta a ponta".
>
> **Autoridade:** o MODELO mora em [`../model.yml`](../model.yml) (SSOT v2 limpo aplicado). Esta sim **valida** o modelo — quando a sim contradiz o modelo, ou se corrige a sim, ou se abre provocação no modelo. Substitui a `_org-simulation-v2` como frente ativa; a v2 ficou arquivada como histórico e fonte de aprendizados de matcher/app. Próximos passos operacionais: [`NEXT-STEPS.md`](NEXT-STEPS.md).

## O plano ponta-a-ponta (fases)

| fase | entrega                                                                                                                                                                                                                                                                                                                                             | status |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| F0   | fechar a fase de iteração do flow-explorer (commit selado)                                                                                                                                                                                                                                                                                          | ✅     |
| F1   | **a org file-first** — `acme-governance/` como host central (`business/`, `contracts/`, `intake/`, `intents/`, `incidents/`, `outcomes/`, `repos.yml`, `trust-policy.yml`) + `repos/<repo>/.governance/` como sidecar dos repos adotados + `_templates/` (rascunhos v3, pendentes do gate da P12)                                                   | ✅     |
| F2   | **ferramentas** — `_tools/build-graph.mjs` (org → `_apps/graph.js`: nós+arestas tipados) e `_tools/validate.mjs` (lints executáveis: refs, sinal×contrato, review derivado, deps, regra de ouro…) — _o primeiro mecanismo real da barra do red-team_                                                                                                | ✅     |
| F3   | **app da owner** — `_apps/owner/` (React UMD + Cytoscape): o grafo INTEIRO navegável — zoom/pan, clique, filtros por tipo, painel de detalhes, lista de issues do validador (achar erro → clicar → corrigir no YAML → regenerar)                                                                                                                    | ✅     |
| F4   | **app das empresas** — `_apps/company/` : a mesma org vista pelos **perfis de governança** (grande=full · média=compact · solo) + os 2 dashboards derivados (acompanhamento e stakeholders)                                                                                                                                                         | ✅     |
| F5   | **rodada Codex** — FEITA: 16/16 findings aceitos; reconciliação em [`_reviews/2026-07-02-f5-adversarial-review.md`](_reviews/2026-07-02-f5-adversarial-review.md) (veredito: a sim ainda aceita texto bem-formado como evidência — blocos I–N aguardam gate)                                                                                        | ✅     |
| F6   | aplicar os blocos da F5 NA ORDEM (**I/J/K/L/M/N aplicados**: schema fail-closed + resolver + authority/envelope + self-attested targets com colapso logado + fila de revisão de contrato/deps cross-intent + derivação/drift/follow-ups/matcher + vendor/CSP) + substrate repo-first (código MVP, contextos, repo-work ack, repo-contract registry) | ✅     |
| F7   | outcomes reais + lifecycle repo-local + aprofundamento dos repos críticos (`NEXT-STEPS.md`): primeiro outcome válido, peças `done` com evidência, testes locais, interfaces de contrato, trust-policy e fixtures adversariais novas                                                                                                                 | ✅     |
| F8   | iteração assistida com Claude Code/Fable 5: revisão da sim robusta, walkthrough da owner e próxima fatia incremental                                                                                                                                                                                                                                | ⬜     |

## Como rodar

```bash
cd _org-simulation-v3
node _tools/validate.mjs        # lints da org (exit 1 se houver ERRO)
node _tools/adopt-existing-repos.mjs # cria sidecars minimos para repos existentes (idempotente)
node _tools/adopt-existing-repos.mjs --check # confere se todo repo tem scaffold minimo
node _tools/prepare-capability-review.mjs --write # gera pacotes p/ AI-assisted capability extraction
node _tools/prepare-capability-review.mjs --check # confere freshness dos pacotes de revisao
node _tools/publish-contexts.mjs # publica repos/*/.governance/context.json a partir dos manifestos + codigo
node _tools/check-repo-contexts.mjs # falha se repos.yml, manifestos e context.json divergirem
node _tools/publish-repo-works.mjs # publica acks repo-local p/ as peças do breakdown central
node _tools/check-repo-works.mjs # falha se intent.works e repo/.governance/works divergirem
node _tools/publish-repo-contracts.mjs # publica registry/contracts nos owner repos
node _tools/check-repo-contracts.mjs # falha se contracts.yml e registry local divergirem
node _tools/check-local-repo-tests.mjs # roda os testes locais dos repos criticos
node _tools/check-runtime.mjs # prova _lib runtime: file adapter + dominio + read-model + command dry-run
node _tools/check-governance-app.mjs # prova app Next/MUI: snapshot runtime + next build
node _tools/export-backend-examples.mjs # gera exemplos file/sqlite/neo4j/mongo a partir do read-model
node _tools/export-backend-examples.mjs --check # confere freshness dos exemplos de banco
node _tools/check-backend-examples.mjs # smoke operacional: file read-model + Neo4j Cypher + contrato de ação
node _tools/load-neo4j-example.mjs --dry-run # valida plano executável de carga Neo4j sem tocar banco
node _tools/adoption-journey.mjs # dogfood completo da adoção repo-existente → host agregado
node _tools/build-graph.mjs     # regenera _apps/graph.js (grafo + issues embutidos)
node _tools/test-adversarial.mjs # fixtures adversariais: cada quebra plantada DEVE ser pega
# apps estáticos: abrir _apps/owner/index.html e _apps/company/index.html no navegador
# app operacional Next/MUI:
npm --prefix _apps/governance-next run dev
# abrir http://127.0.0.1:3024
```

## O loop de iteração (o ponto da v3)

1. Editar os YAML de `acme-governance/` ou dos sidecars `repos/<repo>/.governance/` (ou pedir ao Claude) — o SSOT da sim é o arquivo.
2. `node _tools/validate.mjs` → os erros aparecem (e também dentro do app da owner).
3. `node _tools/build-graph.mjs` → os apps refletem.
4. O que a sim provar que está errado NO MODELO vira provocação no `model.yml`.

## Loop de adoção de uma empresa existente

1. A empresa aponta a ferramenta para repos que já têm código.
2. `node _tools/adopt-existing-repos.mjs` cria o sidecar mínimo `.governance/` sem sobrescrever manifestos existentes.
3. `node _tools/prepare-capability-review.mjs --write` monta o pacote revisável para IA/humano.
4. A IA sugere patch; o humano dono do repo revisa e edita `.governance/manifest.yml`.
5. `node _tools/publish-contexts.mjs` publica `context.json` por repo.
6. `node _tools/publish-repo-works.mjs` publica o reconhecimento repo-local das peças já quebradas.
7. `node _tools/publish-repo-contracts.mjs` publica o contrato no registry do owner repo.
8. `node _tools/check-repo-contexts.mjs` prova que `repos.yml`, manifestos e contexts não divergiram.
9. `node _tools/check-repo-works.mjs` prova que o breakdown central e os repos não divergiram.
10. `node _tools/check-repo-contracts.mjs` prova que `contracts.yml` e os owner repos não divergiram.
11. `node _tools/check-local-repo-tests.mjs` prova comportamento nos repos críticos sem depender só do manifesto.
12. `node _tools/check-backend-examples.mjs` prova que `file/read-model.json`, event-log exemplo e Cypher Neo4j não têm refs penduradas.
13. `node _tools/load-neo4j-example.mjs --dry-run` prova o plano de carga Neo4j sem credenciais nem rede.
14. `node _tools/adoption-journey.mjs` executa o dogfood completo.

## Decisões de desenho

- **File-first, com fronteira física explícita:** `acme-governance/` é o host central da org; `repos/` representa os repos já existentes da empresa; cada repo tem sidecar próprio (`repos/<repo>/.governance/manifest.yml` → `context.json`). O `repos.yml` central é inventário; a publicação por repo impede que ele vire a única fonte de verdade.
- **Escopo honesto da v3:** esta sim agora porta a base `_lib` DDD (`domain`, `adapters/file`, command dry-run/execute mínimo e read-model de grafo), exemplos verificáveis de backends derivados em `_examples/backends/` (`file`, `neo4j`, `sqlite`, `mongo`) e smoke operacional para `file + Neo4j`. Ainda não porta adapters transacionais sqlite/neo4j/mongo write-capable nem a autoria completa da v2. A v3 prova dogfood repo-first, runtime file-first, app operacional Next/MUI, projeções multi-backend, loader Neo4j dry-run e resolvers fail-closed; a portabilidade de backend transacional fica como próxima camada, registrada em `features.md`.
- **App operacional Next/MUI:** `_apps/governance-next/` é a primeira superfície de produto do app-requirements. Ele lê a runtime v3 server-side, mostra planning/intake/execução/contratos/outcomes/repos/operação e envia comandos governados para dry-run/execute. Nesta fatia, os comandos mutáveis mecanizados são `proposal.create` e `outcome.publish`; qualquer expansão de authoring precisa entrar como comando com resolver, não como edição direta de YAML pela UI.
- **Read-model não age sozinho:** `_examples/backends/ACTION-CONTRACT.md` declara que toda ação governada relê YAML/event-log autoritativo e falha fechado se o hash/base-revision divergir. O loader Neo4j só aplica com `--apply --source-hash <hash>` e credenciais explícitas; por padrão roda em dry-run.
- **Standalone é repo-local:** fixes/dep-bumps avulsos moram em `repos/<repo>/.governance/works/*.yml` com `schema: acme.standalone-work/v1`. O host só agrega. Incidente é instrumento central em `acme-governance/incidents/incidents.yml` e gera follow-ups para standalone/proposal.
- **Adoção por empresa existente:** `_tools/adopt-existing-repos.mjs` faz scaffold minimo e gera `capability-candidates.yml` como rascunho revisavel. `_tools/prepare-capability-review.mjs` monta um pacote de revisão por repo com evidência estática para IA/humano. A extração por IA fica como canal assistivo (template em `_templates/capability-extraction-prompt.md`), nunca como mutação silenciosa do manifesto.
- **Breakdown reconhecido pelo repo:** `intent.works` continua sendo a quebra central, mas cada repo publica `.governance/works/<intent>--<work>.yml` com hash do breakdown e touchpoint de código. Se a peça muda e o repo não reconhece a nova versão, o host falha em `repo-work-stale`.
- **Lifecycle repo-local:** o acknowledgement não é só presença. Peças podem estar `acknowledged`, `active`, `blocked`, `done` ou `dropped`; `done` exige evidência de código/teste e verificação, e outcome não entra no dashboard enquanto peça necessária estiver aberta ou descartada.
- **Contratos reconhecidos pelo owner repo:** `contracts.yml` continua sendo a visão coordenada da org, mas cada owner repo publica `.governance/registry/contracts/<contract>.yml` com hash do contrato central e touchpoint de código. Se a revisão, consumers ou owner mudam sem publicação local, o host falha em `repo-contract-stale`.
- **Interfaces de contrato são parte do contrato:** o registry local replica também a interface/payload versionado. A sim não trata contrato como label solto.
- **Outcome real é evento governado:** `outcomes.yml` só alimenta target/dashboard quando o resolver fecha fonte, janela, métrica, agregação, revisão, contratos derivados, envelope, idempotência, nonce e independência de atestação.
- **Trust-policy físico:** `acme-governance/trust-policy.yml` materializa ACL local, fallback de matcher/egress, revogações, quarantine de segredo e independência do oráculo. O validador rejeita política declarativa sem referência resolvível.
- **Apps sem build** (React UMD + htm + Cytoscape UMD vendorizados em `_apps/vendor/`) — iteração sem toolchain e sem CDN em runtime; `node _tools/check-app-security.mjs` confere hashes + CSP.
- **`graph.js` gerado** (window.GRAPH) em vez de fetch — `file://` não deixa fetch; mesmo truque do `data.js`.
- O validador implementa **um subconjunto honesto** das regras da P10/P11/P12/P13: schema fail-closed, resolver de outcome, repo-first substrate, lifecycle repo-work, contrato local, drift de contexto e controles físicos de confiança. O que não está mecanizado fica registrado como próxima fatia, não como campo cerimonial.
- **Self-attested target não é maquiado:** se a fonte que atesta pertence ao próprio time medido, o target exige `attestation-collapse` aprovado por sponsor; o dashboard mantém o badge/warning em vez de fingir independência.
- **Contenção de contrato não é nota solta:** se múltiplas intents mudam o mesmo contrato, o contrato precisa de `revision-proposals` com intents cobertas, consumers afetados, owner-approval resolvido e decision não-pendente; deps cross-intent resolvem e o grafo global não pode ciclar.
- **Derivação não vira campo editável:** observed approach/signal/form/collapse são calculados; drift é warning. Follow-ups de incidente apontam para `standalone:<id>`/`proposal:<id>` e o matcher registra score/unknown/evidence/decisão.
- **Supply chain local:** os apps de decisão não carregam `http(s)`; dependências vendorizadas têm hash versionado e CSP bloqueia conexão externa.
- **Handoff para Claude Code/Fable 5:** [`CLAUDE-CODE-FABLE-5-HANDOFF.md`](CLAUDE-CODE-FABLE-5-HANDOFF.md) registra como usar o modelo novo como revisor/implementador de próxima fatia sem reabrir decisões já mecanizadas.
