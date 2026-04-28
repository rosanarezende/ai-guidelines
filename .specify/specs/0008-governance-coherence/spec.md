# Spec 0008 — Governance Coherence

> Status: In Review
> Author: Rosana Rezende
> Date: 2026-04-23
> Owner: Rosana Rezende
> Plan: [`./plan.md`](./plan.md)

> **Princípio de imutabilidade:** após status `In Review`, este arquivo só
> muda por consenso explícito. Decisões em aberto vão para `plan.md` (vivo).

> **Fusão consolidada:** absorve as candidatas 0005-B (filtro doc → rules), 0008
> (consolidação RPI ↔ spec-foundation) e 0010 (consolidação AI Efficiency Guide)
> registradas no `ROADMAP.md`. Inclui também o sub-bloco D — Step 0 (Environment
> Awareness) levantado em 2026-04-23, o sub-bloco E — Quality Gates
> (opt-in feature), derivado da pesquisa de transcrições, e o sub-bloco G — ADR
> de visibilidade pública, fundido em 2026-04-24 (segunda rodada de review)
> porque a decisão de visibilidade altera o contrato do Sub-bloco F (README /
> CONTRIBUTING).

---

## 🎯 Objetivo

Eliminar a **incoerência interna do baseline** (`AGENTS.md` + `.core/rules/` +
`.core/docs/`) que hoje fragmenta a governança em cinco frentes simultâneas:

1. **Filtro doc → rules**: `.core/docs/` mistura conteúdo humano e regras
   acionáveis para IA; o consumidor não recebe `docs/` (correto, pós-Spec 0005),
   mas as regras editoriais que vivem ali ficam órfãs e geram links quebrados.
2. **RPI vs spec-foundation**: dois protocolos de planejamento sobrepostos
   sem canonização explícita de quando cada um se aplica.
3. **AI Efficiency Guide**: referências dispersas em `AGENTS.md`,
   `global-rules.md` (duplicação interna) e `~/.gemini/GEMINI.md`, sem
   framework coeso.
4. **Step 0 — Environment Awareness**: o agente não tem prescrição explícita
   para detectar plataforma/IDE/modelo antes de agir, gerando comandos errados
   e respostas pouco assertivas.
5. **Quality Gates editoriais para código gerado por IA**: hoje o baseline não
   prescreve nenhum padrão objetivo para verificar código gerado por agente
   antes do merge.
6. **Onboarding e contribuição confusos**: `README.md` é institucional;
   `CONTRIBUTING.md` é genérico. Falta caminho explícito por persona
   (humano novo, humano experiente, agente IA), e workflows são duplicados
   entre `README` / `CONTRIBUTING` / `AGENTS.md` com versões divergentes.
7. **Decisão de visibilidade pública em aberto**: o repo `ai-guidelines` é
   privado; decisão de torná-lo público está registrada como pendente na
   memória há semanas. Sem ela tomada formalmente, o tom de
   `README.md` e `CONTRIBUTING.md` que o Sub-bloco F vai reescrever fica
   indefinido (institucional/interno vs convite à comunidade BR). Escrever
   uma versão e reescrever depois = churn garantido.

**Resultado esperado:** contrato de governança coeso com responsabilidade única
por arquivo (estendendo o ADR 0004), referências auditáveis, nenhum link
quebrado em `AGENTS.md`/`global-rules.md` quando o baseline é injetado em
consumidor (`adopt`), distinção formal entre regras universais (mandatory
core) e regras opt-in de stack, e gates editorialmente prescritos como
checklist mínimo (com handoff técnico para a Spec 0009 — Harness Engineering).

---

## 🔬 Pesquisa de contexto

Esta spec foi enriquecida em 2026-04-23 com a leitura de 6 transcrições de
vídeos sobre práticas reais de desenvolvimento com IA em 2025-2026:

- [`research/synthesis.md`](./research/synthesis.md) — síntese consolidada,
  com impacto explícito por sub-bloco e justificativa dos spinoffs (Specs
  0011, 0012, 0014).
- 5 transcrições em [`research/transcripts-*.md`](./research/) (Diego/
  Rocketseat + Lucas Montano × 4).

---

## 🧠 Decisão de Fusão

### Critério aplicado

> _"Se a entrega de um item altera o contrato de outro, devem ser specs
> separadas."_

### Análise

| Sub-bloco                                       | Arquivo principal modificado                                                                                                | Sobreposição |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------ |
| A. Filtro doc → rules (ex 0005-B)               | `.core/rules/global-rules.md`, `.core/docs/*`                                                                               | alta         |
| B. Consolidação RPI ↔ spec-foundation (ex 0008) | `AGENTS.md`, `global-rules.md`, `rpi-protocol.md`, `docs/process/spec-foundation.md` + templates SDD + reformulação ROADMAP | alta         |
| C. Consolidação AI Efficiency (ex 0010)         | `AGENTS.md`, `global-rules.md`, `ai-efficiency-guide.md`                                                                    | alta         |
| D. Step 0 — Environment Awareness (OBS)         | `AGENTS.md` (Phase 0), `global-rules.md`                                                                                    | alta         |
| E. Quality Gates (opt-in feature)               | `cli/features/opt-in/quality-gates.mjs`, `.core/rules/quality-gates.md`                                                     | média        |
| F. Onboarding e contribuição                    | `README.md`, `CONTRIBUTING.md`, `AGENTS.md` (cross-ref)                                                                     | média        |
| G. ADR de visibilidade pública                  | `docs/adr/0007-visibilidade-publica-ai-guidelines.md` (novo) + memória atualizada + possíveis exclusões                     | alta com F   |

### Conclusão

**Fundir as sete como uma única spec** porque:

1. Quatro delas modificam **os mesmos dois arquivos canônicos** (`AGENTS.md` e
   `.core/rules/global-rules.md`); E adiciona uma feature opt-in nova mas
   compartilha as decisões de classificação universal vs opt-in feitas em A;
   F mexe nos documentos de entrada (README/CONTRIBUTING) que precisam refletir
   tudo o que A-E decidem (templates SDD novos, sub-blocos opt-in, etc.).
2. **A é pré-requisito conceitual de B, C, D, E e F**: sem decidir o que é
   regra acionável vs documentação humana, **e** o que é regra universal vs
   opt-in de stack, não dá para canonizar onde os demais sub-blocos moram nem
   como contribuidores devem operar.
3. F aplica **Single Source of Truth** (mesma classe de problema do ADR 0004,
   agora estendido a documentação humana), reforçando o tema central da spec.
4. **G altera o contrato de F** (tom do README/CONTRIBUTING muda radicalmente
   se o repo for público vs privado). Sem fundir, F escreveria uma versão e
   reescreveria depois da ADR — churn garantido.
5. Custo de spec separada (cerimônia, ROADMAP, branch, PR, review) >> custo de
   tratar como spec única com sub-blocos auditáveis.

---

## 📦 Escopo

### Dentro do escopo

- Filtro editorial `doc → rules` com classificação adicional **universal vs
  opt-in de stack** (sub-bloco A).
- Canonização da hierarquia RPI ↔ spec-foundation (sub-bloco B), incluindo:
  - 4 templates SDD novos/refeitos (`spec`/`plan`/`tasks`/`next`).
  - 2 templates faltantes (`roadmap-boilerplate`, `research-index-boilerplate`).
  - Reformulação do formato do ROADMAP para eliminar renumeração (candidatas
    por slug; pasta `roadmap/` com 2 arquivos pendente de pesquisa de
    benchmarks).
- Consolidação de Eficiência de IA (sub-bloco C).
- Phase 0 enriquecido com Environment Check (sub-bloco D).
- Nova feature opt-in `quality-gates` no CLI + `.core/rules/quality-gates.md`
  injetado no consumidor quando ativada (sub-bloco E).
- Reclassificação de `tdd-guidelines.md` como **opt-in de stack** (não core
  mandatory): consumidor que não usa testes não recebe.
- Onboarding e contribuição (sub-bloco F): README + CONTRIBUTING refatorados
  com caminhos por persona; Single Source of Truth aplicado.
- ADR de visibilidade pública (sub-bloco G): decisão formalizada em
  `docs/adr/0007-visibilidade-publica-ai-guidelines.md` antes de F executar,
  garantindo tom coerente do README/CONTRIBUTING.

### Fora do escopo (vira spinoff)

- **Spec 0006 (publicação npm)** — independente; não envolve coerência
  editorial.
- **Spec 0009 (Harness Engineering)** — implementa **tecnicamente** os gates
  editoriais que E prescreve. Sub-bloco E entrega o checklist; 0009 entrega
  os sensores e validators multi-agente.
- **Spec 0011 (candidata)** — Hierarquia de regras por subdiretório
  (insight Diego/Rocketseat). Mexe no CLI; diferente do escopo editorial de A.
- **Spec 0012 (candidata)** — Segurança de IA tools / supply chain (insight
  Vercel/Contex.ai). Audiência humana, artefatos diferentes.
- **Spec 0014 (candidata)** — Quota Awareness Dashboard (insight pesquisa +
  decisão registrada 2026-04-24). Visualizador opt-in de quotas/tokens. Sub-bloco
  C apenas documenta como interpretar quotas; visualizador automático fica
  para 0014.
- **Spec 0015 (prioridade Now)** — Auditoria de inflado (decisão registrada
  2026-04-24, terceiro tema do review). Limpeza de pastas/arquivos
  herdados de outros projetos (`skills/`, `mcp/`, `cinematic-ui-boilerplates`,
  `advanced-ai-patterns`, `design/`, etc.) que não pertencem a um framework
  AI-governance puro. Diferente da 0008 (escopo editorial e construtivo) —
  é destrutivo, cruza com a decisão de visibilidade pública e merece
  reflexão própria. **Ordem de execução revisada (2026-04-24, segunda
  rodada):** 0015 roda **entre** `feat/spec-0008-A-B` e `feat/spec-0008-F-G`,
  não depois de toda a 0008 — assim o Sub-bloco G decide visibilidade com
  repo já curado e o Sub-bloco F reescreve README/CONTRIBUTING sobre
  estrutura final.
- **Spec 0016 (candidata)** — Roadmap Adapters / SDD Extension System.
  Feature opt-in `cli/features/opt-in/adapters/` com subadapters
  (`github-projects`, `github-issues`, `jira`, `linear`) que sincronizam
  `backlog.md` ↔ tracker externo. Decisão (2026-04-24, segunda rodada):
  mantida separada porque é implementação técnica substancial; executada
  **após 0008 completa** (pré-requisitos: formato `backlog.md` canonizado,
  decisão de visibilidade tomada e repo curado).
- **Detecção técnica de ambiente no CLI** — Spec 0005 já cobre detecção do
  **repo alvo**. Sub-bloco D foca em prescrição editorial para a IA usar a
  informação de ambiente que já recebe do harness.

---

## ✅ Critérios de Aceite (alto nível)

Critérios observáveis que indicam "spec está pronta para Done". DoD operacional
detalhado por sub-bloco vive em [`plan.md`](./plan.md).

- [ ] Nenhum link quebrado em `.ai-guidelines/rules/global-rules.md` injetado
      no consumidor real (verificável via diff `adopt --dry-run`).
- [ ] `AGENTS.md` (raiz + template) com Phase 0 enriquecido (Environment
      Check) e regras 8/9 distinguindo spec-foundation de plano leve.
- [ ] `global-rules.md` com seções consolidadas: "Workflow com IA",
      "Eficiência de IA" (única, não duas), e referência opt-in a Quality
      Gates.
- [ ] Feature opt-in `quality-gates` disponível no CLI (`--with-quality-gates`
      ou via wizard, recomendado por default mas pulável).
- [ ] `tdd-guidelines.md` reclassificado como opt-in (consumidor não recebe
      por default a menos que ative).
- [ ] `README.md` e `CONTRIBUTING.md` com caminhos por persona, sem
      duplicação de workflow entre documentos (Single Source of Truth).
- [ ] ROADMAP reformulado: candidatas por slug, sem renumeração quando
      prioridade muda. Templates `roadmap-boilerplate` e
      `research-index-boilerplate` criados.
- [ ] ADR de visibilidade pública criada e mergeada; memória
      `project_ai_guidelines_visibilidade_publica.md` atualizada com
      status "decidido" + link para a ADR.
- [ ] Os 3 bloqueadores do PR #19 resolvidos (template L19, global-rules
      L37/L39, dead code DEFAULT_AI_GUIDELINES_REF).
- [ ] `yarn check && yarn test` verde.
- [ ] PR Draft com matriz preenchida; conversão para Ready apenas após
      revisão humana.

---

## 🛠️ Dependências e impactos (alto nível)

### Pré-requisitos

- Spec 0005 mergeada (✓ — pointer architecture estabilizada).
- PR `fix/core-migration-cleanup` #19 mergeado (✓ — referências `.core/`
  corretas em arquivos ativos).

### Specs afetadas

- **Spec 0009** (Harness Engineering) — sub-bloco E inclui handoff explícito;
  ROADMAP atualizado neste mesmo PR.
- **Spec 0011** (candidata, Hierarquia de regras) — pode reabrir decisão sobre
  estrutura de `.core/rules/<topic>/` se sub-bloco A promover regras como
  diretórios.
- **Spec 0014** (candidata, Quota Dashboard) — sub-bloco C documenta
  manualmente o que 0014 vai automatizar.

### Riscos macro

- **Quebra silenciosa em consumidor real** — texto de regras muda, agentes
  já calibrados podem reinterpretar. Mitigação: diff em consumidor antes de
  mergear; sem força bruta.
- **Sobrecarga editorial** — promover muitas regras de docs para rules
  engorda `global-rules.md`. Mitigação: critério objetivo "imperativa →
  regra; explicativa → doc".
- **Adoção da nova categoria opt-in** — distinção universal vs opt-in é
  mudança conceitual; pode confundir contribuidores. Mitigação: documentar
  no `CONTRIBUTING.md` ou em `spec-foundation.md`.

### Decisão de visibilidade pública

**Revisado em 2026-04-24 (segunda rodada):** a decisão de visibilidade foi
absorvida como Sub-bloco G desta spec. Razão: altera o contrato do
Sub-bloco F (tom do README/CONTRIBUTING). A spec continua sendo exemplo
de "governança evolui via SDD" e fica visível quando o repo for público.

---

## 📚 Referências

- ADR 0004 (Governança de Responsabilidade Única) — pré-requisito conceitual.
- Spec 0005 (CLI Adopt Refactor) — estabeleceu pointer architecture e o
  princípio "core mandatory vs opt-in" que E estende para Quality Gates/TDD.
- ROADMAP.md — entradas originais 0005-B, 0008, 0010 (consolidadas aqui).
- OBS registrada em 2026-04-23 — origem do sub-bloco D.
- Pesquisa registrada em 2026-04-23/24 — origem do sub-bloco E e dos spinoffs 0011,
  0012, 0014.
