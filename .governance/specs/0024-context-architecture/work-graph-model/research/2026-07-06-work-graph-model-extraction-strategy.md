---
artifact-kind: research
---

# Estratégia de extração/promoção do `work-graph-model`

> **Frente:** Spec 0024 · work-graph-model · governance-demo
> **Data da pesquisa:** 2026-07-06
> **QRDs alvo:** QRD-38 (extração/promoção), com QRD-37 (produto/nome) e QRD-13 (relação com CLI).
> **Regra:** repositório vence narrativa; preservar histórico/testes/docs/governança; não abrir repo separado por inércia.

## 1. Base verificada

**Local:**

- `APP-DECISIONS.md` QRD-38 (research-open): decidir extração só após pesquisa; propor estratégia em fases com critérios objetivos; não deixar `work-graph-model` bloquear o encerramento da Spec 0024.
- Estrutura real de `work-graph-model/`: `governance-demo/` (frontend, backend, mock-api, test, packages, acme, tools, docs `APP-*`), `model.yml`, `research/` (18 arquivos), `_reviews/` (10 + README), `_templates/`, `_map/`, `_archive/`, `tracker.md`, `deliberation/`, `_red-team-corpus/`.
- Root `package.json` workspaces incluem `governance-demo/packages/*`, `backend`, `frontend`, `mock-api`, `test` — os pacotes são **npm workspaces do repo raiz `ai-guidelines`**, resolvidos por caminho relativo profundo (`.governance/specs/0024-.../governance-demo/...`).
- Guards em `tools/checks/check-governance-app.ts` assumem `repoRoot = root/../../../../..` (5 níveis acima de `governance-demo`) e paths de `acme/governance`.
- Git: PR [#45](https://github.com/rosanarezende/ai-guidelines/pull/45) aberto; branch de spec ativa.

**Externas:**

- `git filter-repo` (preserva histórico ao extrair subdir): <https://github.com/newren/git-filter-repo>
- GitHub — "Splitting a subfolder out into a new repository": <https://docs.github.com/en/get-started/using-git/splitting-a-subfolder-out-into-a-new-repository>
- `git subtree` (alternativa não-destrutiva): <https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging> (subtree) e docs do GitHub acima.

## 2. Fatos

- **F1 — O `work-graph-model` já ultrapassou "artefato de pesquisa".** Contém modelo/SSOT, app completo (front+back+mock+test+packages), dogfood `acme/`, reviews e decisões de produto. (Fonte: repo + QRD-38 R.)
- **F2 — Acoplamento físico ao repo raiz é real e profundo.** Os workspaces npm, o lockfile único e os guards dependem de `repoRoot` a 5 níveis acima. Extrair muda todos esses caminhos e o contrato de `check-governance-app.ts`. (Fonte: repo.)
- **F3 — `git filter-repo --path <subdir>/ --path-rename <subdir>/:.` extrai o subdiretório para a raiz de um novo repo com histórico completo** (git blame/auditoria preservados). É o sucessor recomendado de `git filter-branch`. (Fonte: newren/git-filter-repo; GitHub docs.)
- **F4 — GitHub documenta o split de subpasta preservando histórico** como fluxo suportado; `git subtree split` é a alternativa não-destrutiva que mantém os dois repos sincronizáveis por um tempo. (Fonte: GitHub docs.)
- **F5 — A CLI `ai-guidelines` e o produto compartilham runtime/contratos (QRD-13).** Extrair o produto para outro repo cria uma fronteira de dependência entre os dois (o produto passaria a consumir `ai-guidelines` como pacote, ou o core viraria pacote publicado). (Fonte: repo/QRD-13.)

## 3. Interpretação

O dilema do QRD-38 é real e tem dois erros simétricos:

- **Erro A (adiar):** manter tudo em `work-graph-model` para sempre → a Spec 0024 nunca fecha e o produto fica escondido dentro de uma pasta de spec.
- **Erro B (extrair cedo):** abrir repo separado agora → paga o custo de dois repos, CI duplicado, releases e sincronização **antes** de o core estar estável e nomeado (QRD-37). Fork prematuro é caro e reversível só com dor.

A saída é **faseada e guiada por gatilhos objetivos**, não por data. O ponto-chave (INTERPRETAÇÃO): a extração física deve ser a **última** etapa, não a primeira. Antes dela, dá para colher quase todo o valor de "produto de primeira classe" com movimentos baratos e reversíveis dentro do próprio repo.

Ordem natural de maturação:

1. **Congelar a fronteira de pacotes** (já feito: `@demo/domain|contracts|test-fixtures` + SDK `@demo/backend`). Isso é o que torna extração possível depois sem espaguete.
2. **Estabilizar o nome e a licença** (QRD-37) — extrair sem nome é extrair errado.
3. **Só então** decidir entre promover para raiz (monorepo) ou repo separado.

O modelo mental correto para "o que fica na Spec 0024": a Spec 0024 guarda a **evidência histórica** (deliberação, research, reviews, model.yml como decisão de arquitetura de contexto). O **produto vivo** (app + runtime + packages) é que eventualmente migra. `git filter-repo` permite levar o histórico do produto **sem** apagar o rastro histórico que deve permanecer na spec (pode-se copiar histórico, não é preciso mover destrutivamente).

## 4. Matriz de alternativas

| Alternativa                                                                            | O que entrega                                                                     | Custo/operação                                    | Lock-in                   | Reversibilidade         | Maturidade p/ decidir                      | Riscos                                                | Aderência ao modelo        |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------- | ----------------------- | ------------------------------------------ | ----------------------------------------------------- | -------------------------- |
| **A. Ficar na Spec 0024 (status quo)**                                                 | zero custo; histórico intacto                                                     | nenhum                                            | nenhum                    | total                   | —                                          | Spec 0024 não fecha; produto escondido                | alta agora / baixa adiante |
| **B. Promover p/ raiz do monorepo** (`/<produto>/`)                                    | visibilidade; README raiz; workspaces mais rasos; preserva histórico via `git mv` | médio (reconciliar paths, guards, workspaces, CI) | nenhum                    | alta                    | média                                      | mistura framework + produto; janela de churn de paths | alta                       |
| **C. Repo separado AGORA (`git filter-repo`)**                                         | identidade própria; contribuição limpa                                            | alto (CI, releases, docs, sync core↔produto)      | acoplamento entre 2 repos | média (re-merge é caro) | baixa (nome/licença/critérios não batidos) | fork prematuro; core instável                         | média                      |
| **D. Repo separado DEPOIS, por gatilhos** (`git filter-repo` quando critérios baterem) | timing certo; core estabiliza e é nomeado antes                                   | médio (planejar)                                  | acoplamento controlado    | alta até o corte        | alta                                       | exige disciplina p/ não virar Erro A                  | **alta**                   |

## 5. Recomendação

**Resposta objetiva às perguntas 4 e 5 do prompt.**

**Pergunta 4 (extrair/promover/manter):** **Fase agora = manter na Spec 0024 + preparar promoção (D com passo B intermediário).** Não extrair para repo separado nesta fase. Sequência recomendada:

- **Fase 0 (agora, barato):** congelar taxonomia de produto (research irmã de posicionamento), decidir critério de nome/licença. **Nenhum movimento de arquivo.**
- **Fase 1 (quando nome+licença decididos):** _opcional_ — promover o produto para uma pasta de 1ª classe (raiz do monorepo) com `git mv` (histórico preservado nativamente), reconciliando workspaces, `repoRoot` dos guards e CI. Isso dá "produto de primeira classe" sem repo separado. Reversível.
- **Fase 2 (quando os gatilhos abaixo baterem):** extrair para repo próprio com `git filter-repo`, publicando o core (`packages/*` + runtime) como pacote consumível e deixando na Spec 0024 a evidência histórica.

**Gatilhos objetivos para autorizar Fase 2 (repo separado):**

1. Nome público decidido e disponibilidade verificada (npm/GitHub/domínio).
2. Licença por corpo decidida (core permissivo; app definido).
3. Fronteira de pacotes estável por ≥ N semanas sem refactor estrutural (os `@demo/*` já apontam nessa direção).
4. Suíte verde e reproduzível fora do contexto da spec (checks de `governance-demo` rodando com `repoRoot` novo).
5. Demanda real de contribuição externa (issues/PRs de terceiros) OU decisão de release público.
6. Control plane (QRD-36) resolvido o suficiente para não retrabalhar identidade logo após o corte.

**Pergunta 5 (como extrair sem perder histórico/testes/docs/governança):**

- Usar **`git filter-repo --path governance-demo/ --path-rename governance-demo/:.`** (após clonar em diretório limpo) para levar o produto com histórico completo (F3). Incluir múltiplos `--path` se houver renomeações passadas.
- **Não mover destrutivamente** a evidência histórica: a Spec 0024 mantém deliberação/research/reviews/model.yml; o repo novo recebe uma cópia do histórico relevante. Registrar no `decision-brief`/tracker o ponto de corte (commit hash) para rastreabilidade cruzada.
- Reconciliar antes do corte: `repoRoot` dos guards, `package.json` workspaces, lockfile, paths de `acme/governance` e os checks focados (`check-governance-app.ts`, `contracts:check`, `test:shell`, `test:api`).
- Preservar **governança**: o novo repo herda `APP-*`, `TESTING-STRATEGY.md`, contratos de teste e a disciplina "contrato antes de implementação" (QRD-34). Rodar OpenSSF Scorecard/OSPS Baseline no repo novo como marco de maturidade.

**Manter aberto:** promover para raiz (Fase 1) é opcional e pode ser pulado se a decisão for ir direto de spec → repo separado quando os gatilhos baterem.

## 6. Impacto em QRDs

- **Avançar QRD-38 (segue research-open):** registrar a estratégia em 3 fases + os 6 gatilhos objetivos + o método `git filter-repo`. Isso remove o risco de "bloquear o fechamento da Spec 0024" sem forçar fork prematuro.
- **Depende de:** QRD-37 (nome/licença) e QRD-36 (control plane) — ambos são pré-condição da Fase 2.
- **Novos contratos/checks sugeridos (não implementar nesta rodada):**
  - `DOC`: registrar no `decision-brief`/tracker os 6 gatilhos como checklist de "pronto para extrair".
  - `CHECK` (futuro): script que valida os checks focados rodando com `repoRoot` parametrizável (prepara a portabilidade antes do corte).
