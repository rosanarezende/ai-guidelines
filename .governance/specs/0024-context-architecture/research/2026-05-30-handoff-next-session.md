---
artifact-kind: handoff-legacy
---

# Handoff — Retomada da Spec 0024 `context-architecture` (sessão limpa)

> **Para:** próxima sessão (qualquer agente/máquina). **De:** sessão 2026-05-30 (owner + Claude Opus 4.8 + ChatGPT leitor tardio).
> **Cole/leia isto ANTES de qualquer ação.** Verifique cada afirmação contra os arquivos — este handoff não substitui a leitura. **Supersede** `2026-05-29-handoff-next-session.md` (mantido como histórico).

---

## 0. Onde estamos (executivo)

- **Spec renomeada:** `0024-handoff-as-first-class` → **`0024-context-architecture`** (slug + branch + diretório; número 0024 imutável, ADR 0017). O rename **registra mudança real de entendimento** (hipótese inicial → formulação resultante), não é cosmético.
- **PR vivo: #32** (Draft). O **#30 foi fechado** pelo rename (artefato da fase `handoff-as-first-class`).
- **Contrato da cadeia CRISTALIZADO e commitado** (`2ddf339`) em `governance-foundation.md` § "Contrato da cadeia" — é o entregável central desta sessão (CAMADA 2; ver §4).
- **`G00` segue `Pendente`** em **modo `aceitação`** — o gate é da owner: **aceitar / rejeitar / reenquadrar** a identidade C. Nada de A-F/G01-G05 estabiliza antes de `G00 Resolved`.
- **Visão arquitetural** anexada como **norte** em `assets/vision-three-layers.png` (ver §4 e §5).

## 1. Identidade do projeto (NÃO re-derivar)

`ai-guidelines` = framework **governance-first, AI-as-channel** (ADR 0018: **nenhum LLM no runtime**; CLI determinístico; **repo é memória**). Multi-bounded-context DDD em `src/domain`. Owner: **Rosana Rezende** (visualmente orientada). A spec **dogfooda o próprio framework**.

## 2. CONTEXTO OPERACIONAL — reinstalar EXPLICITAMENTE (achado central desta sessão)

> **Por que esta seção existe:** o achado #9/#10 da 0024 (dogfood) é que handoffs reinstalam o **contexto de trabalho** mas falham no **contexto operacional** — e a evidência foi um agente retomando em inglês. Reinstale o seguinte **antes do primeiro token**:

- **Idioma:** **pt-BR em TODA saída** — checkpoints, pesquisas, artefatos, commits (`[GR-0201]`; o repo é todo pt-BR).
- **Disciplina de falsificação = modo ATIVO** (ver §3).
- **Modo tri-party:** owner (decisão) + Claude (construtor) + **ChatGPT (leitor tardio)**. A owner cola reviews; **integrá-los**.
- **Commits:** cadeia HARNESS LOCK (`yarn format ; yarn validate ; git add . ; git commit`). **`[CORE-14]` o humano roda/autoriza a cadeia**; **`[CORE-07]` push/rename remoto só com autorização explícita da owner**; o agente fornece a sugestão de mensagem.
- **Web-research (WebFetch/WebSearch):** pré-autorizada; ações estruturais/remotas seguem sob CORE-07/12.
- **Deliberação:** a owner prefere **prosa** a `AskUserQuestion` em deliberação arquitetural aberta.
- **Risco dominante AGORA:** não é falta de modelagem — é **refinar indefinidamente** algo já cristalizado. Pare quando estiver utilizável.

## 3. Disciplina de falsificação (tri-party — o que dá valor)

- **Avanço ≠ prova.** Não coroar hipótese elegante. Exigir grounded + bounded + corroboração ≥2 sistemas externos.
- **Não substituir uma hipótese elegante por outra** (correção da owner — ex.: "terminus" rebaixado a hipótese; "steelman" → "comparabilidade").
- **Comparabilidade, não advocacy:** o decision-brief **torna o espaço de decisão visível**, não convence. Toda opção sobrevivente responde ao **mesmo conjunto mínimo de perguntas** (incl. "quando NÃO escolher", inclusive a recomendada). Assimetria informacional já é a decisão tomada.
- **Fonte A (interna) + Fonte B (externa)** obrigatórias para o Bloco G; Fonte B **refuta**, não confirma.

## 4. O que foi cristalizado nesta sessão (CAMADA 2 = governança operacional)

A imagem-norte tem 3 camadas: **CAMADA 1 Automação Estrutural · CAMADA 2 Governança Operacional · CAMADA 3 Julgamento Humano**. Princípio: _a automação não substitui o humano; ela protege o espaço de decisão humana._ Esta sessão deu à **CAMADA 2 uma gramática explícita** (antes implícita):

- **Contrato da cadeia** `requisito → spec → research → decision-brief → gate → plano → tasks → implementação` em `governance-foundation.md` § "Contrato da cadeia": cada fase tem **produz / proibido de produzir / escala para**. Invariante (ADR 0018): a seta de autoria é `humano → sistema`; **nenhuma fase produz a saída da seguinte**; o julgamento só nasce no gate.
- **Critério de parada da research:** para quando a decisão é **possível**, não quando resta uma resposta. Objetivo = tornar decidível, não descobrir a verdade.
- **Modos de gate:** `escolha` (arbitra tradeoffs) vs `aceitação` (aceita/rejeita/reenquadra um finding convergido). G00 é `aceitação`.
- **Comparabilidade (não advocacy)** + **escalonamento** (devolve à fase dona; reusa primitivos) + **anti-padrão #6**.
- **Tudo DECLARATIVO** — sem enforcement mecânico (dogfood-first). A **CAMADA 1 de decisão** é trabalho futuro nomeado (NEXT #9; 1º candidato `decision-trace:check`).
- Reflexos: boilerplates (`decision-brief`/`plan`/`tasks-evidence-driven`) + `rpi-protocol`. `[DEC-0024-G06]` Resolved (proveniência). `G04` cravou **casa única dos templates** (acabar tri-root). Visão anexada como norte.

## 5. Critério de sucesso da 0024 (régua de validação — ChatGPT, 2026-05-30)

> **Um novo usuário consegue seguir `requisito → spec → research → decision-brief → gate → plano → tasks → implementação` sem precisar descobrir informalmente onde termina uma fase e começa a próxima.** A dor real não era "faltava contrato" — era "o contrato existia parcialmente, mas não era explícito o suficiente para guiar comportamento". (Candidata a virar comentário no PR #32 — ver §10.)

## 6. Estado do G00 + próximo passo (o gate)

- **`[DEC-0024-G00]`** (Forma B no decision-brief): identidade **bounded · grounded · falsificável** = _"transformação governada de contexto humano → governança executável, com fronteira humano→sistema multi-seam tipada"_ (assinatura da classe governance-first; ADR 0018). Modo de gate `aceitação`.
- **Critério de fechamento (§4 do handoff anterior) atingido 4/4** — MAS _critérios atendidos ≠ encerrado_; falta o **ato do gate da owner**.
- **Próximo passo:** a owner crava o gate — **Aceitar C / Rejeitar / Reenquadrar**. Se Aceitar → `Resolved` + disparar a cascata do invariante (A-F podem estabilizar; **G01-G05 provavelmente colapsam em facetas de um mesmo modelo**: identidade/lifecycle/promoção/contrato/projeção).
- **Hipótese `terminus`** (separador de classe via terminus do cruzamento) — **deferida a G01, NÃO coroar** (NEXT #8).

## 7. Próximas tarefas (depois do gate de G00)

1. **G01-G05** — provável colapso em facetas do mesmo modelo (simplifica o gate). `terminus` entra em G01, a falsificar.
2. **Deferrals nomeados (NEXT #9):** CAMADA 1 enforcement (`decision-trace:check` 1º) · decision-walk (G05) · consolidação tri-root de templates (G04 + `runtime-and-template-root-consolidation`) · drift enforcement (F04) · taxonomia de promoção (D04/G03).
3. **Re-escopa do backlog (C3)** se pendente; **não** construir enforcement agora (dogfood-first).

## 8. Artefatos-chave (ordem de leitura)

1. **`spec.md`** — identidade + §🧭 Visão arquitetural (norte).
2. **`decision-brief.md`** — § "Contrato research·decision-brief·gate" (boilerplate reflete) + **Bloco G** (G00 gate `aceitação`) + obs #8/#9/#10/#11 do preâmbulo.
3. **`../../../.core/process/governance-foundation.md` § "Contrato da cadeia"** — a CAMADA 2 cristalizada (SSOT).
4. `research/2026-05-30-research-output-contract.md` — evidência-origem (ChatGPT) + nota de supersessão steelman→comparabilidade.
5. `NEXT.md` (#8 terminus deferido, #9 deferrals + CAMADA 1) · `research/2026-05-29-g00-research-state.md` + `2026-05-29-cursor-opencode.md` (trilha do G00).

## 9. Pré-condições a verificar

- Branch **`feat/spec-0024-context-architecture`** · `git status` limpo · HEAD `cc4b17c` (ou à frente) · `yarn validate` verde · **PR #32 Draft** aberto · diretório `0024-context-architecture`.

## 10. Itens parkados + GOTCHAS operacionais (memória local cobre; repetir aqui p/ portabilidade)

- **Comentário "critério de sucesso" no PR #32** (§5) — sugestão do ChatGPT; **não feito** (a owner ia revisar o #32 primeiro). Postar quando ela validar.
- **GOTCHA — rename de branch:** renomear uma branch que é HEAD de PR aberto **FECHA o PR** (não retargeta). Avisar a owner antes; recuperar com PR novo.
- **GOTCHA — Ultraplan / Claude web:** commita em sandbox isolado (não vai pro origin). Reconciliar via patch em `temp/` + verificação byte-a-byte (`git apply --reverse --check`). WebFetch não lê `claude.ai` (403).
- **`tasks.md`:** `[0.6]`/`[0.12]` (validação humana + PR) podem ser marcados; o PR agora é **#32**.

## 11. Decisões cravadas (NÃO revisitar sem motivo novo)

Rename `context-architecture` (mudança de entendimento) · contrato da cadeia (CAMADA 2, declarativo) · comparabilidade > steelman · G00 modo `aceitação` (Pendente) · `[DEC-0024-G06]` Resolved (processo, fora do invariante de ordem) · `G04` casa única dos templates · visão = norte (não evidência/requisito) · imagem em `assets/`.
