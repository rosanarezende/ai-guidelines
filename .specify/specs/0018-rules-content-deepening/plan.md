# Plan — Spec 0018 Rules Content Deepening

> Spec: [`./spec.md`](./spec.md)
> Status: Draft

---

## 🏗️ Design e Arquitetura

### Princípio guia

Enriquecer o payload de contexto (`global-rules.md` e `quality-gates.md`) com densidade técnica, transformando-os de "guias de conduta" em "manuais de engenharia para IA", mantendo a concisão para não inflar desnecessariamente o consumo de tokens.

### Componentes ou Sub-blocos

#### [A | Refinamento do global-rules.md]

**Estado atual**: Foco principal em como a IA deve interagir com a codebase (PT-BR, model routing, ciclos RPI, restrição de `git push`). Contém pouco sobre _como_ o código gerado deve ser estruturado.

**Decisão**:

- Adicionar uma seção "Padrões Arquiteturais e de Código" no `global-rules.md`.
- Incluir regras normativas sobre:
  - Tipagem estrita e rejeição de "hacks" de TypeScript (ex: `any`, `as unknown`).
  - Gerenciamento de estado (imutabilidade preferida).
  - Tratamento de erros (fail-fast, logs estruturados).
  - Concorrência (evitar locks desnecessários, tratar race conditions comuns).

**Mudanças em arquivos**:

- `.core/rules/global-rules.md` — Expansão de conteúdo.

#### [B | Aprimoramento do quality-gates.md]

**Estado atual**: Lista abstrata de verificações (ex: "Race Conditions", "N+1 Queries").

**Decisão**:

- Expandir o tópico "Bugs Típicos de IA (Sensores)" com instruções diretas sobre _como_ a IA deve auditar seu próprio código para esses problemas.
- Fornecer heurísticas curtas para o agente (ex: "Para detectar N+1, verifique se operações de DB/API ocorrem dentro de loops; se sim, exija batching").

**Mudanças em arquivos**:

- `.core/rules/opt-in/quality-gates.md` — Expansão e detalhamento heurístico.

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

### Componente [A] (Global Rules)

- [ ] `global-rules.md` atualizado com a nova seção normativa.
- [ ] As diretrizes adicionadas não contradizem as regras procedurais existentes (RPI, Git Push).

### Componente [B] (Quality Gates)

- [ ] `quality-gates.md` atualizado com heurísticas de detecção para N+1, Race Conditions e Memory Leaks.

### Globais (toda a spec)

- [ ] `yarn check && yarn test` verde.
- [ ] Verificação manual via comando CLI (ex: rodando `node cli/ai-guidelines-cli.mjs compile`) para garantir que os arquivos são mesclados corretamente e mantêm formatação legível.

---

## 🧪 Estratégia de Testes

- **Unit/BDD**: Rodar testes existentes para garantir que a injeção de rules não quebre assertions de formatação ou parsing.
- **Manual**: Compilar um `AGENTS.md` de teste para validar o tamanho final e legibilidade humana do bloco `<AI_GUIDELINES>`.

---

## 🛠️ Arquivos modificados (esperado)

- `.core/rules/global-rules.md` — Expansão das regras de engenharia.
- `.core/rules/opt-in/quality-gates.md` — Detalhamento das heurísticas de sensor.
- `.specify/specs/roadmap/backlog.md` — Atualizado para refletir a nova prioridade e remover do backlog o que virou esta spec.

---

## ⚠️ Riscos técnicos (concretos)

| Risco                        | Mitigação                                                                                                                                          |
| :--------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aumento drástico de tokens   | Usar linguagem hiper-concisa, no formato de heurísticas (bullet points) em vez de prosa extensa.                                                   |
| Quebra de testes de snapshot | Alguns testes do CLI podem ter snapshots do conteúdo do `AGENTS.md` gerado. Atualizar os snapshots se necessário, mantendo a estrutura XML válida. |
