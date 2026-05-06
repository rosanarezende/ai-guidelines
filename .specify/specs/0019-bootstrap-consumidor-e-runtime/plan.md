# Plan — Spec 0019 Bootstrap Consumidor e Runtime

> Spec: [`./spec.md`](./spec.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: Draft

---

## 🛰️ Stage 1 / Stage 2

> **Stage 1 (Research → opções).** Coletar evidência, preencher `decision-brief.md` com pontos em status `Pendente` e aguardar Gate humano (Aplica-se ao sub-bloco B).
>
> **Stage 2 (Design + Implementação).** Sub-bloco A (CLI Wizard e Template Sync) entra direto. Sub-bloco B (Arquitetura do Runtime e Trampolins) aguarda Gate.

---

## 📚 Research Lifecycle

> Arquivos de pesquisa que fundamentam o `decision-brief.md`.

- `research/2026-05-06-trampolins-e-guardrails.md` — Responde: Como mitigar o Context Rot gerando scaffolding de inicialização de providers na CLI? (Alimenta `[DEC-0019-B01]`).
- `research/2026-05-06-topologia-runtime.md` — Responde: Qual deve ser a hierarquia e as divisões semânticas (zonas) do AGENTS.md para deixá-lo legível e menos monolítico? (Alimenta `[DEC-0019-B02]`).

---

## 🏗️ Design e Arquitetura

### Princípio guia

Separar as mudanças da CLI (determinísticas) da governança de templates/trampolins e arquitetura final do payload (evidence-driven).

### Componentes ou Sub-blocos

#### [A | CLI Wizard & Template Distribution] `(deterministic)`

**Estado atual**:
CLI pergunta as features numa lista flat. Não copia `.specify/templates` para o destino.

**Decisão**:

- Refatorar wizard (`cli.mjs` ou módulo interativo correspondente) para agrupar escolhas (ex: Editoriais vs. CI/CD vs. Processo).
- Atualizar módulo de `init`/`adopt` para realizar a cópia controlada do diretório `.specify/templates/` da origem para dentro de `.ai-guidelines/templates` no repo consumidor.
- Remoção definitiva do arquivo legado `.core/templates/AGENTS-pointer.md.tmpl` e de suas referências, já que o modelo de pointer único foi descontinuado.

**Mudanças em arquivos**:

- `cli/ai-guidelines-cli.mjs` (ou arquivos dentro de `cli/features/`) — Refatoração do prompt interativo e workflow de deploy.

#### [B | Runtime Architecture & Trampolines] `(evidence-driven)`

**Estado atual**:
O compilador constrói um `AGENTS.md` monolítico que ainda sofre de redundâncias e inclui um ponteiro frágil. Arquivos de adapter (`CLAUDE.md`, etc) proliferam sem controle no consumidor.

**Decisão**:
[Placeholder Stage 2: aguardando `decision-brief.md` sobre scaffolding de trampolins e estrutura topológica do AGENTS]

**Mudanças em arquivos**:

- `cli/features/core/compiler.mjs` e afins.

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

### Componente [A]

- [ ] O CLI agrupa corretamente as categorias ao rodar interativamente.
- [ ] Templates em `.specify/templates/` são escritos em `.ai-guidelines/templates/` no projeto-alvo.
- [ ] O template `.core/templates/AGENTS-pointer.md.tmpl` e menções no código da CLI foram removidos.

### Componente [B]

- [ ] [Placeholder Stage 2]
- [ ] [Placeholder Stage 2]

### Globais (toda a spec)

- [ ] Pipeline de format/lint verde (`yarn check`).
- [ ] Suíte de testes verde (`yarn test`).

---

## 🧪 Estratégia de Testes

- **Unit/BDD**: Testes de CLI e prompts interativos em `cli.integration.test.mjs` e `compiler.test.mjs`.

---

## 🛠️ Arquivos modificados (esperado)

- `cli/ai-guidelines-cli.mjs` — Atualização do wizard.
- `cli/features/core/compiler.mjs` — Atualização do builder/compilador de runtime.
- `cli/features/core/pointers.mjs` — [Dependente da decisão B]

---

## ⚠️ Riscos técnicos (concretos)

| Risco                                                                         | Mitigação                                                       |
| :---------------------------------------------------------------------------- | :-------------------------------------------------------------- |
| Quebra de testes de snapshots da Spec 0018 devido a mudanças no header/layout | Atualizar explicitamente snapshots da suíte de BDD ao compilar. |

---

## 📐 Decisões revisitadas

_(Vazio no início)_
