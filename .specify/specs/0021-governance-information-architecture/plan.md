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

> **Stage 1 (Research → opções).** Consolidar a evidência já coletada em 2026-05-08, fechar lacunas residuais e cristalizar no `decision-brief.md` as opções sobre: fonte primária de estado, classes de artefato, fronteira `sdd_dir` vs `spec_workspace_dir`, política de placement documental e envelope Fases 1–3 vs 4–5. Nenhum design físico definitivo entra antes do gate.
>
> **Stage 2 (Design + Implementação).** Depois do gate humano, a spec deve materializar as decisões aprovadas em contrato arquitetural, layout/versionamento do registro estruturado, visões derivadas mínimas e ajustes de placement/documentação necessários. O recorte executável da 0021 termina nas Fases 1, 2 e 3; Fases 4 e 5 ficam apenas mapeadas.

---

## 📚 Research Lifecycle

> Perguntas de Stage 1 e os insumos que já as alimentam.

- **Q1. Qual é a fonte primária de estado do framework?**  
  Alimenta `[DEC-0021-A01]`. Base inicial: `.specify/specs/researchs/architecture/2026-05-08-repo-first-structured-registry.md`.
- **Q2. Como artefatos não-spec entram como origem de valor sem virar conhecimento solto?**  
  Alimenta `[DEC-0021-A02]`. Base inicial: o mesmo research de registro estruturado + backlog da candidata 0021.
- **Q3. Qual é a fronteira entre `sdd_dir`, eventual `spec_workspace_dir` e o lar físico do estado estruturado?**  
  Alimenta `[DEC-0021-A03]`. Base inicial: `.specify/specs/researchs/architecture/2026-05-08-consumer-bootstrap-frictions.md`.
- **Q4. O que exatamente a 0021 entrega agora e o que apenas mapeia para depois?**  
  Alimenta `[DEC-0021-B01]`. Base inicial: backlog da 0021 + research de registro estruturado § 9–11.
- **Q5. Como a política de placement documental e os gêneros ausentes/futuros ficam resolvidos sem implementar tudo agora?**  
  Alimenta `[DEC-0021-B02]`. Base inicial: backlog da 0021 + `.core/process/spec-foundation.md` + débito herdado da 0020 sobre `.specify/templates/`.
- **Q6. A política canônica deve nascer como catálogo central, reorganização física ou híbrido?**  
  Alimenta `[DEC-0021-B03]`. Base inicial: backlog original da candidata 0021, especialmente o escopo potencial de `INFORMATION-CATALOG.md` vs reorganização física.
- **Q7. Que tipo de decisão sai de `spec-foundation.md` e vira ADR?**  
  Alimenta `[DEC-0021-B04]`. Base inicial: `[DEC-0018-A06]` + débito explícito de migração arquitetural em `.core/process/spec-foundation.md`.
- **Q8. O `.core/rules/` atual precisa reorganização física interna no repo?**  
  Alimenta `[DEC-0021-B05]`. Base inicial: backlog original da candidata 0021 + distinção formal com a Spec 0011.

> **Nota operacional do Stage 1:** a spec nasce reaproveitando evidence package já migrado para `.specify/specs/researchs/architecture/`. Só criar `./research/` local novo se o gate abrir uma pergunta que os insumos atuais não resolvam.

---

## 🏗️ Design e Arquitetura

### Princípio guia

Antes de mover arquivos ou automatizar comandos, a 0021 precisa fechar a pergunta estrutural: qual é o estado canônico do framework e como cada gênero documental ou artefato de valor se conecta a esse estado. A implementação deve seguir o princípio **repo-first híbrido** e evitar dois desvios: transformar Markdown narrativo em storage único permanente ou introduzir banco/serviço externo como fonte primária cedo demais.

### Componentes ou Sub-blocos

#### [A | Estado Canônico Repo-First Híbrido]

**Estado atual** (baseline antes da spec):

- `backlog.md` e `historico.md` são a memória viva mais acessível para humanos e IA, mas concentram status e relacionamentos em Markdown narrativo.
- O framework ainda é spec-cêntrico: PRDs, incidentes, frictions e entregas `no-spec` existem como insumo, mas não como entidades canônicas de primeira classe.
- Não existe um registro estruturado versionado que permita derivar backlog/histórico sem parsing frágil de narrativa.

**Decisão**:

Stage 1 precisa fechar se o estado canônico será um registro estruturado dentro do repositório, quais invariantes esse modelo preserva e qual lote mínimo de migração prova o fluxo sem cair em big-bang. Stage 2 só poderá introduzir diretórios, schema e visões derivadas depois de `[DEC-0021-A01]` e `[DEC-0021-A02]` estarem resolvidos.

**Mudanças em arquivos**:

- `<path do registro estruturado, a definir em [DEC-0021-A03]>` — novo storage canônico versionado.
- `.specify/specs/roadmap/backlog.md` — passa a refletir o modelo derivado ou a política de derivação.
- `.specify/specs/roadmap/historico.md` — idem.
- `.core/process/spec-foundation.md` — explicitar a fonte primária e o papel de Markdown derivado.

#### [B | Placement Documental e Gêneros de Valor]

**Estado atual** (baseline antes da spec):

- `.core/process/spec-foundation.md` é constituição operacional viva, mas carrega débito explícito de migração arquitetural.
- `docs/`, `adrs/`, `.core/rules/`, raiz e `.specify/` convivem sem catálogo canônico de gêneros e sem reserva formal para PRD/intake, handoff e telemetria.
- `.specify/templates/` continua num lar tático herdado da 0020, apesar de ser artefato distribuído pelo framework.

**Decisão**:

Stage 1 precisa separar duas camadas: (1) placement de gêneros documentais do meta-framework; (2) artefatos de origem de valor que alimentam o estado estruturado. O gate deve dizer o que fica em `.core/`, o que permanece em `adrs/`, `docs/`, `.specify/` e qual é o lar reservado para gêneros ausentes/futuros. A decisão também precisa tratar o placement canônico de `.specify/templates/` sem quebrar o fluxo já publicado.
Stage 1 também precisa fechar três perguntas que estavam melhor formuladas no backlog original da candidata e não podem ficar implícitas:

- qual é o **carrier canônico** da política de informação: catálogo central, reorganização física direcionada ou híbrido;
- se decisões atômicas hoje embutidas em `spec-foundation.md` devem continuar ali ou migrar seletivamente para ADRs;
- se o `.core/rules/` atual exige reorganização física interna no repo, distinguindo isso explicitamente da fragmentação distribuída do consumidor (Spec 0011).

**Mudanças em arquivos**:

- `.core/process/spec-foundation.md` — remoção de dívida ou redirects, conforme o gate.
- `adrs/**` — se o gate decidir que parte do conteúdo hoje embutido em `spec-foundation.md` deve migrar para ADRs formais.
- `.core/rules/**` — se o gate aprovar reorganização física interna alinhada à taxonomia final.
- `.specify/specs/research-index.md` — eventual ajuste de framing se o placement de research mudar.
- `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `docs/**` — ajustes de links/ponteiros se houver reorganização física.
- `cli/features/core/templates.mjs` e adjacentes — se a decisão sobre `.specify/templates/` exigir alinhamento de código.

#### [C | Contrato do Workspace do Consumidor]

**Estado atual** (baseline antes da spec):

- O consumidor recebe `sdd_dir` como contrato de runtime/documentação distribuída, mas não existe um conceito formal de `spec_workspace_dir`.
- A fricção observada em consumo real mostra que falta um bootstrap explícito do sistema documental e falta resposta única sobre onde specs, backlog, histórico e memória correlata devem viver.

**Decisão**:

Stage 1 precisa definir se `spec_workspace_dir` passa a existir como conceito formal, qual é o default canônico, como ele se distingue de `sdd_dir` e como futuros comandos consomem essa separação. A decisão também precisa dizer onde o registro estruturado mora em relação a esse workspace.

**Mudanças em arquivos**:

- `.core/process/spec-foundation.md` — definição do contrato.
- `.specify/templates/project-config-boilerplate.md` ou equivalente — se o contrato exigir surfaced config futura.
- `cli/features/core/config.mjs` e docs futuras — apenas se o gate decidir que a spec já deve alinhar naming/contrato, sem implementar os comandos finais.

#### [D | Envelope de Entrega da 0021]

**Estado atual** (baseline antes da spec):

- O backlog e o research já apontam uma sequência em cinco fases, mas a fronteira exata entre "entregar agora" e "mapear para depois" ainda não está congelada em artefato formal de spec.

**Decisão**:

Stage 1 deve travar que esta spec entrega **Fase 1 (contrato), Fase 2 (registro estruturado no repo) e Fase 3 (visões derivadas mínimas)**, enquanto **Fase 4 (SQLite/projeção local)** e **Fase 5 (dashboard/superfície de produto)** ficam apenas descritas como evolução. O gate também precisa decidir qual lote mínimo de migração prova o modelo sem exigir retro-migração total.

**Mudanças em arquivos**:

- `.specify/specs/0021-governance-information-architecture/tasks.md` — Fase 1+ derivada do gate.
- `<scripts ou geradores, se o gate aprovar>` — geração de Markdown derivado/status estruturado.
- `.specify/specs/roadmap/backlog.md` / `historico.md` — prova inicial do modelo derivado, se entrar no Stage 2.

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

### Componente [A]

- [ ] `[DEC-0021-A01]` fechado com invariantes explícitas para a fonte primária do estado.
- [ ] `[DEC-0021-A02]` fechado com classes de artefato, relações mínimas e regra de promoção/resolução.
- [ ] Stage 2 prova o modelo com um lote pequeno e representativo, não centrado apenas em specs.

### Componente [B]

- [ ] `[DEC-0021-B02]` fechado com catálogo canônico de placement documental e reserva de lar para gêneros futuros.
- [ ] `[DEC-0021-B03]` fechado com o carrier da política de arquitetura de informação explicitado.
- [ ] `[DEC-0021-B04]` fechado com a fronteira entre constituição/processo vivo e decisões que merecem ADR formal.
- [ ] `[DEC-0021-B05]` fechado com decisão explícita sobre o placement interno de `.core/rules/` no repo.
- [ ] A decisão sobre `.specify/templates/` fica explícita com impacto documentado para CLI e documentação.

### Componente [C]

- [ ] `[DEC-0021-A03]` fechado com definição de `sdd_dir`, `spec_workspace_dir`, defaults e fronteira de responsabilidade.
- [ ] O contrato deixa claro onde futuros comandos de bootstrap/status vão se acoplar sem cristalizar implementação prematura.

### Componente [D]

- [ ] `[DEC-0021-B01]` fechado com escopo da própria 0021: Fases 1–3 entram; Fases 4–5 ficam apenas mapeadas.
- [ ] A estratégia de migração inicial evita big-bang histórico e define um conjunto mínimo de prova.

### Globais (toda a spec)

- [ ] Pipeline de format/lint verde (ex.: `yarn check`).
- [ ] Suíte de testes verde — XX/XX (ex.: `yarn test`), ou registro explícito de não-aplicabilidade técnica se a entrega for puramente documental sem efeito executável.
- [ ] Diff em consumidor real revisado: zero quebras, quando a spec tocar contrato distribuído ao consumidor.

---

## 🧪 Estratégia de Testes

- **Unit/BDD**: se Stage 2 introduzir geradores ou schema parser, cobrir com testes dedicados no `cli/` ou em helpers de estado derivado.
- **Integração**: validar que um lote mínimo do registro estruturado consegue derivar `backlog.md`/`historico.md` sem perda de legibilidade.
- **Manual**: revisar o contrato resultante contra o caso real do consumidor `site`, especialmente na fronteira `sdd_dir` vs `spec_workspace_dir`.

---

## 🛠️ Arquivos modificados (esperado)

- `.specify/specs/0021-governance-information-architecture/spec.md` — contrato da spec.
- `.specify/specs/0021-governance-information-architecture/plan.md` — design vivo.
- `.specify/specs/0021-governance-information-architecture/tasks.md` — execução viva.
- `.specify/specs/0021-governance-information-architecture/decision-brief.md` — gate Stage 1.
- `.specify/specs/0021-governance-information-architecture/NEXT.md` — débitos conscientes.
- `.specify/specs/roadmap/backlog.md` — status da spec e, no Stage 2, eventual prova derivada.
- `.core/process/spec-foundation.md` — contrato canônico de estado/placement.
- `.specify/specs/research-index.md` — se a reorganização do placement de research exigir ajuste.
- `<path do registro estruturado, a definir>` — introdução do storage canônico repo-first.
- `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `docs/**`, `cli/features/core/templates.mjs` — apenas se o gate confirmar reorganização física com impacto nesses pontos.

---

## ⚠️ Riscos técnicos (concretos)

| Risco                                                                  | Mitigação                                                                                                                        |
| :--------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| Registry nascente ficar spec-cêntrico e não provar artefatos não-spec  | Exigir lote mínimo de prova com pelo menos uma origem não-spec, uma spec e uma entrega relacionada.                              |
| Formalizar `spec_workspace_dir` cedo demais e quebrar UX futura        | Tratar a decisão como contrato, não como comando pronto; validar contra o caso real do consumidor antes de cristalizar defaults. |
| Reorganização física ampla gerar churn desnecessário em links e código | Separar Stage 1 (contrato) de Stage 2 (migração controlada), com redirects/ponteiros quando necessário.                          |
| Schema crescer demais antes de validar o fluxo mínimo                  | Diferenciar campos obrigatórios de recomendados e rejeitar maximalismo no gate.                                                  |

---

## 📐 Decisões revisitadas

_(Nenhuma ainda — spec recém-instanciada. Revisitas pós-gate serão registradas aqui.)_
