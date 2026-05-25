---

## Fase de Review → vive em `review.md`

> **Modelo de 3 boundaries (cf. `[DEC-0023-M01]`):** a homologação / prontidão de
> integração **não vive mais no `tasks.md`**. Ela vive em **`review.md`** (gates
> R1–R7, instanciado de `review-boilerplate.md`): R1–R6 `[x]` liberam abrir o
> Integration PR; R7 (merge authorization) libera o merge da stack.
>
> `tasks.md` é **execution-only**: cobre apenas execução/implementação e deve poder
> fechar 100% `[x]` quando a execução termina — sem depender de gates de homologação
> nem de ações pós-merge. O gate determinístico do runtime lê `review.md`, não este arquivo.
