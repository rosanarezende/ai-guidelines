<!--
TÍTULO do PR deve seguir o padrão em .core/process/pr-title-conventions.md:
  [<emojis>] [<label-opcional>] [<identificador>] <título curto>

Identificador aceita:
  [Spec NNNN] — PR vinculado a uma spec
  [<pillar>]  — PR vinculado a pilar MECE não-spec (fix, patch, spike, etc.)

Combinações canônicas:
  [🧾🔒] [Spec 0023] Lifecycle bootstrap                          — governance pareada
  [🛠️1️⃣➜] [Spec 0023] Enforcement runtime                       — execution intermediária
  [🛠️2️⃣] [Spec 0023] DX execution                                — execution terminal
  [🛠️] [Spec 0041] Clipboard hotfix                              — execution isolada (spec)
  [🛠️] [fix] Reorganize package.json scripts                     — execution isolada (pillar)
  [🛠️➜] [Bootstrap] [Spec 0023] Workflow runtime                — transitional/pre-model
  [🚑] [Incident 0007] Emergency rollback                        — fast-track

Emojis são conjunto fechado. Nuances usam labels textuais fechadas
([Bootstrap], [Pre-model], [Hotfix]). Pillars lowercase, alinhados com
WorkItem.kind do registry (cf. taxonomia MECE Spec 0021).
-->

## PR Type

- [ ] 🧾 Governance / Thinking — spec/decision-brief/plan/tasks/research/ADR
- [ ] 🛠️ Execution — código + docs derivados
- [ ] 🚑 Fast-track — patch/fix/incident pequeno com accountability transferida ao reviewer (cf. ADR 0021)

## Stack Dependencies

- [ ] Este PR pode ser mergeado isoladamente (sem `🔒` nem `➜` no título)
- [ ] 🔒 Governance contract pendente de execution PR(s) pareada (`[🧾🔒]`; declare execution PRs no body opening)
- [ ] 🛠️N➜ Execution intermediária — posição N na stack, com PR(s) downstream (declare upstream + downstream no body opening)
- [ ] 🛠️N Execution terminal — posição N na stack, sem PRs downstream (declare upstream no body opening)

## Label de nuance (opcional)

- [ ] `[Bootstrap]` — PR colapsa governance+execution antes da estabilização metodológica da spec
- [ ] `[Pre-model]` — PR criado antes do lifecycle/enforcement da spec estar cravado
- [ ] `[Hotfix]` — fix urgente que precisa visibilidade mas não se qualifica como 🚑 fast-track

## Resumo

<!-- Descreva a mudança de forma objetiva. -->

## Linked Issue

<!-- Use `#123` para a issue principal desta entrega. Se não houver issue, deixe vazio. -->

## Spec Path

<!-- Caminho para a spec em .specify/specs/<slug>/ se houver. Ex: .specify/specs/0004-ai-dev-foundations-public-ready/ -->

## No-Spec Reason

<!-- Se não houver spec, justifique: ajuste rápido (typo, wording, config menor), bugfix urgente, etc. -->

## Tipo de Mudança

<!-- Marque o que se aplica: -->

- [ ] ✨ Funcionalidade (feat) — nova capacidade no CLI, framework ou docs
- [ ] 🐛 Correção (fix) — correção de comportamento incorreto
- [ ] 📄 Documentação (docs) — guias, referências, processos, ADRs
- [ ] ⚙️ Configuração (chore) — CI, scripts, dependências, estrutura
- [ ] 🗂️ Refatoração (refactor) — sem mudança de comportamento externo

## Contexto e Motivação

<!-- Qual dor, risco ou oportunidade motivou esta mudança? -->

## Impacto Downstream (Breaking Changes)

<!-- Esta mudança afeta repositórios que consomem este framework? Liste instruções de migração se houver quebra de compatibilidade. -->

## Checklist

- [ ] Commits atômicos (uma unidade lógica por commit, mensagem em PT-BR)
- [ ] Branch dedicada (nunca direto em `main`)
- [ ] Executei `yarn format` antes do push
- [ ] Executei `yarn validate` antes do push (format:check + build + test + living-docs:check)
- [ ] Documentei decisões arquiteturais relevantes em `adrs/`
- [ ] Atualizei `tasks.md` da spec correspondente (se aplicável)
- [ ] Revisei risco de contexto pessoal, credenciais ou artefatos operacionais vazados
- [ ] Confirmei que a mudança segue o contrato arquitetural existente ou documenta a divergência
- [ ] Verifiquei se a mudança exige atualização manual em repositórios que consomem este framework (via `adopt`)
- [ ] **Este PR está em modo Draft** (converter para Ready somente após aprovação humana)

## Disclosure de IA

<!-- Este PR foi gerado ou co-gerado por IA? Qual agente/modelo? -->
<!-- Ex: "Gerado com Gemini 3 Flash via Antigravity, revisado pelo mantenedor humano" -->
