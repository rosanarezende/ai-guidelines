---
artifact-kind: handoff-legacy
---

# Handoff — Retomada da Spec 0024 `context-architecture` (pós-G00 Resolved)

> **Para:** próxima sessão (qualquer agente/máquina). **De:** sessão 2026-05-31 (owner + Claude Opus 4.8 + ChatGPT leitor tardio).
> **Leia ANTES de qualquer ação.** **Supersede** `2026-05-30-handoff-next-session.md`.
> **Objetivo deste handoff:** retomar em **EXECUÇÃO** a partir de um estado estável. **NÃO reabrir discussões já encerradas.**

---

## 0. O que mudou (executivo) — a decisão-raiz caiu

- **`[DEC-0024-G00]` RESOLVED + ACEITO** (2026-05-31, @rosana):
  > A unidade arquitetural primária do ai-guidelines é a **transformação de `contexto humano → governança executável`.**
  > Aceito como **identidade arquitetural**, **não** como explicação universal. **NÃO REABRIR** salvo evidência nova que invalide _diretamente_ a afirmação.
- **Invariante de ordem CUMPRIDO** (G00 Resolved) → **G01+ destravado**. Aceitar G00 **não resolve** G01+ (instrução explícita do gate).
- **Reforma do decision-brief CONCLUÍDA:** brief = **só** `[DEC]` `Pendente`/`Resolved` (589 → 112 linhas). Perguntas abertas + preâmbulo migraram para `findings.md`. **AINDA NÃO generalizada aos boilerplates** (o `decision-brief-boilerplate` ainda lista `Open` na legenda → inconsistente; ver item 4.2).

## 1. Contexto OPERACIONAL — reinstalar EXPLICITAMENTE (F-007 / obs #9)

- **Idioma:** **pt-BR em toda saída** (`[GR-0201]`). **Disciplina de falsificação = modo ATIVO.** **Tri-party:** owner decide · Claude constrói · ChatGPT leitor tardio (a owner cola reviews; integrá-los).
- **Commits — HARNESS LOCK:** `yarn format ; yarn validate ; git add . ; git commit`. **`[CORE-14]` o humano roda/autoriza**; **`[CORE-07]` push/rename remoto só com autorização explícita**. O agente sugere a mensagem.
- **Deliberação:** a owner prefere **prosa** a `AskUserQuestion`. **Web-research** pré-autorizada.
- **RISCO DOMINANTE AGORA:** refinar indefinidamente algo já cristalizado. **Retomar em execução, não reabrir o que fechou.**

## 2. Identidade do projeto (NÃO re-derivar)

`ai-guidelines` = framework **governance-first, AI-as-channel** (ADR 0018: nenhum LLM no runtime; CLI determinístico; **repo é memória**). A spec **dogfooda o próprio framework**. PR vivo **#32** (Draft).

## 3. Estado dos artefatos

- **`decision-brief.md`** — reformado (112 linhas). `[DEC-0024-G00]` **Resolved/Aceito**; `[DEC-0024-G06]` **Resolved** (processo); `[DEC-0024-G02]` **Pendente** (direção decidida: remover taxonomia; substituto desenhado; aguarda gate formal).
- **`research/findings.md`** — `F-001`…`F-014` (convergidos/observação) + **findings abertos** (perguntas ex-G01/G03/G04/G05 + A-F migradas; **G01+ destravado, não resolvido**).
- **`research/2026-05-30-unified-tasks-model.md`** — desenho do substituto de G02 (bloco + propriedade `exige-julgamento`; DEC = registro) + **plano de migração 5 fases** + footprint por classe.
- **`research/2026-05-30-findings-decisions-separation.md`** e **`…-projection-vs-entity-lens.md`** — base da reforma + lente (candidatos C-1…C-6, fixpoint = contexto). **Já explorados — não reabrir.**
- ⚠️ **GIT:** a reforma + o gate de G00 + F-014 podem estar **NÃO-COMMITADOS** no working tree. **Verificar `git status`/`git log` e commitar antes de prosseguir** (último marco commitado/pushado: 3 commits `efdec53`/`e76935f`/`6d71520`).

## 4. Próximos itens — PRIORIZADOS por impacto operacional (não interesse teórico)

1. **G02 — modelo unificado de tasks + remoção da taxonomia.** Desenho pronto (`unified-tasks-model.md`). Falta: **gate formal de G02** + executar o **plano de migração** (Fase 1 boilerplates já feita; Fases 2-5 = promover modelo único, aposentar `WorkflowType`, simplificar wizard, apagar taxonomia). Footprint executável é pequeno (enum + ~3 consumidores + wizard); resto é doc + recipes (G04).
2. **Consistência dos boilerplates.** Remover **`DEC Open`** da legenda do `decision-brief-boilerplate` + cravar regra **"DEC nasce `Pendente`; pergunta aberta vive em `findings.md`"** (generalizar a reforma do brief a todas as specs). ×3 roots (tri-root).
3. **Formalizar o mecanismo Finding → DEC.** `finding convergido + exige julgamento? → sim = [DEC] Pendente / não = referência ou ADR`. (Processo; sobreviveu intacto à investigação.)
4. **SÓ DEPOIS — reavaliar G01 e demais investigações estruturais.** G01 (estrutura/gramática; reframe _estados > entidade_ — "qual é a entidade?" pode ser pergunta malformada) · G03 (promotion pipeline) · G04 (contrato de boilerplate + casa única dos templates) · G05 (projeções/decision-session) · eixos A-F · lente C-1…C-6 · explicação de F-014.

## 5. Decisões cravadas (NÃO revisitar sem evidência nova)

G00 Resolved/Aceito (identidade) · G06 Resolved (contrato da cadeia, processo) · G02 direção decidida (remover taxonomia) · reforma do brief (só decisões) · separação findings/decisions · `research/finding/decision/execution` são **estados**, não entidades · DEC nasce `Pendente` (não `Open`).

## 6. O que NÃO fazer na retomada

- **Não reabrir G00.** Não reabrir entidade-vs-estados (explorado), nem a reforma (feita).
- **Não abrir novas pesquisas nem novos findings.** Retomar em **execução** (itens do §4, na ordem).

## 7. Pré-condições a verificar

Branch `feat/spec-0024-context-architecture` · PR #32 Draft · `git status` (reforma/gate commitados?) · `yarn validate` verde · `state.yml` aponta para G02 como prioridade 1.
