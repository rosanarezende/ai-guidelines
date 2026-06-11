<!-- ai-guidelines: integration-pr v=2 -->
<!--
  ARQUIVO DE AUTORIA — body source do Integration PR de uma spec.
  Consumido pelo comando `workflow` → 🔗 (OpenIntegrationPR, DEC-0023-L01):
  o conteúdo abaixo vira o body do PR literalmente. Comentários como este NÃO
  aparecem no PR renderizado — são instruções para quem edita o arquivo.

  Convenções (DEC-0023-L01):
   - filename é `integration-pr.md`, sem número de PR (só conhecido após criar o PR);
   - o título é auto-gerado pelo wizard ("[🔗] [Integration] [Spec NNNN] Homologação final da stack");
   - autorização de merge é o gate R8 do review.md (texto do owner), não seção visível;
   - Draft/Ready é estado nativo do GitHub; Ready ≠ merge autorizado (ADR 0024).

  PERFIL INTEGRATION (v2, contrato do governance-pr-check): convergência da
  stack — NÃO repete o perfil Execution (sem "Visão pretendida"/"Valor
  entregue"). Draft exige: Resultado integrado, Componentes e PRs absorvidos,
  Convergência, Rollback. Ready exige ainda: Compatibilidade e conflitos
  resolvidos, Evidência de integração (conteúdo real), Validação final da
  stack, Validação/evidências/checklist e Disclosure — e a narrativa visual
  da convergência (#4) preenchida.

  Como preencher: troque NNNN/<slug>, liste as entregas em nível de resultado
  (não de implementação), liste os PRs da stack, e ajuste o comando de CI para
  o do seu repositório (este boilerplate é stack-agnostic — não assume gestor de pacotes).
-->

# Spec NNNN — `<slug>` · Integração da stack

> Este é o **artefato de homologação** da stack (ADR 0024) — consolida a evidência de que a spec está coerente ponta-a-ponta. **Não é veículo de aterrissagem**: no merge atômico, quem entra em `main` é o PR terminal de implementação; este PR é encerrado via `landed-via reconciliation`.

## Resultado integrado

> Resultado, não implementação. 3–5 bullets que um stakeholder entende.

- <entrega 1 — capacidade/valor em nível de resultado>
- <entrega 2>
- <entrega 3>

## Componentes e PRs absorvidos

No **merge atômico (modo `unit`, default)** o PR terminal de implementação é o **veículo**; os demais — e este Integration PR — são **encerrados via `landed-via reconciliation`** (não rejeitados; seus commits entram em `main` via o veículo). Cf. ADR 0024 § Modos de aterrissagem.

| PR   | Entrega         |
| :--- | :-------------- |
| `#N` | <entrega do PR> |
| `#N` | <entrega do PR> |

## Convergência

<!-- GOVERNANÇA VISUAL (OBRIGATÓRIA em Ready): #4 — a stack convergindo atômica em `main`
     (projeção da topology; o que já concluiu × o que falta). Cole o PROMPT FINAL
     (bloco ```…```) ou a imagem. `governance-pr-check` FALHA quando Ready sem nenhum
     dos dois (a imagem nunca bloqueia: o prompt paste-ready basta). -->

## Compatibilidade e conflitos resolvidos

<!-- Conflitos semânticos/estruturais encontrados na convergência e como foram resolvidos.
     Ausência de perda semântica deve ser afirmada explicitamente, não por omissão. -->

- <conflito → resolução, OU "nenhum conflito; rebase/merge limpo — verificado em <evidência>">

## Evidência de integração

<!-- Os gates são determinísticos e rodam no CI; nada aqui pede revisão manual de teste.
     Rode o gate de CI canônico do seu repositório (suíte completa + smoke relevante)
     e anexe o link da run. Verde = stack íntegra. -->

## Rollback

- **Modo `unit` (default):** `git revert <SHA-canônico>` — **1 comando** desfaz a spec inteira (o merge do veículo é 1 commit em `main`). Com `merge-commit`: `git revert -m 1 <SHA>`.
- **Modo `sequential`:** reverter os N commits na ordem inversa; atenção à interdependência entre fatias — para spec coesa, prefira rollback total.

O `plan` do merge-stack imprime a receita exata + o SHA canônico após o merge.

## Validação final da stack

<!-- Estado final dos gates de prontidão (review.md R1–R9) e do fechamento da branch
     (Estágio 5: spec Done, state.yml done, NEXT.md deletado, históricos atualizados). -->

## Validação, evidências e checklist

### Evidências e gates

- Reviews/gates da spec: <reviews/gates versionados relevantes>
- CI: <link da run verde>
- Merge: **não autorizado por este PR** — autorização do owner é o gate R8 do `review.md`

### Checklist operacional

- [ ] Formatação verde
- [ ] Validação canônica verde
- [ ] Sem secrets, credenciais ou contexto pessoal vazado
- [ ] PR body atualizado com estado real

## Cross-refs

- **Spec**: `<caminho da spec, ex.: .governance/specs/NNNN-<slug>/>`
- **ADRs / DECs aplicáveis**: <listar>

## Disclosure de IA

Implementação assistida por IA.

<details>
<summary><strong>Disclosure derivado (fatos de processo)</strong></summary>

<!-- fatos-derivados:início -->
<!-- (cole a saída do comando de disclosure do seu repositório, quando aplicável) -->
<!-- fatos-derivados:fim -->

</details>
