# Synthesis — Pesquisa de contexto da Spec 0008

> Consolidação dos insights das 5 transcrições em `research/transcripts-*.md`,
> com impacto explícito por sub-bloco da spec.

---

## Fontes

| Autor / Veículo    | Episódio                                                                          | Tema                                        |
| ------------------ | --------------------------------------------------------------------------------- | ------------------------------------------- |
| Diego (Rocketseat) | [Claude Code em monorepo full-stack](https://www.youtube.com/watch?v=ARYzqW0W7iI) | Claude Code em monorepo full-stack          |
| Lucas Montano      | [até o Uncle Bob virou Vibe Coder](https://www.youtube.com/watch?v=MvFO-W9zZRk)   | Code review de IA via gates objetivos       |
| Lucas Montano      | [como Sênior estão usando AI](https://www.youtube.com/watch?v=P1-8da1GgBg)        | Workflow real de senior com IA              |
| Lucas Montano      | [Hackearam a Vercel via ai](https://www.youtube.com/watch?v=oDXYfesz0qw)          | AI tools como vetor de supply chain attack  |
| Lucas Montano      | [Vai Faltar Dev Senior em 2027](https://www.youtube.com/watch?v=T9V7EyB_B9w)      | Bolha da IA + bugs típicos de código gerado |

---

## Tema 1 — Regras modulares por domínio (Diego)

**Insight central:** não escrever um único `CLAUDE.md`/`AGENTS.md` monolítico
na raiz. Diego organiza:

- `CLAUDE.md` na raiz (padrões gerais)
- `api/CLAUDE.md` (padrões de API)
- `api/src/auth/CLAUDE.md` (autenticação)
- `api/src/database/CLAUDE.md` (schemas, migrations, índices)
- `api/src/events/CLAUDE.md` (pub/sub)
- `dashboard/CLAUDE.md` (frontend)

O Claude Code (e ferramentas similares) **carrega contexto sob demanda** —
quando o agente trabalha em `api/src/auth`, automaticamente puxa o `CLAUDE.md`
daquele subdiretório. Resultado: contexto cirúrgico, sem inflar tokens.

**Insight secundário:** **não documentar nomes de arquivo/pasta** — eles ficam
desatualizados. Documentar **padrões**.

**Impacto na Spec 0008:**

- **Sub-bloco A (doc → rules)**: reforça a separação entre regra acionável e doc
  humano. Sugere que regras acionáveis podem ser hierárquicas, não
  necessariamente todas em `global-rules.md`. Spec 0008 vai consolidar regras
  globais; um padrão de regras locais (por subdiretório do consumidor) é uma
  evolução técnica → **spinoff Spec 0011**.

---

## Tema 2 — Code review de IA = gates objetivos em CI (Uncle Bob via Lucas Montano)

**Insight central:** Uncle Bob declarou no Twitter "não reviso código gerado
por agente". Em vez disso, ele rastreia:

1. **Cyclomatic complexity** (CCN < 20 por função). LLMs adoram função de 120
   linhas com 15 ifs aninhados.
2. **Test coverage + mutation testing** (e.g., 85% cobertura + 60% mutation).
   Mutation prova que o teste é real, não só passa.
3. **Module size** (e.g., < 300 linhas por arquivo). Quebra "god files".
4. **Dependency structure** (sem ciclos, sem inversão de camadas).

Lucas reforça: "metade do código é da máquina, a pergunta parou de ser se esse
for loop tá bonito". Vira "esse código passa em cinco provas objetivas".

**Impacto na Spec 0008:**

- **Sub-bloco E (novo)** — Quality Gates editoriais: prescrever em
  `global-rules.md` que código gerado por IA deve passar por gates objetivos
  antes de merge; listar gates mínimos esperados (CC, mutation, módulos,
  dependências); sinalizar como débito se o repo alvo não tem essa
  infraestrutura.
- **Handoff para Spec 0009** (Harness Engineering): a implementação técnica
  dos sensores e validators multi-agente. Sub-bloco E é só a prescrição
  editorial; 0009 entrega o código.

---

## Tema 3 — Workflow real de senior usando IA (Lucas Montano)

**Insights sólidos** (acionáveis como regras):

1. **Plan mode antes de agent mode** — sempre. Já está no framework via RPI.
2. **Referencie um padrão existente** ao gerar código novo:
   "siga o padrão de `<arquivo X>`". Reduz alucinação, força consistência.
3. **AI revisando AI como júnior**: pedir ao Claude para responder a um
   "comentário do júnior" (que é Codex/Copilot) faz o modelo ser mais crítico.
4. **Escreva seu próprio PR description** — é onde o contexto entra na sua
   cabeça. NÃO delegue à IA. "Se você não consegue descrever o PR sem ler o
   código, você delegou demais".
5. **Patterns devem ser agnósticos ao LLM** — você não sabe se vai ficar no
   mesmo modelo. Reforça o premissa do framework.
6. **Prompt em inglês performa melhor** — alguns modelos traduzem
   internamente e perdem nuance.
7. **Use IA para responder perguntas sobre o projeto** (designer/PO/QA pergunta
   "como funciona X?" → você pede explicação ao agente).
8. **Git worktree** como multiplicador de produtividade (rodar múltiplas
   features em paralelo).

**Impacto na Spec 0008:**

- **Sub-bloco A**: regras 2, 4, 5, 6 são candidatas a inclusão em
  `global-rules.md` (seção "Workflow com IA — boas práticas").
- **Sub-bloco C (AI Efficiency)**: regra 6 (EN vs PT) entra no guia.
- **Sub-bloco B**: regra 3 ("AI revisando AI como júnior") é tática, não
  estrutural — vira nota de rodapé ou skill, não regra.
- **Git worktree**: vai como item oportunista no ROADMAP, não fits 0008.

---

## Tema 4 — AI tools como vetor de supply chain attack (Vercel)

**Insight central:** o ataque na Vercel (abril/2026) NÃO foi exploit de
NextJS nem da API Vercel. Foi via **Contex.ai**, plataforma de AI agents que
um funcionário Vercel autorizou via Google Workspace OAuth. Atacante escalou
do Workspace para o ambiente Vercel e extraiu env vars não marcadas como
sensitive.

**Padrão emergente:** cada AI tool autorizada via OAuth = nova superfície de
ataque. "O elo mais fraco nunca esteve sendo modelo. É a integração ou OAuth
que essas ferramentas pedem na tela de onboarding".

**Ações defensivas:**

- Marcar **todas** as env vars como sensitive (não confiar no default).
- Auditar OAuth de apps autorizados no workspace periodicamente.
- Política: nenhuma AI tool nova recebe OAuth sem security review.
- Rotacionar secrets defensivamente após incidente em qualquer ferramenta IA
  da cadeia.

**Impacto na Spec 0008:**

- **NÃO entra em 0008**. Audiência diferente (humano operador, não agente IA).
  Artefatos diferentes (políticas de workspace, checklists).
- **Spinoff Spec 0012** — Segurança de IA tools / supply chain.
- A regra 3 atual em `global-rules.md` ("chaves de API jamais transitam por
  arquivos do frontend") é **muito estreita** para esse threat model. Deveria
  ser revisitada na Spec 0012.

---

## Tema 5 — Bolha da IA, custos e bugs típicos (Vai Faltar Dev 2027)

**Insight 1 — Custo:** AI cost vai eventualmente exceder custo de dev humano.
Senior que conhece fundamentos vira ativo crítico em 2026-2027 quando o custo
real aparecer.

**Insight 2 — Degradação de modelo silenciosa:** Lucas observa que Opus 4.6 foi
"nerfado" perto do anúncio do 4.7; 4.7 sente pior que 4.6. Anthropic está
empurrando "adaptive thinking" (modelo decide quanto pensar) e ocultando
controles de effort, sinal de otimização de custo. Implicação prática:
**não confiar cegamente em "mais novo é melhor"**; testar e medir.

**Insight 3 — Bugs típicos de código gerado por IA:**

1. **N+1 queries**: LLM adora loops com queries individuais em vez de batch/
   join. Mitigação: middleware contador de queries por request, alerta acima
   de threshold.
2. **Race conditions**: await/await sem pensar em requests concorrentes.
   Mitigação: property-based testing (hypothesis em Python, fast-check em JS).
3. **Memory leaks**: cache sem TTL, listeners não limpos. Mitigação: profiler
   (py-spy, leak canary, Chrome heap snapshots).

**Insight 4 — Arquitetura crítica humana:** senior precisa saber os
**tradeoffs** da arquitetura (não só "qual é boa"). AI não raciocina sobre
"o que ficou na mesa". Idem para reliability (DB cai no meio do request — AI
considerou?).

**Impacto na Spec 0008:**

- **Sub-bloco C (AI Efficiency)**: incluir "model routing inteligente" e
  "ceticismo informado sobre versões novas" no guia atualizado. Mencionar
  adaptive thinking como variável a observar.
- **Sub-bloco E (Quality Gates)**: os bugs típicos (N+1, race, memory leak)
  reforçam a necessidade de gates editoriais; entram como exemplos no texto.
- **Spec 0009 (Harness Engineering)**: motivação atualizada — bugs típicos
  são alvo dos sensors/validators; transcript Vai Faltar Dev é fonte
  validada.

---

## Resumo — Mudanças propostas para Spec 0008

| Mudança                                                                              | Origem dos insights                           |
| ------------------------------------------------------------------------------------ | --------------------------------------------- |
| Sub-bloco A enriquecido (regras de senior workflow + nota sobre regras hierárquicas) | Diego, Lucas (Senior Usando IA)               |
| Sub-bloco C enriquecido (model routing, EN vs PT, cost awareness, adaptive thinking) | Lucas (Senior, Vai Faltar Dev)                |
| **Sub-bloco E novo** — Quality Gates editoriais (handoff técnico para 0009)          | Uncle Bob, Lucas (Vibe Coder, Vai Faltar Dev) |

## Resumo — Spinoffs para o ROADMAP

| Spec spinoff (proposta)                                                             | Motivação                    |
| ----------------------------------------------------------------------------------- | ---------------------------- |
| **Spec 0011 (candidata)** — Hierarquia de regras por subdiretório                   | Diego (CLAUDE.md per-domain) |
| **Spec 0012 (candidata)** — Segurança de IA tools / supply chain                    | Lucas (Hackearam Vercel)     |
| **Spec 0009 (existente)** — motivação atualizada com gates objetivos como precursor | Uncle Bob, Vai Faltar Dev    |

## Resumo — Itens oportunistas (ROADMAP, sem virar spec)

- Skill / pattern: **AI revisando AI como júnior** (manipulação produtiva)
- Skill: **Git worktree** para paralelizar features
- Item de pesquisa: **degradação silenciosa de modelos** (monitorar
  performance entre versões; não assumir "novo = melhor")
