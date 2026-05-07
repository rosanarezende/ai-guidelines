# Decision Brief — Spec 0019 Bootstrap Consumidor e Runtime

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Tasks: [`./tasks.md`](./tasks.md)
> Status agregado: **Resolved**
> Última atualização: 2026-05-07 — Gate humano fechado

---

## Blocos da brief

## Bloco B — Runtime Architecture & Trampolines

### [DEC-0019-B01] Estratégia de Trampolins e Provider Guardrails

**Pergunta:** Como o consumidor inicializa um projeto para evitar acúmulo e descompasso (Context Rot) com a fonte canônica `AGENTS.md` em multiplos providers (`CLAUDE.md`, `.codex/` etc)?

**Contexto (research):**

- [`research/2026-05-06-trampolins-e-guardrails.md`](./research/2026-05-06-trampolins-e-guardrails.md) traz um mapeamento completo para 2026 (`.cursor/rules/ai-guidelines.mdc`, `.github/copilot-instructions.md`, `.openai/instructions.md`, etc). O design proposto envolve injetar um "Hard-Redirect" indicando ao LLM que o `AGENTS.md` é mandatório.

**Opções:**

| Opção | Descrição                                                                                                                                                                              | Pró                                                                               | Contra                                                                         |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| A     | **Wizard Multiselect + Comando Autônomo:** A CLI pergunta via Inquirer quais providers a equipe usa, gera apenas esses trampolins. Um comando auxiliar permite adicionar novos depois. | Gestão granular, repo limpo, altamente extensível para novos providers no futuro. | Maior esforço de implementação (novo fluxo no Inquirer e comando auxiliar).    |
| B     | **Injeção Silenciosa Fixo:** A CLI gera automaticamente os trampolins dos 7 principais providers sempre que roda o `init`/`adopt`, sem perguntar.                                      | Zero fricção para o usuário, garante cobertura total.                             | Suja o repositório consumidor com arquivos de provedores que a equipe não usa. |

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Escolha (marque com `x`):**
  - [x] A
  - [ ] B
- **Justificativa / Ressalvas:** >
  A pesquisa (`2026-05-06-trampolins-e-guardrails.md`) comprova que o "Context Rot" e as alucinações arquiteturais ocorrem devido à proliferação de arquivos de instrução nativos lidos automaticamente por cada extensão/IA (`.cursor/rules/ai-guidelines.mdc`, `CLAUDE.md`, `.openai/instructions.md`, etc.). A Opção A resolve isso de forma ativa: o CLI se apropria desses arquivos gerando "Trampolins" (Hard-Redirects irredutíveis apontando para o `AGENTS.md`) e injetando arquivos de ignorados (`.claudeignore`, `.aiexclude`) para proteger o budget de tokens. Eliminar essa fricção manual no setup garante a adoção e retenção do framework nos repositórios consumidores. A criação do comando autônomo (`ai-guidelines providers`) protege o ciclo de vida do projeto, permitindo a adição de novos trampolins caso a equipe migre de ferramenta no futuro. Ressalva técnica para a implementação: será necessário utilizar interpolação (ex: `{{SDD_DIR}}`) no compilador para garantir que os caminhos não quebrem no repositório de destino.
- **Data / Owner:** 2026-05-06 / @rosanarezende

### [DEC-0019-B02] Topologia e ordem do compilado AGENTS.md

**Pergunta:** O compilado `AGENTS.md` possui estrutura topológica com regras muitas vezes redundantes ou fora de sequência semântica. Como as zonas devem ser reestruturadas de forma a evitar um arquivo monolítico-plano?

**Contexto (research):**

- [`research/2026-05-06-topologia-runtime.md`](./research/2026-05-06-topologia-runtime.md) documenta que regras de Git (`CORE-04`, `06`, `08`, `07`, `09`, `10`, `14`, `GR-0203`) e do Sistema de Templates (`CORE-02`, `11`, `13`, `GR-0101`, `0202`) estão espalhadas no compilado final, causando esquecimento de ciclo pelo modelo.

**Opções:**

| Opção | Descrição                                                                                                                                                                                              | Pró                                                                                                                                                          | Contra                                                                                                               |
| :---- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| A     | **Zonas por Clusters Temáticos:** O compilador agrupa as regras sob grandes H2/H3 como "Git & PR Workflow", "Lifecycle & Templates", "Core Principles". O id original (`CORE-XX`) é mantido no título. | Maior aderência para modelos grandes; agrupamento lógico facilita a revisão de ciclo. O agente não perde a regra de aprovação se estiver no contexto do git. | Exige mapear `zone` ou iterar nas `tags` de cada regra em `rules.json` para criar os grupos no código da compilação. |
| B     | **Plano + Índice Remissivo:** Mantém a compilação sequencial mas injeta uma tabela de conteúdos/temas no topo do arquivo ligada a âncoras.                                                             | Menos refatoração na lógica central do builder.                                                                                                              | Não resolve a dispersão espacial do contexto; LLM prefere contiguidade semântica para seguir ciclos fechados.        |

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Escolha (marque com `x`):**
  - [x] A
  - [ ] B
- **Justificativa / Ressalvas:** >
  Apoiada na pesquisa de topologia (`2026-05-06-topologia-runtime.md`), a Opção A é a única fundação viável para garantir compliance em LLMs de fronteira. Índices remissivos (Opção B) auxiliam a navegação humana, mas não resolvem a fragmentação no espaço vetorial da janela de contexto. O agrupamento por domínio (contiguidade semântica) força a atenção unificada da IA para todas as regras de um mesmo ciclo, prevenindo falhas operacionais e alucinações. O débito técnico planejado para o `compiler.mjs` — que deverá iterar regras agrupando-as por `tags` ou nova chave `zone` no `rules.json` — é estritamente necessário para preservar o repositório como uma fonte inquebrável de verdade.
- **Data / Owner:** 2026-05-06 / @rosanarezende

---

## Resumo de status

| ID               | Bloco | Status   |
| :--------------- | :---- | :------- |
| `[DEC-0019-B01]` | B     | Resolved |
| `[DEC-0019-B02]` | B     | Resolved |

**Status agregado:** Resolved

---

## ✅ Gate fechado

- **Data:** 2026-05-07
- **Owner:** [@rosanarezende]
- **Pontos resolvidos:**
  - [x] `[DEC-0019-B01]`
  - [x] `[DEC-0019-B02]`
