---
name: ✨ Feature proposal
about: Propor nova feature opt-in, nova regra universal, ou novo adapter
title: "[FEAT] "
labels: enhancement
assignees: ""
---

## Resumo

<!-- Em 1-2 frases: o que você está propondo? -->

## Tipo de proposta (marque o que se aplica)

- [ ] **Nova feature opt-in** (análoga a `prettier`, `husky`, `ci`,
      `quality-gates`, `tdd` em `cli/features/opt-in/`)
- [ ] **Nova regra universal** (entra em `.core/rules/global-rules.md`,
      mandatory para todos os consumidores)
- [ ] **Novo adapter** (Claude / Gemini / Codex / Cursor / outro)
- [ ] **Adapter de integração** (GitHub Projects / Jira / Linear /
      Notion — ver Spec 0016 candidata)
- [ ] **Outro:** <!-- descreva -->

## Problema que resolve

<!-- Qual dor concreta motiva esta feature? Caso de uso real, não hipotético. -->

## Proposta

<!-- Como funcionaria? Comando, flag, configuração, comportamento esperado. -->

```bash
# exemplo de uso esperado
npx ai-guidelines adopt --with-<feature>
```

## Impacto em consumidores existentes

<!-- Breaking change? Migração? Default sugerido (opt-in vs opt-out)? -->

## Alternativas consideradas

<!-- Por que esta abordagem? O que você descartou e por quê? -->

## Critério "varia por stack?"

- [ ] **Sim** — opt-in (segue princípio Spec 0005: o que varia por stack
      é opt-in).
- [ ] **Não** — universal (regra/feature mandatory).
- [ ] **Misto** — explique abaixo.

## Próximos passos sugeridos

<!-- Vira candidata em backlog.md? Spec dedicada? Issue exploratória? -->

---

> Antes de submeter, leia [`CONTRIBUTING.md`](../../CONTRIBUTING.md)
> seção "Workflows por persona — Feature ou refactor".
