<!--
═════════════════════════════════════════════════════════════════════════════
PERFIL: 🔗 INTEGRATION (contrato-base comum + perfil por tipo de PR)

Caminho canônico: o Integration PR é aberto pelo comando
`npm run flow -- workflow` (opção "Abrir Integration PR") a partir do
arquivo de autoria `integration-pr.md` da spec — instanciado do boilerplate
`.specify/templates/integration-pr-boilerplate.md`. Este template GitHub
existe para o caminho manual e espelha o MESMO perfil.

Este PR é o artefato de HOMOLOGAÇÃO da stack (ADR 0024): consolida a evidência
de convergência — não é veículo de aterrissagem. No merge atômico (modo unit),
quem entra em main é o PR terminal de implementação; este PR é encerrado via
landed-via reconciliation. Ready ≠ merge autorizado; autorização do owner é o
gate R8 do review.md.

Título: [🔗] [Integration] [Spec NNNN] …
Comentários HTML são intencionais; não usar `<details open>`.
═════════════════════════════════════════════════════════════════════════════
-->

## Resultado integrado

<!-- Resultado, não implementação: 3–5 bullets que um stakeholder entende. -->

-

## Componentes e PRs absorvidos

<!-- Tabela dos PRs da stack; no modo unit os demais encerram via landed-via reconciliation. -->

| PR   | Entrega         |
| :--- | :-------------- |
| `#N` | <entrega do PR> |

## Convergência

<!-- GOVERNANÇA VISUAL (#4 — obrigatória em Ready): a stack convergindo atômica
     em main (projeção da topology; o que concluiu × o que falta). Cole o
     PROMPT FINAL (bloco ```…```) ou a imagem. -->

## Compatibilidade e conflitos resolvidos

<!-- Conflitos semânticos/estruturais encontrados na convergência e como foram
     resolvidos. "Nenhum" deve ser afirmado explicitamente, não por omissão. -->

## Evidência de integração

<!-- Link da run de CI canônica da stack (suíte completa + smoke). Verde = stack íntegra. -->

## Rollback

<details>
<summary><strong>Plano de rollback</strong></summary>

<!--
Mantido recolhido porque é essencial para operação, mas não precisa competir
com o resultado integrado e a evidência de integração na leitura humana inicial.
-->

- **Modo `unit` (default):** `git revert <SHA-canônico>` — 1 comando desfaz a spec inteira. Com `merge-commit`: `git revert -m 1 <SHA>`.
- **Modo `sequential`:** reverter os N commits na ordem inversa; para spec coesa, prefira rollback total.

</details>

## Validação final da stack

<!-- Estado final dos gates de prontidão (review.md R1–R9) e do fechamento da branch. -->

## Validação, evidências e checklist

### Evidências e gates

- Reviews/gates da spec:
- CI:
- Merge: não autorizado por este PR (R8 é o gate humano)

### Checklist operacional

- [ ] Formatação verde
- [ ] Validação canônica verde
- [ ] Sem secrets, credenciais ou contexto pessoal vazado
- [ ] PR body atualizado com estado real

## Cross-refs

- **Spec**:
- **ADRs / DECs aplicáveis**:

## Disclosure de IA

Implementação assistida por IA.

<details>
<summary><strong>Disclosure derivado (fatos de processo)</strong></summary>

<!-- fatos-derivados:início -->
<!-- (cole a saída de `npm run disclosure`) -->
<!-- fatos-derivados:fim -->

</details>
