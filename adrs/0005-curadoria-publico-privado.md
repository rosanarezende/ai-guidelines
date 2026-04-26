# ADR 0005 — Curadoria Público/Privado

**Status**: Aceita  
**Data**: 2026-04-21  
**Spec relacionada**: trabalho anterior de public-ready hygiene, preservado
no archive privado

---

## Contexto

A spec 0004 prepara o repositório `ai-guidelines` para visibilidade pública.
Antes do flip, é necessário uma decisão explícita e documentada sobre o que
pode ser exposto e o que deve permanecer restrito — tanto por privacidade
pessoal quanto por segurança operacional.

O repositório contém três categorias de conteúdo com naturezas distintas:

1. **Código e documentação agnóstica** — Frameworks, regras de engenharia,
   templates de governança: projetados para ser reusáveis por qualquer
   equipe ou agente.
2. **Specs e decisões arquiteturais** — `.specify/specs/` documenta o processo
   de construção do framework. Valioso como showcase de SDD em ação.
3. **Memória de contexto pessoal** — `.specify/memory/` contém a "constituição"
   do agente e contexto pessoal da mantenedora: **não deve ser público**.

Adicionalmente, artefatos operacionais temporários (`.ai-runtime/`, payloads
de debug) nunca devem ser versionados — regra já expressa no `AGENTS.md`.

---

## Decisão

### Categorias e Tratamento

| Camada                     | Conteúdo                                    | Visibilidade       | Rationale                                 |
| -------------------------- | ------------------------------------------- | ------------------ | ----------------------------------------- |
| **CLI e lógica**           | `cli/`, `tests/`                            | ✅ Público         | Core do framework — showcase de qualidade |
| **Regras e docs**          | `rules/`, `docs/`, `templates/`, `skills/`  | ✅ Público         | Propósito agnóstico e reutilizável        |
| **Identidade do repo**     | `AGENTS.md`, `README.md`, `CONTRIBUTING.md` | ✅ Público         | Governança pública e onboarding           |
| **Specs e ADRs**           | `.specify/specs/`, `adrs/`                  | ✅ Público         | Showcase de SDD em ação                   |
| **Memória pessoal**        | `.specify/memory/`                          | 🔒 Restrito        | Contexto pessoal e identidade da usuária  |
| **Config global de IA**    | `~/.gemini/`, `~/.claude/`                  | 🔒 Fora do repo    | Reside fora do repositório por design     |
| **Artefatos operacionais** | `.ai-runtime/`, logs temporários            | 🔒 Nunca versionar | Regra já no `AGENTS.md`                   |
| **Infra de dependência**   | `.yarn/`, `node_modules/`                   | 🔒 Gitignore       | Padrão de mercado                         |

### Sanitização antes do flip

Antes de tornar o repositório público, executar a varredura manual (task D.9)
verificando:

1. `.specify/memory/` — confirmar que não está indexado (verificar `.gitignore`)
2. Histórico de commits — confirmar ausência de dados pessoais (e-mail,
   senhas, tokens) em qualquer mensagem ou conteúdo versionado
3. Comentários e textos inline — verificar menções a dados pessoais em
   arquivos de código ou docs

### Mecanismo de manutenção

Dois controles recorrentes para evitar regressão após o flip:

1. **Checklist no PR template** (campo existente em `.github/pull_request_template.md`):
   — "Este PR expõe dados pessoais ou artefatos operacionais?"

2. **Auditoria periódica**: Toda spec de `public-ready hygiene` futura
   deve incluir task de varredura equivalente à D.9.

---

## Consequências

### Positivas

- Decisão explícita e rastreável sobre o que é público — sem ambiguidade.
- Mecanismo de manutenção embutido no fluxo de PR (sem custo extra).
- `.specify/specs/` pública serve como showcase de SDD em ação para
  contribuidores externos e recrutadores técnicos.

### Negativas / Riscos

- `.specify/memory/` exige atenção ativa no `.gitignore` e em D.9 (varredura
  manual) — risco residual se o arquivo for movido ou renomeado sem atualização.

### Ação futura

- **D.9** — Varredura manual confirma a sanitização antes do flip real.
- **D.10** — Gate humano (mantenedor) valida a prontidão pública após D.9.
- Feature **CLI `audit`** (registrada no `roadmap/backlog.md`): poderá automatizar
  parte dessa varredura no futuro.

---

_Pesquisa de suporte: `.specify/specs/researchs/0004-ai-dev-foundations-public-ready/benchmarks-public-oss.md` §6_
