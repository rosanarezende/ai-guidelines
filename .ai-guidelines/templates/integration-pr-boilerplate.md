<!-- ai-guidelines: integration-pr v=1 -->
<!--
  ARQUIVO DE AUTORIA — body source do Integration PR de uma spec.
  Consumido pelo comando `workflow` → 🔗 (OpenIntegrationPR, DEC-0023-L01):
  o conteúdo abaixo vira o body do PR literalmente. Comentários como este NÃO
  aparecem no PR renderizado — são instruções para quem edita o arquivo.

  Convenções (DEC-0023-L01):
   - filename é `integration-pr.md`, sem número de PR (só conhecido após criar o PR);
   - o título é auto-gerado pelo wizard ("[🔗] [Integration] [Spec NNNN] Homologação final da stack");
   - mantenha "Owner authorization: pendente" até autorização textual de merge.

  Como preencher: troque NNNN/<slug>, liste as entregas em nível de resultado
  (não de implementação), liste os PRs da stack, e ajuste o comando de CI para
  o do seu repositório (este boilerplate é stack-agnostic — não assume gestor de pacotes).
-->

# Spec NNNN — `<slug>` · Integração da stack

> Este é o **artefato de homologação** da stack (ADR 0024) — consolida a evidência de que a spec está coerente ponta-a-ponta. **Não é veículo de aterrissagem**: no merge atômico, quem entra em `main` é o PR terminal de implementação; este PR é encerrado via `landed-via reconciliation`.

## O que esta spec entrega

> Resultado, não implementação. 3–5 bullets que um stakeholder entende.

- <entrega 1 — capacidade/valor em nível de resultado>
- <entrega 2>
- <entrega 3>

## Visão pretendida

<!-- GOVERNANÇA VISUAL (OBRIGATÓRIA): #1 — o problema que a spec resolve (backdrop). Cole o
     PROMPT FINAL (bloco ```…```); a imagem entra quando gerada. `governance-pr-check` FALHA
     quando este Integration PR está Ready sem prompt nem imagem (a imagem nunca bloqueia). -->

## Convergência da stack

<!-- GOVERNANÇA VISUAL (OBRIGATÓRIA): #4 — a stack convergindo atômica em `main` (projeção da
     topology; o que já concluiu × o que falta). Cole o PROMPT FINAL (bloco ```…```) ou a
     imagem. `governance-pr-check` FALHA quando Ready sem nenhum dos dois. -->

## PRs integrados por esta stack

No **merge atômico (modo `unit`, default)** o PR terminal de implementação é o **veículo**; os demais — e este Integration PR — são **encerrados via `landed-via reconciliation`** (não rejeitados; seus commits entram em `main` via o veículo). Cf. ADR 0024 § Modos de aterrissagem.

| PR   | Entrega         |
| :--- | :-------------- |
| `#N` | <entrega do PR> |
| `#N` | <entrega do PR> |

## Validação (CI — não exige revisão manual de teste)

Os gates são **determinísticos e rodam no CI**; nada aqui pede que um humano revise testes à mão. Rode **o gate de CI canônico do seu repositório** (suíte completa + smoke relevante) e anexe o link da run. Verde = stack íntegra.

## Rollback

- **Modo `unit` (default):** `git revert <SHA-canônico>` — **1 comando** desfaz a spec inteira (o merge do veículo é 1 commit em `main`). Com `merge-commit`: `git revert -m 1 <SHA>`.
- **Modo `sequential`:** reverter os N commits na ordem inversa; atenção à interdependência entre fatias — para spec coesa, prefira rollback total.

O `plan` do merge-stack imprime a receita exata + o SHA canônico após o merge.

## Status do ciclo de vida

> `Draft` ≠ `Ready` ≠ `Mergeable` (ADR 0024). Este PR pode estar `Ready` sem estar autorizado.

- [ ] **Draft** — trabalho em andamento
- [ ] **Ready for review** — homologação concluída; aguarda revisão humana
- [ ] **Authorized to merge** — owner autorizou o merge atômico da stack

## Merge authorization

**Owner authorization**: pendente

> O merge atômico só ocorre após autorização textual explícita do owner ("autorizo merge atômico" + data) — gate `review.md` R8. Este Integration PR não autoriza merge sozinho.

## Cross-refs

- **Spec**: `<caminho da spec, ex.: .governance/specs/NNNN-<slug>/>`
- **ADRs / DECs aplicáveis**: <listar>
