<!-- ai-guidelines-template: plan-boilerplate v=1 -->

# Plan — Spec 0021 Governance Information Architecture

> Spec: [`./spec.md`](./spec.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: Draft

> **Vive durante a execução.** Diferente da `spec.md` (imutável após In Review),
> este arquivo é atualizado conforme o entendimento técnico evolui. Decisões
> revisitadas devem registrar a anterior em nota, não apagar o histórico.

---

## 🛰️ Stage 1 / Stage 2

> **Stage 1 (Research → Gate humano)** está encerrado em 2026-05-09. O `decision-brief.md` fechou os Blocos A, B, C e D, resolvendo: fonte primária do estado, taxonomia de artefatos de valor, root `.governance/`, placement documental, fronteira foundation/ADR, reorganização de `.core/rules/`, re-arquitetura da CLI, Living Documentation e composição atômica.
>
> **Stage 2 (Design + Implementação)** passa a materializar essas decisões de forma integrada. O trabalho não se reduz à nova CLI: ele precisa preservar os eixos A/B do gate e usar os Blocos C/D como fundação técnica para executar o novo modelo Governance-Driven. O recorte executável da 0021 continua terminando nas Fases 1, 2 e 3; Fases 4 e 5 ficam apenas mapeadas.

---

## 🧭 Estado Pós-Gate

- `[DEC-0021-A01]` confirmou YAML versionado no repositório como base do estado canônico repo-first híbrido.
- `[DEC-0021-A02]` consolidou os 6 pilares de valor: `spec`, `exploration`, `fix`, `patch`, `incident`, `proposal`.
- `[DEC-0021-A03]` aprovou `.governance/` como root unificado do consumidor, com `registry.yml` visível na raiz do workspace.
- `[DEC-0021-B01]` manteve o corte Fases 1–3 agora e 4–5 depois.
- `[DEC-0021-B02]`, `[B03]`, `[B04]` e `[B05]` fecharam placement documental, modelo híbrido, fronteira foundation/ADR e reorganização de `.core/rules/`.
- `[DEC-0021-C01]` expandiu formalmente o Stage 2 para re-arquitetura total da CLI em DDD + TDD/BDD e Living Documentation orientada por `[BR-CLI-*]`.
- `[DEC-0021-D01]` descartou o espelhamento cego de boilerplates e aprovou composição modular por `partials` e `recipes`.

**Implicação operacional:** o Stage 2 precisa ser planejado como implementação arquitetural integrada, não como soma de tarefas isoladas de path rename, doc cleanup ou refactor local de CLI.

---

## 🏗️ Design e Arquitetura

### Princípio guia

A 0021 precisa responder simultaneamente a duas camadas:

1. **Arquitetura de informação do framework**: onde o estado vive, como os gêneros documentais se organizam e como os 6 pilares de valor entram no fluxo repo-first.
2. **Fundação técnica do runtime**: como a CLI, os templates, os testes e a documentação executável passam a sustentar esse modelo sem drift.

A implementação deve seguir o princípio **repo-first híbrido** e evitar quatro desvios:

- manter Markdown narrativo como storage primário permanente;
- introduzir banco/serviço externo cedo demais;
- trocar apenas nomes de paths sem atacar o acoplamento legado da CLI;
- inverter a SSOT para testes sem normalizar a taxonomia e o pipeline de extração.

### [A] Estado canônico e taxonomia de valor

**Estado atual do legado:**

- `backlog.md` e `historico.md` concentram memória narrativa, mas não operam como registro estruturado consultável.
- O framework ainda carrega forte inércia espec-cêntrica, apesar de a pesquisa e o gate já terem aprovado outros tipos de origem de valor.
- O estado atual depende de convenção editorial mais do que de contrato de domínio.

**Arquitetura-alvo:**

- `.governance/registry.yml` passa a ser o estado primário versionado do workspace.
- O modelo de domínio precisa representar explicitamente os 6 pilares de valor, seus IDs, status, relações e regras mínimas de promoção/resolução.
- `backlog.md`, `historico.md` e visões futuras passam a ser derivados do estado estruturado, nunca o inverso.

**Decisões executáveis derivadas do gate:**

- provar o modelo com lote mínimo que inclua pelo menos uma origem não-spec, uma spec e uma entrega relacionada;
- impedir que o novo registry nasça com shape ocultamente espec-cêntrico;
- manter Fases 4 e 5 apenas mapeadas, sem antecipar banco, dashboard ou backend como fonte primária.

### [B] Placement documental e arquitetura informacional

**Estado atual do legado:**

- `.core/process/spec-foundation.md` mistura constituição viva, regras de lifecycle e decisões arquiteturais que já merecem outro gênero.
- `docs/`, `adrs/`, `.core/rules/`, `.specify/` e raiz do repo convivem sem uma política final coerente de placement.
- `.specify/templates/` ainda ocupa um lar tático herdado da 0020 e incompatível com a decisão de composição modular.

**Arquitetura-alvo:**

- o framework adota um modelo híbrido: catálogo canônico curto + reorganização física dirigida.
- a constituição operacional do ciclo vivo fica em um foundation document renomeado/refatorado; decisões estáveis e cross-spec migram seletivamente para ADRs.
- `.core/rules/` deve refletir melhor a taxonomia final aprovada, alinhando topologia, compilação e consumo.
- `docs/` deixa de ser uma ilha órfã; seu conteúdo útil precisa ser redistribuído para um lar canônico ou explicitamente depreciado.

**Decisões executáveis derivadas do gate:**

- tratar placement e depreciação documental como parte da spec, não como arrumação posterior;
- alinhar README, CONTRIBUTING, AGENTS, templates distribuídos e help da CLI com a nova topologia;
- garantir que `build:rules`, catálogos e smoke tests acompanhem a reorganização de `.core/rules/`.

### [C] Re-arquitetura da CLI e workspace do consumidor

**Estado atual do legado:**

- a CLI atual é funcional, mas cresceu por agregação reativa e acoplamento de paths, modos e assets.
- `config.mjs`, `templates.mjs`, `pointers.mjs`, `args.mjs` e os testes de integração ainda codificam `.ai-guidelines/`, `.specify/templates/` e o contrato monolítico atual.
- o runtime publicado, o help da CLI e a superfície do pacote ainda distribuem o modelo anterior.

**Arquitetura-alvo:**

- a nova CLI deve ser redesenhada sob DDD + TDD/BDD.
- `GovernanceWorkspace` resolve root, layout físico, migração e compatibilidade com legado.
- `Registry` modela o estado versionado.
- `RulesEngine` mantém a compilação e projeção das regras.
- `TemplateEngine` governa recipes, partials, montagem e validação estrutural.
- `LivingDocumentation` extrai e publica regras `[BR-CLI-*]`.
- `Application` orquestra os casos de uso `init`, `adopt`, `providers`, `update`, `status` e afins sem carregar a lógica de domínio em si.

**Decisões executáveis derivadas do gate:**

- a camada de compatibilidade com `.ai-guidelines/` e `.specify/` deve ser explícita e temporária;
- mudanças em package publish surface, workflows, smoke tests e help fazem parte do mesmo redesign;
- o root `.governance/` não pode ser implementado como alias superficial sobre a estrutura antiga.

### [D] Living Documentation e composição modular

**Estado atual do legado:**

- parte da suíte já usa IDs `[BR-CLI-*]`, `[BR-GIT-*]`, `[BR-BUILDER-*]`, etc., mas a taxonomia ainda é inconsistente.
- não existe pipeline canônico que extraia essas regras e publique um artefato estruturado do que realmente está coberto/rodando.
- o sync atual de templates ainda espelha arquivos inteiros de `.specify/templates/`, o que contradiz a decisão do Bloco D.

**Arquitetura-alvo:**

- os testes `[BR-CLI-*]` viram a SSOT do comportamento da CLI.
- uma pipeline de extração por AST parsing ou reporter dedicado gera artefato estruturado dentro de `.governance/`.
- `recipes` pertencem ao domínio `TemplateEngine` e modelam como um artefato final é montado.
- `partials` são blocos Markdown completos e válidos por contrato, nunca fragmentos arbitrários.

**Decisões executáveis derivadas do gate:**

- a normalização da suíte de testes é pré-condição para uma Living Documentation confiável;
- a validação de render final precisa ser estrutural, não apenas visual;
- o abandono do mirror de arquivos inteiros deve ocorrer só depois de a nova recipe engine estar pronta para substituí-lo.

---

## 🧩 Domínios da Nova CLI

### `Registry`

- Responsável por schema, IDs, tipos de artefato, relações, promotion rules e serialização do `registry.yml`.
- Não contém lógica de renderização de documentos finais.

### `GovernanceWorkspace`

- Resolve root `.governance/`, paths internos, layout do workspace, migrações e compatibilidade com consumidores legados.
- Centraliza a política de leitura/escrita dos diretórios canônicos.

### `RulesEngine`

- Responsável por parser, build, catálogo, compilação monolítica e projeções de regras.
- Precisa acompanhar a reorganização física de `.core/rules/` sem quebrar CI e publish.

### `TemplateEngine`

- Responsável por `recipes`, `partials`, slots, assembly e validação de Markdown.
- `registry.yml` informa estado e tipagem; as receitas pertencem a este domínio.

### `LivingDocumentation`

- Responsável por varrer a suíte de testes, extrair `[BR-CLI-*]`, gerar artefatos estruturados e proteger o sistema contra drift.
- Deve operar como API declarativa viva para humans, IA e futuras projeções de status.

### `Application / Use Cases`

- Camada fina que orquestra comandos como `init`, `adopt`, `providers`, `update`, `status` e futuras automações.
- Não deve acumular lógica de path, templates, regras ou merge de runtime diretamente.

---

## 🔄 Estratégia de Transição

### Sequência segura

1. Fechar documentalmente o Stage 1 nos artefatos da spec.
2. Modelar os bounded contexts e isolar a fundação da nova CLI.
3. Introduzir camada explícita de compatibilidade com paths legados.
4. Reestruturar root `.governance/`, assets e publish surface.
5. Normalizar a suíte `[BR-CLI-*]` e ativar Living Documentation.
6. Implementar recipes + partials e só então remover o mirror de boilerplates integrais.
7. Atualizar placement documental, docs públicas, CI, hooks e smoke tests.

### Compatibilidade com legado

- Leitura de `.ai-guidelines/` e `.specify/` deve existir só como bridge de migração.
- O contrato final distribuído ao consumidor precisa falar em `.governance/`, não em alias oculto.
- A smoke suite precisa validar instalação via tarball já sobre a nova topologia.

### Impactos transversais obrigatórios

- `package.json` publish surface e scripts.
- workflows de CI e smoke multi-OS.
- hooks Husky.
- README, CONTRIBUTING, AGENTS e help textual da CLI.
- testes de integração que hoje afirmam a existência de `.ai-guidelines/` e `.specify/templates/`.

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

### Componente [A]

- [ ] `[DEC-0021-A01]` refletido em contrato explícito de estado primário repo-first híbrido.
- [ ] `[DEC-0021-A02]` refletido em taxonomia concreta dos 6 pilares de valor.
- [ ] Stage 2 prova o modelo com lote pequeno e representativo, não centrado apenas em specs.

### Componente [B]

- [ ] `[DEC-0021-B02]`, `[B03]`, `[B04]` e `[B05]` refletidos no placement final, foundation document, ADRs e topologia de `.core/rules/`.
- [ ] A decisão sobre templates distribuídos deixa de depender de `.specify/templates/` como lar tático permanente.
- [ ] A documentação pública e operacional deixa de apontar para a arquitetura antiga.

### Componente [C]

- [ ] `[DEC-0021-A03]` refletido no contrato do workspace do consumidor com `.governance/` como root canônico.
- [ ] `[DEC-0021-C01]` refletido em bounded contexts, linguagem ubíqua e casos de uso da nova CLI.
- [ ] A camada de compatibilidade com o legado está explícita e controlada.

### Componente [D]

- [ ] `[DEC-0021-D01]` refletido em `recipes` + `partials` + validação estrutural do render.
- [ ] O sync de templates deixa de ser espelhamento cego de boilerplates inteiros.
- [ ] Os testes `[BR-CLI-*]` alimentam artefato estruturado em `.governance/` sem drift.

### Globais (toda a spec)

- [ ] Pipeline de format/lint verde (ex.: `yarn check`).
- [ ] Suíte de testes verde (ex.: `yarn test`) com cobertura adequada para a nova fundação da CLI.
- [ ] Smoke tarball validado com a nova topologia do consumidor.
- [ ] Diff em consumidor real revisado: zero quebras, quando a spec tocar contrato distribuído ao consumidor.

---

## 🧪 Estratégia de Testes

- **Domínio / BDD**: cobrir `Registry`, `GovernanceWorkspace`, `TemplateEngine` e `LivingDocumentation` com testes de comportamento rastreáveis.
- **Integração**: validar que o workspace consegue produzir estado, runtime e artefatos compostos coerentes a partir do novo root `.governance/`.
- **Living Documentation**: testar extração, determinismo do artefato e falha por drift.
- **Smoke**: validar tarball publicado/local instalado em Windows, Linux e macOS com a nova topologia.
- **Manual**: revisar contrato final contra a fricção observada no consumidor `site`, especialmente onboarding, root unificado e update idempotente.

---

## 🛠️ Arquivos modificados (esperado)

- `.specify/specs/0021-governance-information-architecture/spec.md` — contrato da spec.
- `.specify/specs/0021-governance-information-architecture/plan.md` — design vivo.
- `.specify/specs/0021-governance-information-architecture/tasks.md` — execução viva.
- `.specify/specs/0021-governance-information-architecture/decision-brief.md` — gate Stage 1 já fechado.
- `.specify/specs/0021-governance-information-architecture/NEXT.md` — débitos conscientes.
- `.specify/specs/roadmap/backlog.md` — status da spec e eventuais implicações da migração.
- `.core/process/spec-foundation.md` ou sucessor renomeado — contrato canônico do lifecycle Governance-Driven.
- `.specify/specs/research-index.md` — se a reorganização do placement de research exigir ajuste.
- `.core/rules/**` e artefatos gerados em `_meta/` — reorganização física + alinhamento do builder.
- `cli/**` — re-arquitetura da CLI e casos de uso do novo workspace.
- `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `docs/**`, workflows, hooks e testes smoke/integração — alinhamento da topologia e do contrato distribuído.

---

## ⚠️ Riscos técnicos (concretos)

| Risco                                                                | Mitigação                                                                                                          |
| :------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------- |
| Root `.governance/` virar apenas rename cosmético sobre CLI acoplada | Atacar primeiro bounded contexts e camada de compatibilidade explícita; só depois cortar paths legados.            |
| Registry nascer espec-cêntrico por inércia                           | Exigir lote mínimo de prova com pelo menos uma origem não-spec, uma spec e uma entrega relacionada.                |
| Living Documentation nascer incompleta ou enganosa                   | Normalizar a taxonomia dos testes `[BR-CLI-*]`, testar extração e falhar CI por drift.                             |
| Partials gerarem Markdown válido porém semanticamente quebrado       | Validar montagem por slots/blocos e rodar checks estruturais no render final.                                      |
| Reorganização física ampla gerar churn em links, build e smoke       | Sequenciar foundation → compatibilidade → migração → cleanup, com atualização atômica de código, docs e pipelines. |
| Publish surface continuar distribuindo contrato antigo               | Revisar `package.json`, assets incluídos no tarball e smoke tests antes de considerar a migração concluída.        |

---

## 📐 Decisões revisitadas

- **2026-05-09** — O Stage 2 deixou de ser descrito apenas como materialização do modelo repo-first híbrido e passou a incorporar formalmente a re-arquitetura da CLI, Living Documentation e composição modular. **Motivo:** decisões `[DEC-0021-C01]` e `[DEC-0021-D01]` fecharam que a arquitetura de informação e a fundação técnica da ferramenta são inseparáveis nesta spec.
