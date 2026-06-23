# Direção — Falsificação ampla via simulador de jornadas governadas

- **Data:** 2026-06-23
- **Spec:** 0024 — context-architecture
- **Etapa:** `broad-flow-falsification` (checkpoint `co-flow-continuation`) — ainda não ativa
- **Natureza:** registro de DIREÇÃO (narrativa de apoio, **não-autoridade**). Não executa decisão, Ready, Human Gate, merge ou avanço; não é fonte operacional. Quando virar trabalho executável, promover para DEC/task/plano governado antes de agir (cf. `research/README.md` § "Como usar").

## 1. Contexto

Discussão sobre um **simulador de jornadas governadas**: um artefato que permita à owner enxergar e **falsificar** o fluxo do framework (`work`/`decide`/`review`/`repair`, readiness, gates, integração) ao longo de vários casos de uso, **sem precisar dogfoodar manualmente** cada cenário.

## 2. Decisão de direção

O simulador é **infraestrutura de falsificação** sobre **mini-repos/fixtures + runtime real** — **não** uma página hand-authored. As projeções (o que `work`/`decide`/Governance Doctor mostram em cada estado) vêm de rodar o **runtime real** sobre fixtures. Se a navegação revela um gap, isso é **pista de quebra/lacuna real** no fluxo ponta a ponta, não artefato de mock. Princípio alinhado a "sem 2ª fonte de verdade": as projeções derivam do runtime, não de texto paralelo.

## 3. Timing

- **Não implementar no PR #45** (`artifact-taxonomy-and-model-review-contract`) — escopo diferente.
- **Retomar quando a etapa `broad-flow-falsification` ficar ativa** — após `artifact-taxonomy-and-model-review-contract` e `internal-architecture-refactor-ddd-bdd` —, como **PR próprio stacked**.

## 4. Achados

- **Duas fontes paralelas de fixture**: `tests/consumer-journey/fixtures` (harness de testes) e `site/src/content/simulatorProjects.ts` (file-map do WebContainer, mantido à mão, **sem check** → drift silencioso possível).
- **Templates / runtime / vocabulário ainda divergem**: os templates (`.specify/templates/tasks-boilerplate.md`) usam `Fase`/`Sub-bloco`; o runtime/parser usa `**Checkpoint X**` + itens-etapa; o vocabulário governado é Spec › Frente › Checkpoint › Etapa › Tarefa. As três superfícies não coincidem.
- **`Frente` é rótulo derivado, não SSOT** (`[DEC-0024-G22]`): não é campo do `state.yml`; é lente humana sobre nós da topologia.
- **`Tarefa` como subnível parseado ainda exige decisão futura**: hoje o parser para no nível de Etapa (itens de checkbox sob o Checkpoint); tornar `Tarefa` um subnível parseado é decisão aberta.
- **Site congelado por não-investimento**, mas **os checks atuais NÃO serão suspensos agora**: não há deploy no repo; `site:flow`/`site:prompts` são projeções limpas do runtime; `site:scenarios` é acoplado aos fixtures; suspender custaria DEC + `script-contracts.yml` + `package.json` + `docs/scripts.md` sem ganho enquanto nada muda.

## 5. Recomendação futura

1. Criar **fonte canônica `fixtures/journeys`** (mini-repos no novo vocabulário, cobrindo o lifecycle de spec simples/PR único até specs maiores/multi-PR e integração).
2. **Consumir essa fonte única em testes e simulador** (subsume as duas fontes paralelas).
3. **Só depois** criar a página navegável.
4. Durante `broad-flow-falsification`, **substituir/repointar** `site/src/content/simulatorProjects.ts` e `site:scenarios` para a fonte canônica — com **condição de retomada explícita** (anti-débito, GG-0005), sem suspensão silenciosa.
