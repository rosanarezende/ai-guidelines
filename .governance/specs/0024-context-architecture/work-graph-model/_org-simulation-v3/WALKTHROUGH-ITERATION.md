# Walkthrough Iteration — sim v3

> Autoridade: `../model.yml` continua sendo o SSOT do modelo. Este arquivo acompanha a iteracao
> de produto da sim v3: bugs observados pela owner, decisoes de UX, perfil de uso e criterios para
> declarar que o app serve como dogfood real.

## Objetivo

Validar se a sim v3 e compreensivel e util para uma organizacao que esta adotando o framework em
repos existentes. A barra e a mesma do red-team: evidencia mecanizada, falha fechada quando
necessario e avisos honestos quando ha colapso ou cerimonia.

## Estado Atual

- Branch: `feat/spec-0024-artifact-taxonomy-and-model-review-contract`
- Head inicial desta iteracao: `78ef7462`
- App: `_apps/governance-next`
- Stack decidida: TypeScript strict + React/Next + Material UI
- Decisao: substituir o app JS/JSX em lugar; nao manter adapter entre app antigo e app novo

## Observacoes da Owner

| id  | tela          | observacao                                                                             | severidade | status            |
| --- | ------------- | -------------------------------------------------------------------------------------- | ---------- | ----------------- |
| W1  | boot          | warnings React/MUI e hydration mismatch ao abrir `npm run dev`                         | P0         | fechado no app v2 |
| W2  | primeira tela | nao fica claro se a tela e stakeholder, lider, dev ou auditor                          | P0         | fechado no app v2 |
| W3  | planejamento  | objetivos precisam ser navegaveis por ciclo/ano e mais proximos de dashboard executivo | P1         | fechado no app v2 |
| W4  | arquitetura   | app deve ser TypeScript robusto; backend/runtime tambem sera migrado depois            | P0         | decidido          |
| W5  | configuracoes | integracoes e assistente inicial precisam aparecer no onboarding sem fingir mecanismo  | P0         | fechado como UX   |
| W6  | perfis        | admin, payer, sponsor, owner tecnico e actual-attester nao podem colapsar sem risco    | P0         | fechado como UX   |

## Bugs Tecnicos

| id  | sintoma                                                   | causa provavel                                        | correcao esperada                                                    | status  |
| --- | --------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- | ------- |
| T1  | `item` vazando para DOM                                   | uso de `Grid` incompatível com a versao atual do MUI  | remover `Grid`; usar layout CSS grid via `Box`                       | fechado |
| T2  | `alignItems`/`justifyContent`/`flexWrap` vazando para DOM | props de layout vazando por componentes de layout     | remover `Stack`/`Grid` da camada principal; usar `Box sx`            | fechado |
| T3  | hydration mismatch                                        | MUI/Emotion sem integracao SSR dedicada no App Router | shell MUI client-only enquanto a sim nao instala pacote SSR dedicado | fechado |
| T4  | app sem tipos                                             | app em JS/JSX com `jsconfig`                          | migrar para TS/TSX + `tsconfig` strict                               | fechado |

## Perfis de Uso

| perfil         | objetivo                                                              | primeira tela       | pode executar                       |
| -------------- | --------------------------------------------------------------------- | ------------------- | ----------------------------------- |
| stakeholder    | acompanhar objetivos, targets, actuals, riscos e confianca            | Company Dashboard   | nao                                 |
| owner          | acompanhar intents, targets sob responsabilidade, outcomes e blockers | Owner Workspace     | dry-run controlado                  |
| tech-lead      | coordenar repo-work, contratos, evidencias e dependencias             | Execution Workspace | dry-run/execute conforme authority  |
| sre-ops        | acompanhar incidentes, standalone, SLO e operational bucket           | Ops Workspace       | dry-run/execute operacional         |
| adoption-admin | configurar perfil de governanca, papeis, assistente e integracoes     | Configuracoes       | ainda nao; futura mutacao governada |
| auditor-admin  | inspecionar issues, grafo, event-log e comandos                       | Audit Console       | sim, com authority resolvida        |

## Walkthroughs Obrigatorios

1. `objective -> target -> intent -> repo-work done -> outcome -> actual`
2. `intent-checkout-stack -> contract acme-user-context@v4 -> outcome -> target`
3. `incident -> standalone.complete -> outcome operacional -> warning self-attested visivel`
4. `issue/warning -> causa -> quem decide -> proxima mutacao governada`
5. `configuracoes -> perfil da org -> papeis -> assistente Ollama -> catalogo de integracoes -> revisao de riscos`

## Proximas Fatias

1. App v2 TypeScript strict e sem warnings de boot.
2. Primeira tela por perfil: stakeholder/company dashboard.
3. Navegacao por periodo/ciclo.
4. Separacao de console tecnico/admin da experiencia de leitura da owner.
5. Migracao futura da runtime `_lib` para TypeScript com portas explicitas.
6. Persistencia futura das configuracoes via comando governado, nao por formulario direto.
