<!-- ai-guidelines-template: next-boilerplate v=1 -->

# NEXT — Spec 0022 CLI Runtime Relocation

> **Arquivo de acompanhamento contínuo.** Instanciado **sempre** no setup da spec.
> Ao final de cada fase, registre aqui apenas itens que **extrapolem o escopo**
> desta spec e precisem sobreviver até o encerramento. Se a pendência será
> resolvida antes do merge desta própria spec, ela deve ir para o `tasks.md`.
> **DELETADO no encerramento pré-merge** (fase final do `tasks.md`); itens relevantes
> migram antes para `.specify/specs/roadmap/backlog.md` ou viram issues.
>
> Fonte: `.core/process/governance-foundation.md` — política de NEXT.md.

---

## 🏛️ Débitos Adiados

### Débitos da Fase 0 (Setup)

_(Nenhum débito registrado ainda)_

### Débitos da Fase 1 (Stage 1 + Gate)

_(A preencher após o gate humano)_

### Débitos da Fase 2 (Implementação)

_(A preencher durante a execução)_

---

## 💡 Insights e Descobertas

### 1. Como lidar quando o NEXT.md infla demais e empurra itens "com a barriga" entre fases

- **O Contexto**: sessão 2026-05-18 com Rosana Rezende e Claude Code, durante o fechamento da Spec 0021 PR #14. A sanitização final do `NEXT.md` daquela spec revelou que o arquivo havia chegado a **208 linhas com 10 itens "Fase 4"** — somando débitos acumulados das Fases 0-3 e Insights, era significativamente maior que `NEXT.md` de specs anteriores. Vários itens haviam sido marcados como "pós-merge" ou "spec futura" sem nunca virarem spec dedicada de fato; eles iam sendo movidos de fase em fase como meta-débito, contaminando o sub-bloco `[DEBT-REVIEW]` toda vez. Quando a hipótese da owner ("o cutover real `cli/` → `src/` aconteceria na 0021") divergiu do estado real (cutover ficou em 4.C.0 só para `TemplateEngine`), surgiu a pergunta: "como é que isso aconteceu sem ninguém perceber a tempo?". A resposta operacional foi: o `NEXT.md` virou caixote. A resposta processual deu origem a esta Spec 0022 (extrair o item enterrado e dar-lhe escopo cirúrgico próprio).

- **O Insight**: o `NEXT.md` precisa de um **gate operacional** — uma regra que dispare alerta antes de o arquivo virar caixote. Hoje a única salvaguarda é "sanitizar pré-merge" (sub-bloco `[DEBT-REVIEW]` da última fase), mas isso é tardio: o item já se tornou meta-débito, não débito da spec. Possíveis abordagens (não-exaustivas, exigem decisão de design):
  1. **Regra editorial** — "ao adicionar item N ao NEXT.md, classificar **na hora** em uma de três categorias: (a) fica nesta spec (vira tasks.md), (b) vira backlog (move para `roadmap/backlog.md` imediatamente), (c) merece spec própria (abre candidata no backlog imediatamente)". Custo: leve mas exige disciplina cultural.
  2. **Gate quantitativo** — "se `NEXT.md` > X linhas ou > Y itens abertos ao final de uma fase, parar e revisar antes de avançar para próxima fase". Custo: claro e mecânico, mas exige calibração do limiar.
  3. **Ritual periódico** — "ao final de cada fase, sub-bloco `[NEXT-AUDIT]` obrigatório (não só `[DEBT-REVIEW]` no fim da spec inteira)". Custo: aumenta cerimônia por fase, mas reduz acúmulo.
  4. **Limite por fase** — "cada fase pode adicionar no máximo K novos itens ao `NEXT.md`; excedente exige justificativa explícita". Custo: rígido, pode incentivar gaming (registrar débito como "insight").

- **Ação Sugerida**: candidato a **meta-spec dedicada**. Slug provisório: `next-md-hygiene-rituals` (ou similar). O escopo da meta-spec seria: (1) escolher a abordagem (ou combinação) entre 1-4 acima; (2) atualizar o `next-boilerplate.md` em `.specify/templates/` para refletir o ritual escolhido; (3) atualizar `.core/process/governance-foundation.md` § política de NEXT.md (que já existe e é referenciada no header do boilerplate) com a regra nova; (4) opcionalmente: adicionar regra runtime `[CORE-*]` em `.core/rules/top/` se o gate for mecanizável (ex.: linter de `NEXT.md` que falha CI quando > X linhas). Adicionar entry no `roadmap/backlog.md` apontando para esta sessão como contexto e para esta Spec 0022 como precedente concreto do problema.

---

## ✂️ Itens descartados deliberadamente

_(Nenhum item registrado ainda)_
