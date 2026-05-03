# Mapping doc → rules (Sub-bloco A — Task 0.4)

> Classificação tripla de cada arquivo em `.core/docs/` segundo a distinção
> formal introduzida pela Spec 0008:
>
> - **humano** — pura documentação explicativa. Mantém em `.core/docs/`. Não
>   vai ao consumidor (consistente com pós-Spec 0005).
> - **universal** — regra acionável de governança IA. Promove para
>   `.core/rules/global-rules.md` ou `.core/rules/<topic>.md`. Vai ao
>   consumidor sempre (mandatory core).
> - **opt-in** — regra de stack/processo. Vai para `.core/rules/<feature>.md`
>   com feature correspondente em `cli/features/opt-in/`. Vai ao consumidor
>   só se feature ativada (wizard ou flag).

Critério objetivo: **imperativo** (DEVE/NÃO DEVE/USE) → regra; **descritivo**
(este guia explica…) → doc humano.

---

## Classificação por arquivo

### `.core/docs/advanced-ai-patterns.md` — humano

**Conteúdo:** RAG com Pinecone, padrões por provider (Google/Anthropic/OpenAI/
Copilot), automação via MCP, segurança de credenciais.

**Decisão:** humano descritivo. Nenhuma regra imperativa nova aqui não coberta
em outros lugares:

- Seção 4 "Segurança de Credenciais" duplica a regra 3 de `global-rules.md`
  (chaves de API). Sem ação em A.
- Resto é guia sobre tech específica; pertence à categoria que a **Spec 0015**
  vai reavaliar (herança de outro projeto ou vale como doc público se o repo
  for aberto).

**Ação em 0008-A:** nenhuma. Aguarda Spec 0015.

---

### `docs/ai-efficiency-guide.md` — mixed (universal + humano)

**Conteúdo:** pilares agnósticos (RPI, Modularidade Atômica, Feedback
Cirúrgico), deep dive por tool, matriz multi-modelo.

**Decisão:** as **regras imperativas** (pilares, hierarquia de contexto, dica
de performance) são consolidadas em `.core/rules/global-rules.md` seção
"Eficiência de IA" **pelo sub-bloco C**, não A. Resto continua em
`docs/ai-efficiency-guide.md` como deep dive humano (consultado na
fonte do ai-guidelines, não sincronizado ao consumidor).

**Ação em 0008-A:** nenhuma. Este arquivo é alvo do sub-bloco C.

---

### `.core/docs/cinematic-ui-boilerplates.md` — humano herdado

**Conteúdo:** UX/UI patterns para projetos web (Framer Motion,
micro-interações, cinemagraphs).

**Decisão:** não pertence a framework de governança IA. Herança de projeto-
cliente. **Candidato a remoção na Spec 0015.**

**Ação em 0008-A:** nenhuma. Aguarda Spec 0015.

---

### `docs/editorial-guidelines.md` — mixed (candidato a promoção parcial)

**Conteúdo:** rastreamento de decisões de IA em commits/PRs (Objetivo,
Agente/Modelo, Síntese da Instrução, Validação Humana).

**Decisão:** o conteúdo imperativo ("sempre que a IA for responsável por
lógica base, documentar o trace com 4 campos") sobrepõe parcialmente com a
regra "PR description colaborativo" que a Spec 0008-A introduz (campos de
validação humana). Evitar duplicação:

- **Não** criar nova regra em `global-rules.md` específica para "IA input
  trace". A regra "PR description colaborativo 3 etapas" já cobre a
  necessidade de validação humana.
- Manter `editorial-guidelines.md` como doc humano explicativo referenciado
  quando relevante (ex.: `CONTRIBUTING.md` no sub-bloco F pode linkar para
  ele).

**Ação em 0008-A:** nenhuma direta. Cross-ref em F se aplicável.

---

### `docs/rpi-protocol.md` — humano (referência conceitual canônica)

**Conteúdo:** ciclo Research → Plan → Implement, padrões de resiliência,
tabela por ferramenta.

**Decisão:** já decidido em Spec 0008 sub-bloco B: RPI permanece como
referência conceitual. Recebe mudanças estruturais em B (seção "Quando usar
spec-foundation vs plano leve").

**Ação em 0008-A:** nenhuma. Alvo do sub-bloco B.

---

### `docs/tdd-guidelines.md` — opt-in

**Conteúdo:** filosofia BDD PT-BR, ciclo Strict TDD, threshold 100%,
Business Rules IDs, colocation.

**Decisão:** já decidido em Spec 0008 sub-bloco E.TDD: regras imperativas são
promovidas para **`.core/rules/tdd.md`** (novo, opt-in). Doc humano explicativo
permanece em `docs/tdd-guidelines.md` (não sincronizado ao consumidor).

**Ação em 0008-A:** reclassificação documentada; execução acontece no
**sub-bloco E.TDD no PR 3**, não aqui no PR 1.

---

### `.core/docs/process/ai-review-ritual.md` — humano (redundante com AGENTS.md)

**Conteúdo:** workflow de review de PR, template de IA Review Log.

**Decisão:** regras imperativas (yarn check pré-PR, PR Draft, review cruzado)
**já estão em AGENTS.md regras 5-7**. Doc aqui é redundante.

**Ação em 0008-A:** nenhuma em A. **Candidato a remoção ou fusão** na Spec 0015.

---

### `.core/docs/process/project-init.md` — humano desatualizado

**Conteúdo:** passos de inicialização de projeto; menciona `.ai-runtime/`
(depreciado) e `rules/` (path antigo).

**Decisão:** obsoleto pela existência do CLI `npx ai-guidelines adopt`.
Precisa ou atualização (apontar para o CLI) ou remoção. **Candidato a
remoção** na Spec 0015.

**Ação em 0008-A:** nenhuma em A.

---

### `review-checklist.md` — fundido no fluxo de contribuição

**Conteúdo:** checklist de validação para PRs.

**Decisão:** conteúdo útil, mas não como arquivo avulso. Fundir os itens
acionáveis no PR template e em `CONTRIBUTING.md`, removendo o checklist
solto antes do snapshot.

**Ação pós-review F/G:** fundido em `CONTRIBUTING.md` e
`.github/pull_request_template.md`; arquivo removido.

---

### `.core/process/spec-foundation.md` — humano + é alvo de B

**Conteúdo:** lifecycle de specs.

**Decisão:** alvo do sub-bloco B (task B.4) para atualização de lifecycle,
distinção spec/plan, política NEXT.md, regra "fechar anterior antes de abrir
nova", categoria universal vs opt-in.

**Ação em 0008-A:** nenhuma direta (B cuida).

---

### `.core/docs/mcp/registry.md` — humano vazio

**Conteúdo:** lista de MCPs genéricos; zero MCPs do projeto registrados.

**Decisão:** placeholder sem valor. **Candidato a remoção** na Spec 0015.

**Ação em 0008-A:** nenhuma.

---

### `.core/docs/skills/README.md` — humano vazio

**Conteúdo:** explica o conceito de skills; zero skills catalogadas.

**Decisão:** placeholder sem valor. **Candidato a remoção** na Spec 0015.

**Ação em 0008-A:** nenhuma.

---

### `.core/docs/projects.md.example` — template deslocado

**Conteúdo:** template para `~/.gemini/projects.md` (config local de IA).

**Decisão:** é template, não doc. **Deveria viver em `.specify/templates/`**
(se for template de spec) ou `.core/templates/` (se for template de
consumidor). Move para `.specify/templates/` na Spec 0015, ou simplesmente
move agora como task oportunista de B.8 (criação de novos templates).

**Ação em 0008-A:** registrar como ajuste a fazer junto com B.8 (templates).

---

## Síntese — Ações em 0008 (PR 1)

**Nenhum arquivo de `.core/docs/` é removido ou movido nesta PR 1.** A
remoção destrutiva fica para Spec 0015 (que consome essa classificação).

**Mudanças reais em PR 1:**

1. `.core/rules/global-rules.md` ganha nova seção "Workflow com IA" com 5
   regras universais vindas do `synthesis.md` (task A.8). Nenhum conteúdo
   extraído de `.core/docs/` — as 5 regras são novas (vêm da pesquisa de
   transcrições + observações registradas).
2. `.core/rules/global-rules.md` tem linhas 37/39 corrigidas (task A.6 —
   bloqueador 4 do PR #19): remove links para `docs/ai-efficiency-guide.md`
   e `docs/process/` que quebram no consumidor.
3. `.core/templates/AGENTS-core.md.tmpl` tem linha 19 corrigida (task A.7 —
   bloqueador 3 do PR #19).
4. `.core/process/spec-foundation.md` atualizado em B.4 (distinção
   spec/plan, lifecycle, categoria universal vs opt-in).

**Diferido para Spec 0015:**

- `.core/docs/advanced-ai-patterns.md` — reavaliar.
- `.core/docs/cinematic-ui-boilerplates.md` — remover.
- `.core/docs/process/ai-review-ritual.md` — remover (redundante) ou fundir.
- `.core/docs/process/project-init.md` — atualizar ou remover.
- `.core/docs/mcp/registry.md` — remover.
- `.core/docs/skills/README.md` — remover.
- `.core/docs/projects.md.example` — mover para `.specify/templates/`.

**Diferido para Spec 0008 PR 2 (sub-bloco C):**

- `docs/ai-efficiency-guide.md` — reescrita ampla (model routing,
  matriz 2026, prompt caching, EN vs PT, cost awareness, consolidação de
  regras em `global-rules.md`).

**Diferido para Spec 0008 PR 3 (sub-bloco E.TDD):**

- `docs/tdd-guidelines.md` — regras promovidas para
  `.core/rules/tdd.md`; doc permanece como explicação.
