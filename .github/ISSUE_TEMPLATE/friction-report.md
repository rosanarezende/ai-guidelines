---
name: 🪨 Friction report
about: Reportar incoerência de governança, contradição entre docs/regras, ou candidata a ADR
title: "[FRICTION] "
labels: friction
assignees: ""
---

## Fricção observada

<!-- Onde a governança travou ou contradiz? Cite arquivos e linhas. -->

## Contexto

<!-- O que você estava tentando fazer? Que regra/doc consultou? -->

## Evidência

<!-- Cite com path + line number. Ex.: -->

- `AGENTS.md:42` diz X
- `.core/rules/global-rules.md:17` diz Y (contradiz X)
- `CONTRIBUTING.md:89` repete X com versão diferente

## Tipo de fricção (marque o que se aplica)

- [ ] **Regras conflitantes** entre `AGENTS.md` / `global-rules.md` /
      `CONTRIBUTING.md` / outro
- [ ] **Documentação confusa** ou desatualizada (descreve estado antigo)
- [ ] **Single Source of Truth violado** — mesmo workflow em 2+ lugares
      com versões diferentes
- [ ] **Link quebrado** em arquivo sincronizado para consumidor
- [ ] **Decisão arquitetural ambígua** — candidata a ADR
- [ ] **Outro:** <!-- descreva -->

## Sugestão (opcional)

<!-- Como você acha que deveria ser? Que doc é a fonte da verdade? -->

## Vira ADR?

- [ ] Sim — esta fricção exige decisão arquitetural formalizada.
- [ ] Não — é só correção de doc/regra existente.
- [ ] Talvez — depende da discussão.

---

> Fricções de governança são bem-vindas! São como o framework evolui.
> Antes de submeter, leia
> [`adrs/`](../../adrs/) e
> [`CONTRIBUTING.md`](../../CONTRIBUTING.md) seção "Workflows por persona".
