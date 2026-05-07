# Decision Brief — Spec 0019 Bootstrap Consumidor e Runtime

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Tasks: [`./tasks.md`](./tasks.md)
> Status agregado: **Resolved (re-aberto e re-fechado)**
> Última atualização: 2026-05-07 — Gate humano re-fechado após reabertura consensuada para absorção do spinoff `template-lifecycle-e-update` e migração de adapter content para trampolins.

---

## Blocos da brief

## Bloco B — Runtime Architecture & Trampolines

### [DEC-0019-B01] Estratégia de Trampolins e Provider Guardrails

**Pergunta:** Como o consumidor inicializa um projeto para evitar acúmulo e descompasso (Context Rot) com a fonte canônica `AGENTS.md` em multiplos providers (`CLAUDE.md`, `.codex/` etc)?

**Contexto (research):**

- [`researchs/architecture/2026-05-06-trampolins-e-guardrails.md`](../researchs/architecture/2026-05-06-trampolins-e-guardrails.md) traz um mapeamento completo para 2026 (`.cursor/rules/ai-guidelines.mdc`, `.github/copilot-instructions.md`, `.openai/instructions.md`, etc). O design proposto envolve injetar um "Hard-Redirect" indicando ao LLM que o `AGENTS.md` é mandatório.

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

- [`researchs/architecture/2026-05-06-topologia-runtime.md`](../researchs/architecture/2026-05-06-topologia-runtime.md) documenta que regras de Git (`CORE-04`, `06`, `08`, `07`, `09`, `10`, `14`, `GR-0203`) e do Sistema de Templates (`CORE-02`, `11`, `13`, `GR-0101`, `0202`) estão espalhadas no compilado final, causando esquecimento de ciclo pelo modelo.

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

## Bloco C — Update Lifecycle Unificado (adicionado em 2026-05-07)

> Bloco aberto durante a revisão da implementação. Resolvido por consenso direto entre owner e revisor (sem necessidade de research adicional — design técnico é continuação aderente dos blocos A/B já resolvidos).

### [DEC-0019-C01] Política de update para conteúdo distribuído ao consumidor

**Pergunta:** Como o framework atualiza arquivos já distribuídos ao consumidor (trampolins, ignore files, templates SDD) sem destruir customizações locais nem silenciar mudanças importantes da CLI?

**Contexto:** A primeira implementação fixou o conflito como "preserve por padrão, overwrite só com `--force`". Resultado: customizações são protegidas, mas updates da CLI ficam silenciados, e `providers --prune` propaga prune para `.ai-guidelines/templates/` (regressão silenciosa de dados). O problema espelha o "Context Rot" resolvido para providers no eixo espacial, agora no eixo temporal.

**Opções:**

| Opção | Descrição                                                                                                                                                                                                  | Pró                                                                                                                                                                        | Contra                                                                                                                                        |
| :---- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | **Política unificada com dois modos**: `managed-block` (marcadores delimitando região controlada) para trampolins/ignores; `mirror` (overwrite total) para templates SDD que o usuário não edita in-place. | Resolve update vs preserve sem `--force` ad-hoc; comentário humano em PT-BR alerta sobre legado em arquivos preexistentes; coerente entre todos os artefatos distribuídos. | Implementação mais cara (parser/serializer de marcador, 3 estratégias de write); requer migração silenciosa de instalações já adotadas.       |
| B     | **Manter "preserve por padrão"** + adicionar comando `update --force-trampolines` para o caso explícito.                                                                                                   | Implementação mínima; consumidor opta pelo update.                                                                                                                         | Atualizações importantes (ex: hard-redirect com nova diretriz) ficam escondidas até o usuário lembrar de rodar; `--force` é blunt instrument. |
| C     | **Spinoff `template-lifecycle-e-update`** entrega isso depois.                                                                                                                                             | Ganha velocidade de merge da 0019.                                                                                                                                         | Primeira leva de consumidores recebe contrato que muda logo; re-trabalho garantido.                                                           |

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Escolha:** [x] A | [ ] B | [ ] C
- **Justificativa:** owner confirmou (2026-05-07) que resolver agora evita débito imediato. Opção A absorve o spinoff `template-lifecycle-e-update` na 0019 e mantém coerência arquitetural — mesma política para trampolins e templates SDD, com modos derivados da natureza do arquivo (editável in-place vs boilerplate). O comentário humano em PT-BR ataca diretamente a fragilidade de instruções metalinguais para LLMs.
- **Data / Owner:** 2026-05-07 / @rosanarezende

### [DEC-0019-C02] Adapter content migra para o trampolino

**Pergunta:** Onde devem viver as regras específicas de cada adapter (ex.: `.core/rules/adapters/claude.md`)? No `AGENTS.md` compilado (estado atual) ou colocalizadas no trampolino do provider?

**Contexto:** A revisão do PR identificou H3 órfão `### Provider Adapters` (vazio) seguido de `### Adapter: claude` (também H3) no `AGENTS.md` compilado. Topologia confusa. Owner identificou que o lugar natural do adapter content é dentro do arquivo nativo do provider (`CLAUDE.md`, `GEMINI.md`, etc.), porque o agente já lê esse arquivo primeiro.

**Opções:**

| Opção | Descrição                                                                                                                                                                    | Pró                                                                                     | Contra                                                                                                                                 |
| :---- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| A     | **Adapter content vive no trampolino**: hard-redirect + adapter rules no mesmo arquivo nativo, dentro do `managed-block`. `AGENTS.md` perde a seção `### Provider Adapters`. | Topologia limpa; cada provider lê um único arquivo nativo com tudo; resolve o H3 órfão. | Trampolino deixa de ser "mínimo" — vira documento. Mas isso preserva a tese: provider lê SEU arquivo + redirect.                       |
| B     | **Manter no `AGENTS.md`** corrigindo apenas o H3 (subir adapters para H4 ou eliminar wrapper).                                                                               | Mínimo refactor.                                                                        | Não resolve o problema topológico de fundo: agente Claude lê CLAUDE.md → vê só hard-redirect → busca regras no AGENTS.md. Dois saltos. |

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Escolha:** [x] A | [ ] B
- **Justificativa:** owner confirmou (2026-05-07). A opção A respeita a tese original do bloco B (cada provider lê seu arquivo nativo) e completa a separação `providers` vs `adapters` decidida em `[DEC-0019-B02]`. Refina sem reabrir.
- **Data / Owner:** 2026-05-07 / @rosanarezende

---

## Resumo de status

| ID               | Bloco | Status                      |
| :--------------- | :---- | :-------------------------- |
| `[DEC-0019-B01]` | B     | Resolved                    |
| `[DEC-0019-B02]` | B     | Resolved (refinado por C02) |
| `[DEC-0019-C01]` | C     | Resolved                    |
| `[DEC-0019-C02]` | C     | Resolved                    |

**Status agregado:** Resolved

---

## ✅ Gate fechado

- **Data:** 2026-05-07 (re-fechado após reabertura)
- **Owner:** [@rosanarezende]
- **Pontos resolvidos:**
  - [x] `[DEC-0019-B01]`
  - [x] `[DEC-0019-B02]`
  - [x] `[DEC-0019-C01]`
  - [x] `[DEC-0019-C02]`
