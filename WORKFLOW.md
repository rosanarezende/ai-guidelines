# Development Workflow

Guia end-to-end do ciclo de desenvolvimento deste repositório — do research ao merge — usando os comandos do `ai-guidelines`.

> **Regra central:** o merge É o encerramento da spec. Não existe "commit de encerramento pós-merge" para governança. Tudo que pode ser feito antes do merge **deve** ser feito antes do merge. A única exceção são automações disparadas pelo próprio evento de merge (CI, landed-via reconciliation).

---

## Mapa de estágios

```
Research → Backlog → Spec → Implementação → Closure na branch → Merge → Automação
   0           1        2          3                4                5         6
```

Cada estágio tem artefatos canônicos e comandos associados. Estágios 0 e 1 são opcionais para ajustes rápidos (ver [Caminho rápido](#caminho-rápido-sem-spec)).

---

## Estágio 0 — Research (quando necessário)

Antes de abrir uma spec, pesquise o suficiente para tomar a decisão de design. Research que sobrevive à spec entra na biblioteca central.

**Artefatos:**

- `research/` dentro da pasta da spec — rascunhos de descoberta
- `.governance/specs/research-library/<domínio>/` — pesquisas consolidadas (canônico)
- `.governance/specs/research-index.md` — índice navegável

**Regra:** ao fechar a spec, pesquisas de valor migram para `research-library/` com prefixo `YYYY-MM-DD-` e entrada no `research-index.md`. O que não migra morre no histórico git — não em pasta ativa.

---

## Estágio 1 — Backlog

Toda iniciativa não-trivial começa como candidata no backlog antes de virar spec.

**Arquivo canônico:** `.governance/specs/roadmap/backlog.md`

**Quando criar uma candidata:**

- A ideia estima mais de uma sessão de trabalho
- Toca mais de um arquivo fora de uma feature isolada
- O resultado precisa sobreviver a troca de sessão ou colaborador

**Quando a candidata vira spec:** quando o owner decide priorizar. A ordem de `Now` no backlog é a fila.

---

## Estágio 2 — Abertura da spec

```bash
yarn guidelines workflow   # opção 1 — Nova spec / retomar
```

**Artefatos criados na pasta `.governance/specs/<NNNN>-<slug>/`:**

| Arquivo             | Papel                                  | Mutabilidade                |
| ------------------- | -------------------------------------- | --------------------------- |
| `spec.md`           | Porquê e contrato de valor             | Imutável após `In Review`   |
| `state.yml`         | Estado operacional canônico            | Vivo durante execução       |
| `plan.md`           | Como será entregue                     | Vivo durante execução       |
| `tasks.md`          | Checklist de execução                  | Vivo durante execução       |
| `decision-brief.md` | Decisões arquiteturais com gate humano | Specs evidence-driven/mixed |
| `NEXT.md`           | Débitos adiados (apenas se houver)     | Deletado no fechamento      |

**Branch:** `feat/spec-<NNNN>-<slug>`

**Regra:** uma spec ativa por vez. Feche antes de abrir outra.

---

## Estágio 3 — Implementação

O trabalho acontece em PRs atômicos empilhados (stacked PRs) na branch da spec.

```bash
yarn guidelines continue          # briefing da spec ativa + gate L2 de execução
yarn guidelines workflow          # wizard: drift check, publish state, status
```

**Gate L2:** `yarn guidelines continue` bloqueia com mensagem narrativa se `tasks.md` estiver ausente ou sem tasks autorizadas. Não é possível bypassar — é enforcement estrutural.

**Publish state:**

```bash
yarn guidelines workflow publish-state --status="In Progress (Stage 2)"
```

Projeta o estado interno para `.governance/runtime/active-specs.yml` (índice público).

**Cada PR deve ser autossuficiente:** CI verde, testes passando, sem trabalho pendente declarado.

---

## Estágio 4 — Review

Quando a implementação está completa, os gates de prontidão são verificados em `.governance/specs/<NNNN>-<slug>/review.md`.

```bash
yarn guidelines review [<pr>]    # estrutura comentários de review para colar na IA
```

**Gates canônicos do `review.md`:**

| Gate   | O que verifica                                             |
| ------ | ---------------------------------------------------------- |
| R1     | CI verde                                                   |
| R2     | Smoke TTY — wizard renderiza corretamente                  |
| R3     | NEXT migrado para backlog — débitos concretos fora da spec |
| R4     | Public-facing check — README, docs de consumidor           |
| R5     | Critérios de aceite confirmados ponto-a-ponto              |
| R6     | PR bodies coerentes com o estado final                     |
| R7     | Stack marcada como Ready + sign-off                        |
| **R8** | **Merge authorization do owner** — gate humano explícito   |
| **R9** | **Branch em estado final** — ver Estágio 5                 |

---

## Estágio 5 — Fechamento da branch (antes do merge)

**Este estágio acontece na branch, antes do merge. O merge não acontece enquanto a branch não refletir exatamente o estado que `main` terá depois.**

Checklist completo — tudo em commits na branch:

```
[ ] spec.md: status atualizado para "Done"
[ ] state.yml: stage → "done", next: vazio
[ ] NEXT.md: arquivo deletado (não renomeado, não esvaziado — deletado)
[ ] historico.md: entrada da spec adicionada em "Concluídas"
[ ] backlog.md: entrada da spec removida de "Em execução"
[ ] research/: pesquisas de valor migradas para research-library/ + research-index.md atualizado
[ ] release-log.md T0: data, owner, stack, versão alvo preenchidos (SHA/run ficam para CI)
[ ] review.md R9: marcado [x] — evidência: branch reflete estado final
```

> **Por que deletar o NEXT.md em vez de deixar para depois?**
> Um PR autossuficiente não deixa trabalho pendente para quem vier depois. Se o arquivo existe na branch quando o PR mergeia, ele existe em `main` — e `main` deve sempre estar em estado limpo.

**Release-log T0 — o que preencher antes vs depois:**

| Campo                 | Antes do merge   | Pós-merge (CI/automação) |
| --------------------- | ---------------- | ------------------------ |
| Data, owner, stack    | ✅ você preenche | —                        |
| Versão alvo           | ✅ você preenche | —                        |
| SHA do merge, tag git | —                | ✅ CI preenche           |
| GitHub Release URL    | —                | ✅ CI cria               |
| Resultado (✅/⚠️/❌)  | —                | ✅ você confirma         |

---

## Estágio 6 — Merge

```bash
yarn guidelines workflow   # opção 5 — Executar merge atômico da stack
```

**Modo `unit` (padrão):** mergeia apenas o PR terminal da stack em `main`, gerando 1 SHA canônico. Os demais PRs da stack são fechados como "landed via #SHA" automaticamente.

**Modo `sequential`:** mergeia PR por PR em sequência na base. Gera N SHAs. Útil quando cada PR tem valor independente no histórico.

O merge authorization (R8) é verificado antes da execução. Sem autorização textual do owner no PR, o comando não prossegue.

---

## Estágio 7 — Automação pós-merge

O que acontece automaticamente, sem ação humana:

| O que                                                                | Quem               | Condição          |
| -------------------------------------------------------------------- | ------------------ | ----------------- |
| Landed-via reconciliation — fecha PRs da stack com "landed via #SHA" | CLI (merge-stack)  | Sempre            |
| npm publish — publica versão no registry                             | CI (`release.yml`) | Specs com publish |
| GitHub Release — cria release com changelog                          | CI (`release.yml`) | Specs com publish |

Após CI rodar, confirme o T0 do `release-log.md` com o resultado e link da run. Essa confirmação é a única ação humana pós-merge — e mesmo assim é bookkeeping, não trabalho de spec.

---

## Caminho rápido (sem spec)

Para ajustes triviais — typo, wording, bug pequeno, mudança em ≤ 1 arquivo sem decisão arquitetural:

```
main → branch fix/docs → commit atômico → PR → CI verde → merge
```

Sem spec, sem NEXT.md, sem review.md. O PR é o artefato completo.

**Critério:** se a mudança estima mais de uma sessão ou toca múltiplos arquivos, use o fluxo de spec.

---

## Releases npm

Para specs que publicam no registry:

1. `yarn guidelines release-prep [--version <v>]` — prepara o bump de versão e valida o plano
2. `yarn guidelines release-prep --dry-run` — audita sem aplicar (use antes de confirmar)
3. O bump de versão, CHANGELOG e tag entram na branch antes do merge
4. Após merge, CI (`release.yml`) publica automaticamente

Referência completa: `.core/process/governance-foundation.md` §"Sequência canônica para specs com publish em registry externo".

---

## Referências

| O que precisa                                          | Onde encontrar                           |
| ------------------------------------------------------ | ---------------------------------------- |
| Mecânica dos artefatos (spec.md, plan.md, tasks.md...) | `.core/process/governance-foundation.md` |
| Como contribuir (commits, PRs, setup local)            | `CONTRIBUTING.md`                        |
| Comandos disponíveis e flags                           | `yarn guidelines --help`                 |
| Backlog de próximas specs                              | `.governance/specs/roadmap/backlog.md`   |
| Specs concluídas                                       | `.governance/specs/roadmap/historico.md` |
| Research consolidado                                   | `.governance/specs/research-index.md`    |
| Fluxo obrigatório para agentes IA                      | `AGENTS.md`                              |
