---
artifact-kind: decision-brief
---

# Plano de extracao para repo irmao

> **Status:** decisao de corte aprovada; execucao fisica ainda nao realizada.
> **Data:** 2026-07-09.
> **Escopo:** produto visual que nasceu como `governance-demo` e agora segue
> como candidato **Guilda Governance**.
> **Autoridade:** detalha a QRD-38 e a QRD-53 em
> [`APP-DECISIONS.md`](APP-DECISIONS.md). Complementa
> [`PRODUCT-TOPOLOGY.md`](PRODUCT-TOPOLOGY.md) e
> [`PRODUCT-DECISION-ROUND.md`](PRODUCT-DECISION-ROUND.md).

## 1. Decisao curta

O produto vivo deve sair de
`.governance/specs/0024-context-architecture/work-graph-model/governance-demo/`
para um **repo irmao** de `ai-guidelines`.

Destino local recomendado:

```text
C:\Users\Rosana\dev\guilda-governance
```

Nome publico ainda e candidato, nao decisao juridica final:

```text
Guilda                 ecossistema / guarda-chuva
Guilda Governance      app visual e desktop local-first
guilda flow            CLI publica futura
Guilda Workgraph       modelo tecnico / read-model de grafo
Guilda Host            governance host Git-backed
Guilda Cup             Contextual Work Partner
ai-guidelines          engine/core repo-first atual
```

## 2. Por que cortar agora

O app deixou de ser uma demo tecnica da Spec 0024. Ele ja possui:

- marca candidata;
- frontend, backend, mock-api, packages, tests e assets;
- contratos Zod e testes por camadas;
- portal/control plane;
- direcao desktop local-first;
- spike de filesystem/Git/SQLite;
- documentos de produto, topologia e roadmap.

Continuar implementando desktop, Tauri/Rust, empacotamento, GitHub host e UX de
produto dentro de uma pasta de spec aumenta:

- churn de paths;
- confusao de PR #45, cujo escopo e taxonomia/model-review;
- custo de CI;
- acoplamento indevido ao repo raiz;
- dificuldade de dogfood multi-repo.

O corte agora reduz retrabalho antes da proxima grande leva de implementacao.

## 3. O que move para o repo novo

Mover como produto vivo:

```text
governance-demo/
  frontend/
  backend/
  mock-api/
  packages/
  test/
  tools/
  deploy/
  brand/
  acme/
  APP-*.md
  PRODUCT-*.md
  SPIKE-*.md
  TESTING-STRATEGY.md
  POLICY-HANDBOOK.md
  ENVIRONMENTS.md
  README.md
```

No repo novo, a estrutura inicial pode preservar os nomes atuais para reduzir
risco. A reorganizacao para `apps/desktop`, `apps/web`, `services/backend` ou
`packages/ui` deve vir em commit posterior no repo novo, depois que os checks
basicos estiverem verdes.

## 4. O que fica no `ai-guidelines`

Ficam como evidencia historica da Spec 0024:

```text
.governance/specs/0024-context-architecture/work-graph-model/
  model.yml
  research/
  _reviews/
  deliberation/
  _archive/
  tracker.md
  demais artefatos de pesquisa e decisao
```

Depois do corte fisico, o antigo `governance-demo/` neste repo deve ser
substituido por uma nota curta de ponte, nao por uma segunda copia viva:

```text
governance-demo/
  README.md   # aponta para o repo irmao e para os artefatos historicos
```

Regra: **produto vivo em um lugar so**. Este repo guarda a historia, nao uma
segunda implementacao ativa.

## 5. Fronteira entre repos

```text
ai-guidelines
  framework/engine/CLI repo-first
  comandos de governanca, adocao, review, decide, rules e bootstrap
  nao e o app visual

guilda-governance
  app visual e desktop local-first
  portal complementar
  backend do produto, mock-api, testes, brand, dashboards e Cup
  consome ai-guidelines por contrato publico, nunca por path interno profundo

governance host da plataforma
  repo Git-backed futuro que governa ai-guidelines + guilda-governance
```

Pacotes `packages/domain`, `packages/contracts` e `packages/test-fixtures` que
vivem hoje dentro de `governance-demo` movem com o produto. Eles sao dominio do
Guilda Governance, nao do core `ai-guidelines` ate nova decisao.

Se algum contrato virar parte generica do framework, ele deve migrar depois por
QRD propria, com API publica, testes e release do `ai-guidelines`.

## 6. Estrategia de historico

Metodo preferido para preservar blame/historico:

```powershell
cd C:\Users\Rosana\dev
git clone C:\Users\Rosana\dev\ai-guidelines guilda-governance
cd guilda-governance
git filter-repo `
  --path .governance/specs/0024-context-architecture/work-graph-model/governance-demo/ `
  --path-rename .governance/specs/0024-context-architecture/work-graph-model/governance-demo/:
```

Se `git filter-repo` nao estiver instalado, alternativas aceitaveis:

- instalar `git-filter-repo` e repetir o fluxo acima;
- usar `git subtree split` como fallback temporario;
- copiar para um repo novo apenas se a preservacao de historico for
  explicitamente rejeitada por decisao humana.

O ponto de corte deve registrar:

- SHA de origem no `ai-guidelines`;
- branch de origem;
- path de origem;
- primeiro SHA do repo novo;
- link cruzado entre os dois repos.

## 7. Ordem operacional segura

1. **Fechar o estado local atual no `ai-guidelines`.**
   - A fatia desktop-local-first ainda esta no working tree local.
   - Antes do corte, ela precisa ser commitada ou descartada de forma
     explicita.

2. **Criar o repo irmao local por `git filter-repo`.**
   - Nao criar ainda org publica, package, dominio ou release.
   - Primeiro provar que o repo novo roda sozinho.

3. **Rodar checks minimos no repo novo.**
   - typecheck packages/backend/frontend/mock-api;
   - `test:shell`;
   - `test:api`;
   - `contracts:check`;
   - `check-governance-app`;
   - `test:e2e` se o ambiente suportar.

4. **Reconciliar paths.**
   - remover dependencia de `repoRoot` profundo;
   - ajustar workspaces;
   - ajustar scripts;
   - ajustar paths de `acme/`, `brand/`, `deploy/` e `tools/`.

5. **Criar ponte no `ai-guidelines`.**
   - substituir produto vivo por README de encaminhamento;
   - manter research, reviews e QRDs;
   - atualizar PR #45 para declarar que produto foi extraido ou que a extracao
     esta pendente.

6. **Abrir dogfood da plataforma.**
   - criar governance host Git-backed da propria plataforma;
   - cadastrar `ai-guidelines` e `guilda-governance` como fontes;
   - registrar roles iniciais e criterio de dogfood suficiente.

## 8. Estrutura inicial recomendada no repo novo

Primeiro corte preserva a estrutura atual:

```text
guilda-governance/
  frontend/
  backend/
  mock-api/
  packages/
  test/
  tools/
  deploy/
  brand/
  acme/
```

Depois do corte estabilizado, reorganizar para:

```text
guilda-governance/
  apps/
    desktop/
    web/
  services/
    backend/
    mock-api/
  packages/
    domain/
    contracts/
    test-fixtures/
    ui/
  tests/
  tools/
  deploy/
  brand/
  examples/
  docs/
```

Nao fazer essa reorganizacao no mesmo commit do corte. Primeiro provar
portabilidade; depois melhorar arquitetura.

## 9. Criterios de pronto para cortar

O corte fisico pode iniciar quando:

- a owner confirmar o nome operacional do repo local (`guilda-governance` por
  enquanto);
- o working tree atual for commitado ou limpo;
- houver concordancia de que PR #45 nao representa readiness do app;
- a fatia desktop-local-first estiver preservada;
- o plano acima for aceito como protocolo de corte.

O corte publico pode iniciar depois:

- checagem juridica/comercial minima do nome;
- decisao de licenca;
- README publico reconciliado;
- CI do repo novo verde;
- politica minima para portal se houver deploy publico.

## 10. Riscos

| Risco                              | Mitigacao                                                            |
| ---------------------------------- | -------------------------------------------------------------------- |
| Perder historico                   | usar `git filter-repo`; registrar SHA de corte                       |
| Duplicar produto vivo              | deixar no `ai-guidelines` apenas ponte historica depois do corte     |
| Cortar antes dos checks            | nao publicar repo novo antes dos checks minimos verdes               |
| Misturar core e produto            | `ai-guidelines` fica engine; `guilda-governance` fica produto visual |
| Nome ainda nao juridicamente limpo | repo local pode usar nome candidato; repo publico espera clearance   |
| Desktop exigir refactor grande     | cortar antes de Tauri/Rust reduz retrabalho de paths                 |

## 11. Decisao operacional

**Implementacao nova de produto deve parar de crescer neste path profundo.**

A proxima implementacao estrutural relevante deve acontecer no repo irmao, apos
o corte local ou apos uma etapa explicita de preparacao para corte.
