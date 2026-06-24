---
artifact-kind: handoff-legacy
---

# Handoff — Retomada da Spec 0024 (G00 quase-fechável)

> **Para:** próxima sessão (qualquer agente/máquina). **De:** sessão 2026-05-29 (owner + Claude Opus 4.8 + ChatGPT leitor tardio).
> **Cole/leia isto antes de qualquer ação.** Verifique cada afirmação contra os arquivos — este handoff não substitui a leitura.

---

## 0. Onde estamos (executivo)

- **Spec 0024 elevada a spec fundacional de arquitetura de contexto** — handoff é uma projeção, não o centro. **Commitado:** `56ae605` (elevação + Bloco G) + `fecc954` (re-escopa de backlog).
- **Round de research do G00 completo e commitado:** `b69522a` (6 artefatos em `research/2026-05-29-*`).
- **G00 → `Pendente` (round Fonte B concluído na retomada 2026-05-29).** A lente "qual responsabilidade cruza a fronteira?" foi testada em Cursor/opencode (`research/2026-05-29-cursor-opencode.md`): **achado grounded = a fronteira é multi-seam** (regras + execução); `terminus` registrado e **deferido a G01** (não coroado). Critério §4 atingido (4/4). **Falta só o gate humano:** última leitura crítica tri-party → `Resolved`.
- **NÃO feche G00 sem cumprir o critério §4. NÃO abra hipótese nova sem a disciplina §3.**

## 1. Identidade do projeto (não re-derivar)

`ai-guidelines` = framework **governance-first, AI-as-channel** (ADR 0018: **nenhum LLM no runtime**; CLI determinístico; repo é memória). Multi-bounded-context DDD em `src/domain`. Owner: Rosana Rezende (visualmente orientada). A spec dogfooda o próprio framework.

## 2. Regras de comportamento (contratos da sessão — internalizar)

As 7 do projeto, condensadas: (1) carga cognitiva mínima vs overengineering; (2) decisão estrutural implícita → materializar como `[DEC]` antes de seguir; (3) deferred ≠ superseded; (4) achado fora de escopo → `NEXT.md`/`backlog.md`, nunca silenciar; (5) boilerplates stack-agnostic; (6) sem shadow governance via memory; (7) promover sinal só com recorrência inequívoca. **Modo:** [CORE-11] agir só com plano; [CORE-12] checkpoint após contexto extenso; **[CORE-14] humano roda/autoriza a cadeia HARNESS LOCK** (`yarn format ; yarn validate ; git add . ; git commit`); **[CORE-07] nunca push autônomo**; web-research (WebFetch/WebSearch) **pré-autorizada**.

## 2b. Contexto operacional (reinstalar EXPLICITAMENTE — achado da retomada 2026-05-29)

> **Por que esta seção existe:** a retomada de 2026-05-29 mostrou que o handoff preservava o **contexto de trabalho** (o quê / onde da investigação) mas **não reinstalava o contexto operacional** (como se opera). Evidência (dogfood): o agente retomou **respondendo em inglês**, violando `[GR-0201]`. Achado cravado da 0024 (decision-brief, preâmbulo obs #9). **Reinstale o seguinte antes do primeiro token:**

- **Idioma:** **pt-BR em TODA saída** — checkpoints, pesquisas, artefatos intermediários, não só entregáveis (`[GR-0201]`; o repo é todo pt-BR).
- **Disciplina de falsificação = modo ATIVO** (não só §3 como leitura): avanço ≠ prova; não coroar hipótese elegante; **não substituir uma hipótese elegante por outra** (correção do owner); exigir grounded + bounded + ≥2 sistemas externos.
- **Modo tri-party:** owner (decisão) + construtor (este agente) + **leitor tardio (ChatGPT)**. O owner cola reviews; integrá-los. Papéis distintos: o construtor vê a construção; o leitor tardio vê só o artefato cristalizado.
- **Commits:** cadeia HARNESS LOCK (`yarn format ; yarn validate ; git add . ; git commit`); **`[CORE-14]` o HUMANO roda/autoriza a cadeia**; **`[CORE-07]` nunca push autônomo**; o agente fornece só a sugestão de mensagem.
- **Web-research (WebFetch/WebSearch):** pré-autorizada; ações estruturais seguem sob `[CORE-07]`/`[CORE-12]`.
- **Deliberação:** o owner prefere **prosa** a `AskUserQuestion` em deliberação arquitetural aberta.

## 3. Disciplina de falsificação (CRÍTICA — foi o que deu valor a esta sessão)

Esta sessão funcionou por um loop **tri-party**: owner + Claude (construtor) + **ChatGPT (leitor tardio)**. O owner cola reviews do ChatGPT; **integre cada um**. Regras que emergiram e devem continuar:

- **Avanço ≠ prova.** Não coroar hipótese elegante. Exigir: grounded (código/evidência) + **bounded** (escopo declarado) + corroboração externa ≥2 sistemas.
- **Cuidado com o regresso infinito:** toda vez que se propôs um "objeto raiz" (WorkItem → kernel → entidade → Decision), o nível seguinte o dissolveu. Isso é sinal de que **"qual objeto?" é a pergunta errada** — o framework responde com **mecanismo/transformação**, não substantivo.
- **Fonte A (interna) + Fonte B (externa) obrigatórias** para o Bloco G; Fonte B tem papel **ativo de refutar**, não confirmar.

## 4. Critério de fechamento de G00 (a tarefa virou definir o bar, não "achar a resposta")

G00 está suficientemente resolvido quando:

1. ✅ **Listas demonstrado/refutado estáveis** (sem nova refutação por ≥1 rodada). — **atingido.**
2. ✅ **Cada pergunta aberta** respondida **ou deferida a G01-G05** com motivo. — **atingido** (5 dispositions no §G00 do decision-brief).
3. ✅ **Uma formulação** sobrevive: grounded · bounded · **sem disparar o regresso** (mecanismo, não objeto) · corroborada por ≥2 sistemas externos. — **atingido** (bounded por 5 sistemas externos).
4. ✅ **Resposta como identidade/critério do framework**, não "o átomo". — formulação atual atende.

**Os 4 critérios atingidos.** Resta só o gate humano (`Pendente` → leitura crítica tri-party → `Resolved`).

**Formulação candidata atual (bounded):** o fundamental do ai-guidelines não é um objeto nem uma transformação universal — é a **transformação governada de `contexto humano → governança executável`, com fronteira humano→sistema espessa/tipada** (assinatura da classe **governance-first**; é literalmente ADR 0018). Objetos (WorkItem, Rule, ADR, Promotion, Handoff) são **fases/estruturas/produtos/projeções** dessa transformação.

## 5. Primeira tarefa da próxima sessão (crisp)

**Estado:** Fonte B final (Cursor + opencode) **concluída** (`research/2026-05-29-cursor-opencode.md`); G00 já em **`Pendente`** no decision-brief. **Não refazer a research.**

1. **Última leitura crítica tri-party** sobre a identidade bounded de G00 (cole o §G00 do decision-brief + o artefato `cursor-opencode` pro leitor tardio). Pergunta única: _a identidade "transformação governada + fronteira multi-seam tipada" sobrevive a uma leitura fria, **sem coroar `terminus`**?_
2. **Se sobreviver:** cristalizar G00 como **`Resolved`** (data + owner) e disparar a cascata do invariante (A-F podem estabilizar; G01-G05 provavelmente colapsam em facetas).
3. **Se não sobreviver:** registrar a refutação e manter `Pendente`.
4. Depois, **G01-G05** — provável colapso em **facetas de um mesmo modelo** (identidade/lifecycle/promoção/contrato/projeção). `terminus` entra aqui (G01), **a falsificar, não coroar** (NEXT #8).

## 6. Artefatos-chave (ordem de leitura)

1. **`research/2026-05-29-g00-research-state.md`** — consolidação (demonstrado/refutado/aberto/especulação). **Comece aqui.**
2. `research/2026-05-29-g00-ontological-map.md` — mapa ontológico + grafo causal + pivô (objeto→transformação). A trilha lógica inteira.
3. `research/2026-05-29-multica.md` — síntese de 4 sistemas + a lente "tipo de responsabilidade".
4. `research/2026-05-29-spec-kitty.md` · `2026-05-29-hermes-agent.md` · `2026-05-29-g00-internal-audit.md`.
5. `decision-brief.md` § **Bloco G** (G00-G05 `Open`) + `spec.md` (identidade Context Architecture).

## 7. Pré-condições a verificar

- `git status` limpo · HEAD = `b69522a` · `yarn validate` verde · branch `feat/spec-0024-context-architecture`.

## 8. Itens operacionais parkados (precisam de autorização textual do owner)

- **Rename do slug → `context-architecture`** (branch + diretório + retarget do PR #30) — milestone próprio.
- **Corpo do PR #30** → trocar `overview.png` por `overview-v2.png`.
- **`tasks.md`**: marcar `[0.6]` (validação humana do escopo — feita) e `[0.12]` (PR existe).
- **Transcrição da call de devs seniores** (parcial registrada em `g00-internal-audit` + `research-state`): análise 4-níveis pendente quando a transcrição completa chegar.

## 9. Decisões cravadas nesta sessão (não revisitar sem motivo novo)

Elevação fundacional · fronteira **modelo ≠ migração** (0024 decide o modelo; migração é Grupo B/faseada) · Bloco G com **G00 raiz** + invariante de ordem · disciplina de falsificação + duas fontes · inventário arquitetural A/B/C validado · `decision session` e `reference implementation` registrados como hipóteses (NEXT #7) · slug-alvo `context-architecture`.
