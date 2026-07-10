# Guilda QRD preservation matrix

> **Status:** inventario de preservacao e plano de fechamento do checkpoint.
> **Data:** 2026-07-10.
> **Escopo:** mapear as QRDs criadas durante a incubacao de Guilda para os
> objetivos do checkpoint `artifact-taxonomy-and-model-review-contract`, sem
> reativar Guilda como produto dentro do repo `ai-guidelines`.

## 1. Proposito

Este arquivo existe porque a incubacao de Guilda foi mais do que uma demo: ela
foi o dogfood que revelou, na pratica, por que a Spec 0024 precisava de uma
taxonomia robusta de artefatos.

Durante a Guilda, o mesmo espaco acumulou:

- pesquisa;
- QRDs;
- specs de produto;
- matriz de cobertura;
- contratos de teste;
- mock-api;
- spikes;
- assets de marca;
- prompts de imagem;
- reviews adversariais;
- app operacional;
- modelos de dados;
- disposicoes de extracao.

Isso produziu valor, mas tambem mostrou o risco que o checkpoint atual tenta
corrigir: sem `artifact-kind`, autoridade, lifecycle e disposicao, documentos
muito diferentes passam a competir como se todos fossem fonte da verdade.

## 2. Autoridade e fronteira

**FATOS**

- O log integral das QRDs vive arquivado em
  [`_archive/guilda-incubation-2026-07/APP-DECISIONS.md`](_archive/guilda-incubation-2026-07/APP-DECISIONS.md).
- O produto vivo Guilda foi extraido para
  `git@github.com:rosanarezende/guilda.git`.
- O checkpoint ativo do `ai-guidelines` continua sendo
  `artifact-taxonomy-and-model-review-contract`.
- `model.yml`, `tracker.md` e `features.md` sao suporte da frente
  `work-graph-model`; eles nao substituem o contrato de taxonomia do framework.

**INTERPRETACAO**

Nem toda QRD deve virar campo em `model.yml`, item em `features.md` ou bloco em
`tracker.md`. O que precisa ser preservado neste repo e:

1. a decisao que afeta o framework `ai-guidelines`;
2. a evidencia que justifica um `artifact-kind`, uma regra de autoridade ou um
   lifecycle;
3. a disposicao que diz se algo virou produto Guilda, arquivo historico,
   projection, research madura ou debito aberto.

O resto pertence ao repo Guilda como produto vivo.

## 3. Como ler a matriz

Colunas:

- **QRDs:** intervalo ou decisao individual no arquivo arquivado.
- **Tema:** assunto dominante.
- **Autoridade atual:** onde a decisao vive daqui em diante.
- **Contribuicao para o checkpoint:** o que essa rodada ensinou sobre
  taxonomia/model-review/research-index.
- **Acao no `ai-guidelines`:** trabalho necessario para fechar o checkpoint.
- **Acao no `guilda`:** trabalho que nao deve mais ser feito neste repo.

## 4. Matriz QRD -> checkpoint

| QRDs  | Tema                                                                                                     | Autoridade atual                                               | Contribuicao para o checkpoint                                                                                                         | Acao no `ai-guidelines`                                                                                                                      | Acao no `guilda`                                                           |
| ----- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 01-07 | Ambientes, fake/mock API, MSW, e2e, definition of done                                                   | Arquivo historico + repo Guilda                                | Distingue `test-contract`, fixture, seed, mock, harness e evidence; mostra que teste tambem tem natureza governada                     | Usar como evidencia para `pre-coding-review`, `delivery-review`, `dogfood`, `inventory` e policy de coverage advisory                        | Manter estrategia de testes do produto no repo Guilda                      |
| 08-11 | Governance host, layout fisico, contas, membros, papeis, subjects, acesso ao grafo                       | `model.yml` para conceito; Guilda para produto                 | Mostra diferenca entre login, membership, role assignment, authority e access-policy; authority nao deriva de identidade               | Garantir que a taxonomia separe fonte autoritativa, policy, projection e evidencia; nao confundir identity artifacts com authority artifacts | Implementar UX e runtime de host/roles no produto                          |
| 12-16 | Natureza do app, integracao CLI, workspace mode, onboarding, Neo4j                                       | `tracker.md`/`model.yml` + Guilda                              | Consolida app como superficie humana e banco/grafo como read-model derivado, nunca SSOT paralelo                                       | Rotular mapas, dashboards, Neo4j e assets como `projection`; preservar "derived-only" como criterio de autoridade                            | Evoluir o app visual/desktop e adapters de read-model                      |
| 17-23 | Docker Compose, Ollama, auth, identity providers, host distribution, fontes sem Git, policy handbook     | Guilda + integration catalog                                   | Explicita que adapter externo, identity provider, fonte de trabalho e policy handbook tem naturezas diferentes                         | Manter `integration-catalog.yml` como evidence/importer/projection/channel, sem promover ferramenta externa a SSOT                           | Implementar compose, providers, policy UX e fontes no produto              |
| 24-26 | Matcher, assistentes, planejamento progressivo, backlog de integracoes                                   | `model.yml` para assistive/advisory; Guilda para UX            | Reforca que IA/matcher e canal assistivo, nao decisor; backlog visivel e artefato de priorizacao, nao contrato                         | Taxonomia deve permitir `prompt`, `research`, `gap`, `inventory` e projection sem dar autoridade decisoria a IA                              | Evoluir Cup/CWP, matcher e hub de integracoes                              |
| 27-29 | Spikes de stack visual e reconciliacao owner                                                             | Arquivo historico + Guilda                                     | Spikes comparativos sao `research` ou `pre-coding-review`; telas e screenshots sao projection; percepcao da owner vira input decisorio | Manter spikes/visual prompts classificados; nao tratar asset visual como SSOT                                                                | Aplicar stack visual e design system no produto                            |
| 30-33 | Sources, presentation adapters, Cup/CWP, hub de integracoes                                              | Guilda + integration catalog                                   | Mostra a necessidade de separar adapter de governanca, adapter de apresentacao, provider e canal de assistente                         | Refinar catalogos de adapter-kind e lembrar que presentation adapter nao altera modelo                                                       | Implementar UI/UX de sources, adapters e Cup                               |
| 34-35 | Desenvolvimento orientado por contratos de teste, navegacao global                                       | Guilda para produto; ai-guidelines como evidencia metodologica | Demonstra que contrato de teste pode guiar produto antes da UI; navegacao e UX sao especificacao, nao apenas implementacao             | Usar como evidencia para lifecycle de `delivery-review` e coverage matrix; nao exigir que todos os testes de produto rodem neste repo        | Manter contratos de produto e matriz de cobertura no repo Guilda           |
| 36-40 | Portal, naming, extracao, grafos/open-source, Google OSS                                                 | Guilda para produto; ai-guidelines para disposicao historica   | Mostra o risco de misturar produto, framework, portal, hosted control plane e research OSS no mesmo PR                                 | Registrar disposicao; preservar research madura; manter grafos como read-model; OSV/deps.dev como evidence provider                          | Decidir produto/nome/infra no repo Guilda                                  |
| 41-46 | Portal sobre GitHub host, custo/hospedagem, Docker, OSV, Better Auth, TanStack, passwordless, telemetria | Guilda para produto e portal                                   | Separa identity/control plane de governance plane e content plane; prova que auth nao e authority                                      | Taxonomia deve separar identity artifacts, supply-chain evidence, telemetry e governance decision artifacts                                  | Implementar auth/passwordless/telemetria sem guardar governanca do usuario |
| 47    | Naming publico: Guilda/Guilda Governance/guilda flow                                                     | Guilda                                                         | Brand/naming e decisao de produto, mas prompts/assets de marca sao artefatos que precisam de natureza e disposicao                     | Preservar como evidencia historica; classificar prompts/assets como `prompt`/`projection` quando em research/assets                          | Continuar naming, marca e clearance juridico no repo Guilda                |
| 48    | Extracao para repo irmao                                                                                 | Este documento + repo Guilda                                   | Caso central de `disposition`: produto vivo sai, evidencia historica fica, tombstone impede reativacao                                 | Manter `GUILDA-EXTRACTION-DISPOSITION.md`, esta matriz e tombstone; remover build/testes de Guilda do contrato do framework                  | Assumir desenvolvimento vivo                                               |
| 49    | Contrato do GitHub governance host                                                                       | Guilda + futuro dogfood cross-repo                             | Diferencia host Git-backed de portal; host e fonte de governanca, portal e superficie operacional                                      | Preservar no modelo conceitual e em catalogos; nao implementar GitHub host dentro do PR #45                                                  | Implementar host/repo provider no produto                                  |
| 50    | Politica minima do portal                                                                                | Guilda                                                         | Reforca fronteira: portal guarda conta/convite/registry minimo, nao conteudo de governanca                                             | Usar como caso para separar policy/identity artifacts de governance artifacts                                                                | Implementar portal seguro no produto                                       |
| 51    | Dogfood da plataforma                                                                                    | Futuro trabalho governado entre repos                          | Mostra que dogfood e `artifact-kind` proprio/evidencia situada, nao readiness automatica                                               | Registrar dogfood futuro como novo trabalho, nao como continuacao silenciosa deste PR                                                        | Usar Guilda para governar `guilda` e `ai-guidelines` quando maduro         |
| 52    | Desktop local-first                                                                                      | Guilda                                                         | Prova que produto mudou de superficie fundadora; PR #45 nao pode ser lido como validacao de v1 web                                     | Preservar a decisao como historico; impedir que tasks do PR #45 exijam validar desktop                                                       | Implementar Tauri/Rust/desktop local-first                                 |
| 53    | Corte do produto vivo para repo irmao                                                                    | `GUILDA-EXTRACTION-DISPOSITION.md` + repo Guilda               | Fecha a fronteira de disposicao e evita GG-0005: nao deixar produto incubado como debito silencioso                                    | Completar arquivo, tombstone, PR body e plano deste checkpoint                                                                               | Continuar reorganizacao e desenvolvimento no repo Guilda                   |

## 5. Artefatos derivados da experiencia Guilda que a taxonomia precisa reconhecer

A Guilda produziu exemplos concretos dos seguintes tipos de artefato. Esta
lista nao adiciona novos `artifact-kind` automaticamente; ela diz quais casos o
checkpoint precisa acomodar, classificar ou explicitamente rejeitar.

| Caso observado na Guilda                 | Natureza provavel no checkpoint                                            | Observacao de autoridade                                                   |
| ---------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| QRD / rodada de decisao                  | `decision-brief` por lar governado, ou research historica quando arquivada | QRD decide produto; so vira autoridade do framework quando promovida a DEC |
| Pesquisa comparativa                     | `research`                                                                 | Inspira, nao governa                                                       |
| Review antes de implementar              | `pre-coding-review`                                                        | Advisory; findings viram DEC/task/review governado                         |
| Review de entrega/PR                     | `delivery-review` ou review governado, conforme lar                        | Nao confundir entrega com modelo                                           |
| Prompt para Claude/Gemini/ChatGPT/imagem | `prompt`                                                                   | Operacional; sem autoridade                                                |
| Screenshots, boards, HTML visual, assets | `projection`                                                               | Visual/derivado; nunca SSOT                                                |
| Coverage matrix e contratos de teste     | `inventory`/`dogfood` ou contrato de teste do produto no repo Guilda       | Evidencia forte, mas nao substitui tasks/DEC                               |
| Mock API/seeds/fixtures                  | Produto Guilda; no ai-guidelines ficam como evidencia historica            | Nao precisam rodar no PR #45 apos extracao                                 |
| Integration catalog                      | Catalogo ativo de adapters opcionais                                       | Ferramenta externa observa/importa/projeta; nao governa                    |
| Tombstone/extraction disposition         | Disposicao de arquivo historico                                            | Deve impedir reativacao acidental do produto                               |
| Handoff antigo                           | `handoff-legacy`                                                           | Evidencia datada; nao contrato atual                                       |

## 6. O que significa "fechar o checkpoint"

O entregavel deste checkpoint **nao** e "Guilda validada" e tambem **nao** e
apenas atualizar `model.yml`, `tracker.md` e `features.md`.

O checkpoint fica fechado quando o framework `ai-guidelines` tiver:

1. taxonomia fechada de `artifact-kind` para documentos de pesquisa/evidencia;
2. ordem canonica de autoridade sem divergencia entre catalogos;
3. classificacao suficiente dos artefatos relevantes atuais;
4. handoffs antigos classificados como legados, sem virar novo fluxo persistido;
5. mapas/projecoes rotulados como nao-autoridade;
6. `research-index` reparado/verificado;
7. promocao de research madura para `research-library/<domain>` quando aplicavel;
8. `pre-coding-review` materializado com schema/home/autoridade/lifecycle/check/doc/exemplo,
   ou rejeitado por DEC explicita;
9. PR body e tasks reconciliados para declarar que Guilda foi extraida e que
   readiness de produto nao e escopo do PR #45;
10. plano claro para o Gap B/PR grande, sem debito silencioso.

## 7. Plano robusto para alcancar os objetivos

### Fase 0 - Preservar e separar

**Status:** em andamento.

Objetivo: garantir que a extracao de Guilda nao apague evidencia nem mantenha
produto ativo no PR #45.

Saidas:

- `GUILDA-EXTRACTION-DISPOSITION.md`;
- tombstone em `governance-demo/README.md`;
- archive em `_archive/guilda-incubation-2026-07/`;
- esta matriz QRD -> checkpoint;
- `package.json`, lockfile e script contracts sem workspaces/scripts de Guilda.

Checks minimos:

- `git diff --check`;
- `npm run artifact-kind:check`;
- `npm run research-index:check`;
- `npm run validate:changed`.

### Fase 1 - Travar escopo do checkpoint

Objetivo: impedir que "readiness de produto Guilda" seja confundida com
"readiness da Spec 0024".

Saidas:

- PR body do #45 reconciliado;
- `tasks.md`/`tracker.md` declarando a fronteira;
- disposicao explicita para o Gap B ja registrado no protocolo de continuacao;
- nenhuma exigencia de build/test/e2e de Guilda no `ai-guidelines`.

### Fase 2 - Completar taxonomia de artefatos

Objetivo: garantir que todos os tipos observados na Guilda caibam na taxonomia
ou tenham rejeicao explicita.

Trabalho:

- revisar `.core/governance/artifact-taxonomy.yml` contra os casos da secao 5;
- decidir se `disposition: living|evidence|legacy|open` entra agora ou fica
  explicitamente diferido;
- confirmar se `delivery-review` continua kind proprio ou dobra no modelo de
  review de gate;
- classificar lote relevante de research/assets sem exigir cobertura universal.

### Fase 3 - Fechar `pre-coding-review`

Objetivo: materializar o tipo que nasceu da necessidade de revisar modelo antes
de implementar.

Trabalho:

- schema minimo (`subject`, `date`, `reviewer`, `method`, `scope`, `findings`,
  `disposition`);
- home fisico ou regra de lar;
- template;
- check;
- exemplo pequeno;
- doc no `GOVERNANCE-CATALOG.md` e `docs/scripts.md` quando houver script.

### Fase 4 - Reparar research index e research library

Objetivo: transformar research madura em biblioteca consultavel, sem promover
todo arquivo historico.

Trabalho:

- verificar `research-index`;
- promover apenas research madura para `research-library/<domain>`;
- manter QRDs de produto no arquivo historico;
- registrar o que fica como evidence/legacy.

### Fase 5 - Validacao e review

Objetivo: preparar Ready da Spec 0024, nao Ready da Guilda.

Checks esperados antes de pedir Human Gate:

- `npm run validate:changed`;
- `npm run validate` quando a owner decidir preparar Ready;
- PR body reconciliado;
- CI verde;
- review governado atualizado se exigido pelo estado da spec.

## 8. Criterio de sucesso

Este mapeamento estara bem-sucedido se uma pessoa ou IA conseguir responder,
sem depender do chat:

1. quais decisoes de Guilda viraram produto vivo fora deste repo;
2. quais aprendizados de Guilda alimentam a taxonomia do `ai-guidelines`;
3. quais documentos sao autoridade, evidencia, projection ou legado;
4. quais entregaveis ainda faltam para o checkpoint PR #45;
5. por que `model.yml`, `tracker.md` e `features.md` sao importantes, mas nao
   sao sozinhos o entregavel final do checkpoint.
