# Spec 0015 — Auditoria Destrutiva

> Status: Active
> Author: Antigravity
> Date: 2026-04-25
> Owner: Rosana Rezende
> Plan: [`./plan.md`](./plan.md)

---

## 🎯 Objetivo

Executar a limpeza definitiva de arquivos obsoletos na pasta `.core/docs/` e consolidar o baseline sincronizado do repositório. O foco é remover ruído e garantir que apenas documentação acionável e atualizada permaneça no core.

- O **problema real**: Acúmulo de arquivos de documentação antigos, duplicados ou superados por novas regras em `.core/rules/`.
- O **resultado esperado**: Uma estrutura limpa em `.core/docs/`, com mapeamento claro de onde a informação foi parar (regras, histórico ou deleção).

---

## 📦 Escopo

### Dentro do escopo

- Auditoria e deleção de arquivos em `.core/docs/` marcados como obsoletos.
- Migração de conteúdo residual relevante para `.core/rules/` ou `.specify/specs/history/` (se aplicável).
- Limpeza de referências quebradas após a deleção.
- Atualização do Roadmap para refletir a conclusão desta auditoria.

### Fora do escopo

- Refatoração profunda de regras existentes (apenas migração de conteúdo faltante).
- Alterações no CLI (ai-guidelines-cli).

---

## ✅ Critérios de Aceite (alto nível)

- [ ] Arquivos listados como "DELETE" em `mapping-doc-to-rules.md` removidos.
- [ ] Arquivos listados como "MOVE" ou "CONSOLIDATE" devidamente processados.
- [ ] `.core/docs/` contém apenas arquivos ativos e essenciais.
- [ ] `yarn check && yarn test` verde.
- [ ] PR Draft atualizado e revisado.

---

## 🛠️ Dependências e impactos (alto nível)

- **Pré-requisitos**: Spec 0008 (Sub-blocos A e B) concluídos.
- **Riscos macro**: Perda acidental de contexto histórico importante (mitigado pelo mapeamento prévio).

---

## 📚 Referências

- Spec 0008: Governance Coherence.
- Mapping: `.specify/specs/0008-governance-coherence/research/mapping-doc-to-rules.md`.
