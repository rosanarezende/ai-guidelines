<!-- ai-guidelines-template: next-boilerplate v=1 -->

# NEXT — Spec 0021 Governance Information Architecture

> **Arquivo de acompanhamento contínuo.** Instanciado **sempre** no setup da spec.
> Ao final de cada fase, registre aqui apenas itens que **extrapolem o escopo**
> desta spec e precisem sobreviver até o encerramento. Se a pendência será
> resolvida antes do merge desta própria spec, ela deve ir para o `tasks.md`.
> **DELETADO no encerramento pré-merge** (fase final do `tasks.md`); itens relevantes
> migram antes para `.specify/specs/roadmap/backlog.md` ou viram issues.

> **Histórico de saneamentos:**
> Sanitizado em 4.C.[SANITIZE-NEXT] (2026-05-18): débitos das Fases 0–3 consolidados como "todos fechados"; débitos da Fase 4 reduzidos de 10 itens para 1 genuinamente ativo (Fase 4 #5/7/8/9/10 + Insight "Harness Lock no boilerplate" migrados para `roadmap/backlog.md`; Fase 4 #2/4/6 removidos por estarem resolvidos; Fase 4 #1 removido por ser reserva intencional, não débito).

---

## 🏛️ Débitos Adiados

### Débitos das Fases 0–3

Todos os débitos das Fases 0–3 fechados durante a execução das próprias fases (rename `spike`, ADRs fundacionais, schema living-docs v0, drift guard, TemplateEngine v0, validação estrutural v0) ou absorvidos por sub-blocos da Fase 4 (rename `governance-foundation.md` em 4.B.1; consolidação ADRs em 4.B.4/5; cleanup docs em 4.C.1; engine activation em 4.C.0; equivalência mirror↔engine em 4.C.3). Trilha histórica completa: `tasks.md` desta spec + commits relacionados.

### Débitos da Fase 4 (Consolidação)

1. **4.A.2 permanece parcial até 4.D.[ARCHITECTURE].** Consistência total catálogo↔repo só fecha quando 4.D auditar, pós-cleanup, que todos os deltas declarados em `GOVERNANCE-CATALOG.md` §6 (ADRs em dois lares, `/docs/` como ilhas, `cli/` mjs vs `src/` DDD, `.specify/templates/` vs `recipes/`) foram resolvidos ou explicitamente postergados para spec futura. Único débito interno cross-bloco da 0021 ainda ativo; resolução planejada dentro deste mesmo PR.

---

## 💡 Insights e Descobertas

### Rastro histórico em specs congeladas (não débito)

Algumas referências históricas em `.specify/specs/` (paths antigos, "ponteiros" de versões passadas e trechos de auditoria) são **rastro intencional**. Esses trechos não são SSOT do layout atual e **não** devem ser "limpos" quando o resultado for perder rastreabilidade ou contexto de decisão.

### Como lidar quando o NEXT.md infla demais e empurra itens "com a barriga" entre fases

- **O Contexto**: sessão 2026-05-18 com Rosana Rezende e Claude Code, durante o fechamento desta spec (PR #14). A sanitização final em 4.C.[SANITIZE-NEXT] revelou que o `NEXT.md` havia chegado a **208 linhas com 10 itens "Fase 4"** + débitos acumulados das Fases 0-3 — significativamente maior que NEXT.md de specs anteriores. Vários itens haviam sido marcados como "pós-merge" ou "spec futura" sem nunca virarem spec dedicada de fato; eles iam sendo movidos de fase em fase como meta-débito, contaminando o sub-bloco `[DEBT-REVIEW]` toda vez. Quando a hipótese da owner ("o cutover real `cli/` → `src/` aconteceria na 0021") divergiu do estado real (cutover ficou em 4.C.0 só para `TemplateEngine`), a pergunta natural foi: "como é que isso aconteceu sem ninguém perceber a tempo?". A resposta operacional: o `NEXT.md` virou caixote. A resposta processual: nasceu a Spec 0022 (cutover de-arrumação, PR #15), que extrai o item enterrado e lhe dá escopo cirúrgico próprio.

- **O Insight**: o `NEXT.md` precisa de um **gate operacional** — uma regra que dispare alerta antes de o arquivo virar caixote. Hoje a única salvaguarda é "sanitizar pré-merge" (sub-bloco `[DEBT-REVIEW]` da última fase), mas isso é tardio: o item já se tornou meta-débito, não débito da spec. Possíveis abordagens (não-exaustivas, exigem decisão de design em meta-spec própria):
  1. **Regra editorial** — "ao adicionar item N ao NEXT.md, classificar **na hora** em três categorias: (a) fica nesta spec (vira tasks.md), (b) vira backlog (move para `roadmap/backlog.md` imediatamente), (c) merece spec própria (abre candidata no backlog imediatamente)". Custo: leve mas exige disciplina cultural.
  2. **Gate quantitativo** — "se `NEXT.md` > X linhas ou > Y itens abertos ao final de uma fase, parar e revisar antes de avançar". Custo: claro e mecânico, mas exige calibração do limiar.
  3. **Ritual periódico** — "ao final de cada fase, sub-bloco `[NEXT-AUDIT]` obrigatório (não só `[DEBT-REVIEW]` no fim da spec inteira)". Custo: aumenta cerimônia por fase, mas reduz acúmulo.
  4. **Limite por fase** — "cada fase pode adicionar no máximo K novos itens ao `NEXT.md`; excedente exige justificativa explícita". Custo: rígido, pode incentivar gaming (registrar débito como "insight").

- **Ação Sugerida**: candidato a **meta-spec dedicada**. Slug provisório: `next-md-hygiene-rituals`. Escopo: (1) escolher abordagem (ou combinação) entre 1–4 acima; (2) atualizar `next-boilerplate.md` em `.specify/templates/` para refletir o ritual escolhido; (3) atualizar `.core/process/governance-foundation.md` § política de NEXT.md (já existe e é referenciada no header do boilerplate) com a regra nova; (4) opcional: adicionar regra runtime `[CORE-*]` em `.core/rules/top/` se o gate for mecanizável (ex.: linter de `NEXT.md` que falha CI quando > X linhas). **Precedente concreto**: Spec 0022 PR #15 nasce justamente desta dor — referência viva para a meta-spec. Sessão de origem deste insight: 2026-05-18, mesma que originou a 0022 e o sub-bloco 4.C.[SANITIZE-NEXT] desta spec.
