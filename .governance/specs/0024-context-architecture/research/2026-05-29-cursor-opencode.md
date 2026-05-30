# Research (Fonte B) — Cursor + Open Code × G00 (a fronteira humano→sistema não é única)

> **Data:** 2026-05-29
> **Spec:** [`../spec.md`](../spec.md)
> **DEC alimentado:** `[DEC-0024-G00]` (raiz) + G01/G05.
> **Fonte:** **B — research externa.** Cursor (<https://cursor.com/docs> — rules + permissions) · opencode/SST (<https://opencode.ai/docs> — permissions + rules), WebFetch 2026-05-29.
> **Status:** DRAFT. Classe: **harness / AI code editor (governance-leve).** Mandato (lente fechada, §5.1 do handoff): _qual TIPO de responsabilidade cruza a fronteira humano→sistema? — reforça, enfraquece ou complica a classificação julgamento/aprovação/delegação/aprendizado?_ **Papel de Fonte B = refutar, não confirmar.**
> **Correção tri-party (owner, 2026-05-29):** o achado load-bearing é o **multi-seam** (grounded), **não** o `terminus`. `terminus` é **hipótese forte deferida**, não descoberta. Cuidado declarado: não substituir a hipótese elegante anterior (transformação/espessura) por uma nova hipótese elegante (terminus).

---

## O que cada sistema modela

A lente "tipo de responsabilidade" pressupunha **um** ponto de cruzamento. Cursor e opencode mostram que há **dois seams distintos** na fronteira humano→sistema, e eles se comportam de forma oposta:

| Sistema      | Seam 1 — REGRAS (front-loaded)                                                                                                               | Seam 2 — EXECUÇÃO (runtime)                                                                                                    |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| **Cursor**   | `.cursor/rules/*.mdc` — _"version-controlled"_, _"check your rules into git"_. Humano cristaliza **standards/conventions** antes.            | **Zero gate por default**; allowlist/auto-run **afinam** até ~nada. `permissions.json` = política _standing_, não caso-a-caso. |
| **opencode** | `AGENTS.md` — _"commit your project's AGENTS.md to Git"_; **linhagem compartilhada com `CLAUDE.md`** (_"users migrating from Claude Code"_). | allow/ask/deny = política _standing_; `ask` = gate runtime **opcional** (`once`/`always`).                                     |

**Em ambos os seams, o que o humano contribui é cristalizado em arquivo versionado** — não é efêmero, não é auto-gerado pelo sistema. Os WebFetch descreveram os dois seams, independentemente, como **"JUDGMENT crystallized into policy/governance"**.

---

## ACHADO LOAD-BEARING (grounded) — a fronteira não é única

> **A fronteira humano→sistema não é um ponto único; é multi-seam.** Há, no mínimo, **um seam de regras** (julgamento cristalizado em governança versionada) e **um seam de execução** (gate/política runtime). Os dois se comportam **independentemente**: um harness pode **engrossar** o seam de regras e **afinar** o seam de execução ao mesmo tempo (Cursor faz exatamente isso). Logo, **"espessura" não é escalar — é por-seam.**

Isso é grounded (observado direto nos docs de Cursor e opencode) e tem consequência forte para a lente:

1. A lente do leitor tardio pressupunha **um** cruzamento. Com dois seams, ela **conflate** os dois.
2. **Ambos** os harnesses cristalizam **julgamento** no seam de regras — _exatamente_ o cruzamento que tratávamos como único do ai-guidelines. "Julgamento cristalizado em governança versionada" é **convenção cross-tool** já grounded em ≥3 sistemas (`.cursor/rules` · `AGENTS.md` · `CLAUDE.md`, com linhagem explícita entre eles).

→ **Consequência:** _"julgamento cruza a fronteira"_ **NÃO separa** governance-first de harness. A lente julgamento/aprovação/delegação/aprendizado **complica + enfraquece como classificador** — não a refuta como _descrição_ (é rica e verdadeira por sistema), mas a derruba como **eixo separador de classe**. **Veredito:** sobrevive como **overlay descritivo**, não como raiz. _(Fonte B fazendo seu trabalho de refutação.)_

---

## O que isso faz com a formulação candidata — BOUNDA, não refuta

A formulação candidata (handoff §4) era: _"transformação governada de contexto humano → governança executável, fronteira espessa/tipada"_. Cursor/opencode **delimitam sem derrubar**:

- Cursor e opencode **também** transformam contexto humano cristalizado (regras) em algo — então a transformação **não é universal-trivial**, mas **também não é exclusiva** do ai-guidelines no seam de regras.
- A formulação sobrevive **bounded por 5 sistemas externos** (Spec Kitty, Hermes, Multica, Cursor, opencode) + Fonte A interna. Critério §4.3 ("≥2 sistemas externos") **largamente satisfeito**.
- **Mas o separador de classe fica EM ABERTO** — não é "o que cruza" (julgamento, nos três) nem "espessura escalar" (é por-seam). A identidade bounded de G00 **não precisa** do separador fino para fechar: ela se apoia no achado grounded (transformação governada + fronteira multi-seam tipada como assinatura da classe governance-first / ADR 0018).

---

## Síntese cruzada atualizada (6 sistemas, 2 seams)

| Sistema           | Classe                | Seam regras (front-loaded)            | Seam execução (runtime)           | _Terminus observado_ (leitura, não separador) |
| :---------------- | :-------------------- | :------------------------------------ | :-------------------------------- | :-------------------------------------------- |
| **ai-guidelines** | governance-first      | **julgamento → governança**           | n/a (CLI determinístico)          | artefato governado executável (no LLM)        |
| **Spec Kitty**    | spec-driven           | mission/spec (lifecycle)              | **espesso** — review/accept/merge | decisão de aceitação (gate)                   |
| **Cursor**        | harness / code editor | **julgamento → steering**             | **fino** — allowlist/auto-run     | contexto p/ geração autônoma                  |
| **opencode**      | harness / code editor | **julgamento → steering** (AGENTS.md) | allow/ask/deny (gate opcional)    | contexto p/ geração autônoma                  |
| **Hermes**        | autonomous-learning   | auto-gerado (skills)                  | **fino** — skill auto-creation    | mínimo (auto-gerado)                          |
| **Multica**       | agent-orchestration   | object-centric (Agent+Task)           | **fino** — assign→autônomo        | delegação (não julgamento)                    |

**O par governance-first ↔ harness é o contraste mais informativo:** mesmo seam de regras (julgamento cristalizado, versionado), **comportamento oposto no seam de execução** e — _hipótese forte, não fechada_ — **terminus oposto**. A coluna "terminus observado" acima é **leitura por sistema**, não separador cravado.

---

## Pressão de refutação honesta (não silenciar)

**"Então ai-guidelines é só mais um tool de `AGENTS.md`?"** — opencode lê `AGENTS.md`/`CLAUDE.md`; este repo **emite** `AGENTS.md`. Pressão real. Resposta grounded (já cravada no próprio `AGENTS.md` deste repo): aqui `AGENTS.md` é **um output runtime compilado de uma SSOT de governança upstream** (specs, ADRs, promotion) — _"um dos outputs runtime da governança — o canal AI-agnóstico — não o artefato central"_. Em Cursor/opencode, o arquivo de regras **é a fonte autoral consumida direto** por um agente autônomo. Mesma _superfície_ (`AGENTS.md`), papel arquitetural oposto: **projeção compilada** vs **fonte autoral**. A pressão **fortalece** a fronteira em vez de dissolvê-la.

---

## Disposição das perguntas abertas (research-state §Camada 2)

- **#1 (lente "tipo de responsabilidade"):** **RESPONDIDA** — overlay descritivo válido, **não** separador de classe (julgamento aparece nos harnesses). A taxonomia fina (julgamento/aprovação/delegação/aprendizado) é estrutura de **identidade**, não raiz → **DEFERIR a G01**.
- **#2 (Cursor/Open Code engrossam ou afinam?):** **RESPONDIDA** — **afinam o seam de execução, engrossam o seam de regras** (a fronteira é por-seam); bound a formulação, não a refutam. Classe **harness**.
- **#3 (`Decision → Rule` é runtime ou processo?):** sem evidência nova; **DEFERIR a G03** (promotion pipeline).
- **#4 (a formulação bounded basta p/ fechar G00, ou precisa de gramática?):** o contraste de 5 sistemas sugere que **basta como assinatura de classe**; formalização (gramática) é **G01-G05**, não G00.
- **#5 (`status` vs `stage` — 1 ou 2 eixos?):** intocado por este round; **DEFERIR a G01/G03**.

---

## Hipótese deferida (forte) — `terminus` como separador de classe (§5.1)

**Registrada, NÃO perseguida, NÃO coroada.** Candidata: _o seam de regras é a mesma convenção em todas as classes (`AGENTS.md`/`CLAUDE.md`/`.cursor/rules`); o que varia é o **terminus** — o cruzamento termina em **artefato governado executável** (governance-first, sem LLM no runtime, ADR 0018), em **steering para geração autônoma** (harness) ou em **auto-aprendizado** (autônomo). Se sobreviver à falsificação, o separador de classe é "qual o terminus do cruzamento?", não "espessura" nem "o que cruza"._

- **Por que NÃO fechar em G00:** é Camada 3 (atraente, grounded-ish, **não falsificada** por contraste suficiente). Coroá-la agora repetiria o erro que o round anterior evitou — **trocar uma hipótese elegante por outra** (correção tri-party do owner, 2026-05-29).
- **Destino:** `NEXT.md` como candidata de **G01** (identidade/facetas). **Não reabre G00** — G00 fecha com a identidade bounded grounded já estabelecida (transformação governada + fronteira multi-seam tipada), sem depender do terminus.

---

## Limitações

- Análise nível-docs (não código-fonte de Cursor/opencode; Cursor é closed-source).
- Cursor evolui rápido (Composer/background agents 2026); o seam de execução pode reconfigurar — mas o **seam de regras versionado** é estável e é o que importa para G00.
- n agora confortável: **2 governance-first × 2 harness × 2 autônomos** = três pares de contraste limpos.
