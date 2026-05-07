<!-- ai-guidelines-template: plan-boilerplate v=1 -->

# Plan — Spec [Número] [Título Curto]

> Spec: [`./spec.md`](./spec.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md) <!-- Remover linha se Tipo de spec = `deterministic`. -->
> Status: Draft <!-- Draft | Active | Done -->

> **Vive durante a execução.** Diferente da `spec.md` (imutável após In Review),
> este arquivo é atualizado conforme o entendimento técnico evolui. Decisões
> revisitadas devem registrar a anterior em nota, não apagar o histórico.

---

## 🛰️ Stage 1 / Stage 2

> _Bloco obrigatório para specs `evidence-driven` ou `mixed`; remover inteiro
> se a spec é `deterministic`._
>
> **Stage 1 (Research → opções).** Coletar evidência (research lifecycle em
> `./research/`), preencher `decision-brief.md` com pontos `[DEC-NNNN-XYZ]`
> em status `Pendente` e opções com tradeoffs — **sem decisão final**. Termina
> no **Gate humano** que marca cada ponto `Resolved`.
>
> **Stage 2 (Design + Implementação).** Cada subseção do "Design e Arquitetura"
> abaixo deriva linearmente das decisões cravadas no brief — toda escolha
> técnica referencia explicitamente o `[DEC-NNNN-XYZ]` que a alimenta.
> Rota não derivada do brief é rejeitada como acreção pré-research.
>
> Specs `mixed` aplicam Stage 1 apenas aos sub-blocos identificados como
> evidence-driven; demais entram em Stage 2 direto.

---

## 🏗️ Design e Arquitetura

### Princípio guia

O "como" estrutural — qual padrão arquitetural orienta a solução, qual ADR
existente estende ou quebra, qual contrato técnico define. Tamanho varia por
escopo: de 1 linha (specs `deterministic` triviais) até alguns parágrafos
curtos (specs `evidence-driven` com múltiplos sub-blocos). O critério é
densidade — sem padding nem prosa cerimonial.

### Componentes ou Sub-blocos

Para cada peça da solução (sub-bloco, módulo, feature):

#### [A | nome do componente]

**Estado atual** (baseline antes da spec):

Descrição do que existe hoje, com paths concretos.

**Decisão**:

O "como" técnico — caminhos de arquivo, contratos, formatos. Diferente do
"o quê" da `spec.md`, este nível responde "exatamente onde e como mexer".
Em specs `evidence-driven`/`mixed`, citar `[DEC-NNNN-XYZ]` que ancora a decisão.

**Mudanças em arquivos**:

- `path/to/file.ext` — descrição da mudança esperada.

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

Granular, por componente/sub-bloco. Itens marcáveis durante execução.

### Componente [A]

- [ ] DoD operacional 1 (verificável durante implementação).
- [ ] DoD operacional 2.

### Globais (toda a spec)

- [ ] Pipeline de format/lint verde (ex.: `yarn check` no `ai-guidelines`; ou equivalente do stack do consumidor — `npm run lint`, `pnpm format --check`, `cargo fmt --check`, `ruff check`, etc.).
- [ ] Suíte de testes verde — XX/XX (ex.: `yarn test` no `ai-guidelines`; ou equivalente do stack do consumidor).
- [ ] Diff em consumidor real revisado: zero quebras (quando aplicável; specs puramente internas podem registrar "não-aplicável" com justificativa).

---

## 🧪 Estratégia de Testes

- **Unit/BDD**: arquivos de teste novos ou ampliados.
- **Integração**: cenários cross-componente.
- **Manual**: smoke tests em ambientes que automação não cobre.

Citar arquivos concretos quando souber (ex.: `tests/<file>.test.mjs` no `ai-guidelines`; adapte à convenção de teste do stack do consumidor — `*.test.ts`, `*_test.go`, `test_*.py`, etc.).

---

## 🛠️ Arquivos modificados (esperado)

Lista exaustiva, com 1 linha de motivação por arquivo:

- `path/to/file1` — motivo.
- `path/to/file2` — motivo.

---

## ⚠️ Riscos técnicos (concretos)

Diferente dos riscos macro da `spec.md`, aqui entram riscos específicos por
componente, com mitigação.

| Risco           | Mitigação                               |
| :-------------- | :-------------------------------------- |
| Risco técnico 1 | Como mitigamos (testes, rollback, etc.) |

---

## 📐 Decisões revisitadas

Registro cumulativo de mudanças de rota durante a execução. **Decisões
originais** validadas no gate humano vivem no `decision-brief.md` — aqui
entram apenas **reversões ou pivots posteriores** ao gate.

**Formato canônico (1 entrada = 4 linhas):**

- **YYYY-MM-DD — [Resumo da mudança em ≤ 8 palavras].**
  - **Mudança:** o quê mudou (decisão anterior → decisão nova).
  - **Por quê:** o que motivou (evidência nova, fricção observada, decisão upstream).
  - **Implicação em `tasks.md`:** que tasks foram reescritas, removidas ou criadas.

**Cap orientativo: ~10 entradas.** Se ultrapassar, é sinal de que (a) o desenho
não estabilizou — voltar a Stage 1 / abrir nova spec; ou (b) entradas de baixa
densidade estão inflando o histórico — consolidar. **Não migrar** estas
entradas no encerramento — permanecem no `plan.md` como histórico permanente
da execução.

---

## 📎 Anexo — Conteúdo candidato pré-research

> _Subseção opcional._ Incluir apenas quando esta spec **herda um rascunho
> mergeado** que precisa ser reconciliado sob evidência (Stage 1) — nunca como
> espaço para acreção de novo conteúdo durante o plano.

- **Origem:** commit/PR de origem do rascunho + data.
- **Conteúdo herdado:** resumo curto do que foi mergeado (sem reproduzir o texto).
- **Status de reconciliação:** `pendente` (Stage 1 ainda não classificou) | `manter` | `revisar com fonte X` | `reverter`.
- **Política aplicada:** referência ao ponto `[DEC-NNNN-XYZ]` do `decision-brief.md` que decidiu o critério de reconciliação.

O conteúdo herdado **não é assumido correto** — passa pelo mesmo filtro de
evidência das decisões originais da spec.
