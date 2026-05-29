<!-- ai-guidelines-template: spec-boilerplate v=1 -->

# Spec 0024 — Handoff as First-Class (Sistema de Seleção Contextual Governado)

> Status: Draft
> Author: Rosana Rezende + Claude Sonnet 4.6 + ChatGPT (tri-party, sessão 2026-05-28)
> Date: 2026-05-28
> Owner: Rosana Rezende
> Tipo de spec: evidence-driven
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Plan: [`./plan.md`](./plan.md)

> **Princípio de imutabilidade:** após status `In Review`, este arquivo só
> muda por consenso explícito. Decisões em aberto vão para `decision-brief.md`.
>
> **Slug provisional.** O nome `handoff-as-first-class` foi herdado da entry de backlog. A formulação que emergiu na sessão de planejamento (2026-05-28) é mais ampla: **sistema de seleção contextual governado, onde handoff é a primeira projeção**. O slug pode evoluir quando a research consolidar (ex.: `contextual-governance-and-handoff`). Mantido por ora para preservar continuidade com backlog e ADR 0022.

---

## 🎯 Objetivo

O framework `ai-guidelines` consolidou-se como **governance-first** (ADR 0018), entregou o runtime operacional (Spec 0023), e absorveu o princípio de **bootstrap situado** (ADR 0022 — Aceita 2026-05-28). Durante o fechamento da Spec 0023 e a sessão de planejamento desta spec, uma formulação mais profunda do problema emergiu da operação real:

> **O problema central não é memória; é seleção contextual.** Memória é mecanismo; seleção é o problema; governança é a restrição; handoff é a projeção.

Sistemas existentes (Hermes Agent, Cursor SDK, Open Code, Anthropic Dreaming, Spec Kitty) convergem para resolver "como o agente lembra?". O ai-guidelines opera uma camada acima: **como o sistema decide o que merece ser lembrado, projetado e quando**. Essa é a tese a investigar antes de implementar.

Resultado esperado quando esta spec encerrar:

- Decision-brief com 5 eixos (Seleção / Persistência / Promoção / Projeção / Governança) `Resolved` por evidência empírica + análise comparativa de 5+ sistemas externos.
- `plan.md` v2 cravando design técnico do **handoff como projeção**, ancorado nas decisões do brief.
- `tasks.md` v2 com tasks operacionais de Stage 2 (implementação) derivadas do plan v2.
- Análise comparativa publicada em `research/` mostrando convergências e divergências entre soluções de mercado e a leitura governance-first do ai-guidelines.

O comando `workflow handoff` (implementação) **não é entrega desta spec** — vira spec própria após Stage 1 fechar, com escopo derivado das decisões cravadas aqui.

---

## 📦 Escopo

### Dentro do escopo

- **Stage 1 (Research)**: investigação dos 5 eixos via comparação com sistemas existentes (Hermes Agent, OpenCloud/OpenCode, Cursor SDK, Anthropic Dreaming in Cloud, Spec Kitty, e sistemas baseados em grafos quando referência específica for recuperada).
- **Bloco A — Síntese empírica (preâmbulo)**: observações cravadas desta sessão e do fechamento da Spec 0023 como evidência inicial.
- **Blocos por eixo (Seleção / Persistência / Promoção / Projeção / Governança)**: cada eixo vira bloco de DECs com perguntas abertas no início; opções populadas conforme research consolidar.
- **Bloco Saúde Técnica (mandatório)**: análise de saúde do componente de runtime que abrigará o handoff (escopo emerge da própria research).
- **`research/` artifacts**: matriz comparativa sistemas × eixos; análise per-fonte; síntese final.
- **Critério de saída da research** declarado explicitamente: cada um dos 5 eixos tem ≥ 1 resposta evidence-backed; ≥ 2 sistemas estudados convergem em ≥ 2 dessas respostas; Bloco A consegue cravar ≥ 3 observações empíricas com cross-ref aos artifacts.
- **Gate humano** fecha decision-brief; `plan.md` v2 + `tasks.md` v2 derivam linearmente das decisões cravadas.

### Fora do escopo (vira spinoff ou fica em outra spec)

- **Implementação do comando `workflow handoff`** — vira spec própria (provavelmente 0025) com escopo derivado das decisões cravadas em 0024. Decisão de design técnico **não cabe** em research-first spec.
- **Cutover dos stubs por canal** (`.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md` reduzidos a ≤ 10 linhas): adiamento intencional — exige handoff implementado primeiro. Per ADR 0022, é "consequência de médio prazo".
- **`AGENTS.md` raiz refactoring** — mantido como SSOT atual; revisita quando handoff materializar.
- **Memory engine implícito / vector store / graph database** — viola o framing "seleção, não memória"; explicitamente fora.
- **Auto-promoção de padrões a regras pelo agente** — viola ADR 0018 + ADR 0022 + framing "governança como autoridade".
- **Dashboard / HTML como SSOT** — escopo de `governance-dashboard-and-visual-artifacts` (backlog Now §2); herda anti-paper de ADR 0023.
- **Substituição do `workflow continue` resumido** — handoff é boot frio; continue é continuação intra-fluxo. São complementares.

---

## ✅ Critérios de Aceite (alto nível)

- [ ] `research/` contém ≥ 5 artifacts comparativos cobrindo todos os sistemas declarados em escopo.
- [ ] Matriz pressão × sistema preenchida com evidência para cada célula relevante.
- [ ] Critério de saída da research satisfeito (≥ 1 resposta por eixo; ≥ 2 sistemas convergem em ≥ 2 respostas; Bloco A com ≥ 3 observações cravadas).
- [ ] `decision-brief.md` `Resolved` em todos os blocos de eixo + Saúde Técnica; Bloco A populado e estável.
- [ ] `plan.md` v2 publicado: design técnico de handoff derivado linearmente das decisões; cada subseção cita `[DEC-0024-XYZ]` ancorante.
- [ ] `tasks.md` v2 publicado: tasks operacionais Stage 2 derivadas do plan v2.
- [ ] Pipeline `yarn format ; yarn validate` verde.
- [ ] PR Draft revisado e aprovado por humano antes de Ready.
- [ ] Não-objetivos cravados continuam respeitados ao longo de todo o ciclo (auditoria final no encerramento).

---

## 🔬 Pesquisa de contexto

- [`./decision-brief.md`](./decision-brief.md) — gate humano de decisões pré-design; estruturado pelos 5 eixos.
- [`./research/2026-05-28-pressure-axes-scope.md`](./research/2026-05-28-pressure-axes-scope.md) — define os 5 eixos + matriz vazia + critério de saída.
- [`./research/2026-05-28-this-session-as-evidence.md`](./research/2026-05-28-this-session-as-evidence.md) — captura a sessão de planejamento desta spec (tri-party emergente) como primeiro evidence artifact.
- Spec 0021 — fundação governance-first (`AGENTS.md` como output runtime, não autoridade SSOT sprawling).
- Spec 0023 — entregou runtime operacional (state.yml, wizard, governance-pr-check); evidência empírica que motivou ADR 0022.
- ADR 0018 — `governance-first, AI-as-Channel`: nenhum LLM no runtime; restrição arquitetural canônica.
- ADR 0022 — `Handoff situado em estado precede distribuição pré-carregada` (Aceita 2026-05-28); fundamento ontológico desta spec.

---

## 🧠 Decisão de Fusão

Esta spec **não absorve** outras candidatas formalmente — `handoff-as-first-class` já era entry consolidada do backlog (absorveu "Arquitetura de regras portáveis vs. contexto framework-interno" em 2026-05-22 antes mesmo de virar spec). Continua honrando a consolidação anterior; não há fusão nova.

Possível absorção futura (a confirmar quando research consolidar): se a investigação revelar que `governance-dashboard-and-visual-artifacts` (Now §2) tem dependência arquitetural forte sobre o sistema de projeção definido aqui, considerar fusão antes de abrir spec separada.

---

## 🛠️ Dependências e impactos (alto nível)

- **Pré-requisitos:**
  - Spec 0023 mergeada ✅
  - ADR 0022 Aceita ✅ (PR #29, 2026-05-28)
- **Specs afetadas:**
  - `governance-dashboard-and-visual-artifacts` (backlog Now §2) — pode ganhar ou perder relevância dependendo do que a research desta spec revelar sobre projeções multi-consumidor.
  - `boilerplate-system-modernization` (backlog Now §3) — pode ganhar requisito derivado se boilerplates precisarem instrumentar handoff/projection points.
- **Cross-refs com specs irmãs:**
  - **Spec 0023** — fronteira: 0023 entregou runtime operacional (lookup + estado + wizard); 0024 investiga como o runtime decide o que projetar para quem. Motivo: 0023 era operação; 0024 é seleção/projeção governada.
- **Riscos macro:**
  - **Spec deriva para memory systems** — perde framing "seleção como problema, governança como restrição". Mitigação: não-objetivos cravados; auditoria contínua no Bloco B (Persistência) para garantir que "o que persiste" não vira "como persistir".
  - **Spec congela ontologia cedo demais** — pesquisar features em vez de pressões arquiteturais. Mitigação: research estruturada por eixos (não por sistemas), com critério de saída explícito.
  - **"4ª camada" de contexto sem desativar a 2ª** — risco herdado da entry de backlog. Mitigação: política de migração obrigatória declarada quando spec implementadora (0025?) abrir.

Detalhamento técnico (riscos por componente, mitigações) emerge no `plan.md` v2 pós-gate.

---

## 📚 Referências

- Specs relacionadas: **0021** (governance-first foundation), **0023** (runtime operacional).
- ADRs aplicáveis: **ADR 0018** (AI-as-Channel; restritivo), **ADR 0022** (handoff situado precede distribuição; fundamento), **ADR 0023** (meta-artefatos YAML SSOT; aplicável apenas a projeções tipo dashboard, não ao handoff).
- Evidência empírica externa (vídeos comparativos sobre Hermes Agent, Cursor SDK, Open Code, HTML vs Markdown): URLs canônicas e síntese estruturada em [`./research/2026-05-28-pressure-axes-scope.md § Fontes primárias citáveis`](./research/2026-05-28-pressure-axes-scope.md). Transcrições brutas mantidas localmente em `temp/` durante o ciclo da spec (não-versionadas por copyright; cobertas em `.gitignore`).
- Sessão de planejamento 2026-05-28 — branch `feat/spec-0024-handoff-as-first-class`, commits desta spec; tri-party Rosana + Claude + ChatGPT registrado em `research/2026-05-28-this-session-as-evidence.md`.
