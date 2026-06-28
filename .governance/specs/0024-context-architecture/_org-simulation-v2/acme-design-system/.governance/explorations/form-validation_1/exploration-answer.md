---
node: exploration-answer
verdict: "não — o DS não tem form validado; cada MFE reimplementa hoje → precisa criar o componente"
---

# Resposta — o design system tem um formulário validado?

**Não.** O design system não expõe um formulário com validação (email/site/telefone); hoje cada MFE reimplementa por conta própria.

**Recomendação:** criar o componente de form validado no DS — vira a delivery do formulário (destrava o contrato `form-component` da intent).

_(exploration **simples**: só análise, sem POC durável → `fate: throwaway` no registry. O vínculo com a intent é o `answers` da registry; este arquivo é só CONTEÚDO — não carrega aresta.)_
