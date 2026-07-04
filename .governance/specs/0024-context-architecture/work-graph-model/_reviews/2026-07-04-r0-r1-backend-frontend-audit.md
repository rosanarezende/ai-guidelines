# Auditoria adversarial R0/R1 — backend, frontend e fluxo de adoção

Data: 2026-07-04  
Escopo: `governance-demo` pós-commit `b34be4b2` (`feat: add governance demo R0 mock harness and R1 adoption backend`)  
Postura: revisão técnica/adversarial. Foco em prontidão real do app, não em repetir o plano.

## 1. Base verificada

### Fatos

- Branch local: `feat/spec-0024-artifact-taxonomy-and-model-review-contract`.
- HEAD local no início da revisão: `b34be4b2`.
- Branch local estava `ahead 1` de `origin/feat/spec-0024-artifact-taxonomy-and-model-review-contract`.
- Working tree estava limpa antes da revisão e seguiu limpa após os checks.
- `gh pr status --json currentBranch` retornou exit 1 sem payload; PR/CI remoto não foi confirmado nesta rodada.
- Não encontrei `state.yml` na raiz nem em `.governance/state.yml`; para esta revisão usei os docs versionados de `governance-demo` e o código como autoridade local.

### Arquivos revisados

- `governance-demo/APP-DECISIONS.md`
- `governance-demo/APP-FUNCTIONAL-SPEC.md`
- `governance-demo/BACKEND-R0-R1-FINDINGS.md`
- `governance-demo/backend/src/domain/adoption-shell.ts`
- `governance-demo/backend/src/domain/adoption-commands.ts`
- `governance-demo/frontend/server/adoption/**`
- `governance-demo/frontend/app/api/local/**`
- `governance-demo/mock-api/**`
- `governance-demo/test/**`

### Checks executados

| Comando                                                  | Resultado                                                     |
| -------------------------------------------------------- | ------------------------------------------------------------- |
| `npm --workspace acme-governance-backend run typecheck`  | passou                                                        |
| `npm --workspace acme-governance-mock-api run typecheck` | passou                                                        |
| `npm --workspace acme-governance-e2e run test:e2e`       | passou: 1/1 jornada                                           |
| `node tools/checks/check-governance-app.ts`              | passou: Next build + guards + snapshot                        |
| `npm --workspace acme-governance-next-app run typecheck` | falhou: workspace não tem script `typecheck`                  |
| `npx tsc --noEmit` em `frontend/`                        | falhou por `.next/types/**/*.ts` stale/ausente antes do build |

Interpretação dos checks: a aplicação compila pelo caminho oficial `check-governance-app.mjs`, mas a ergonomia de typecheck direto do frontend ainda está frágil.

## 2. Veredito

O commit R0/R1 é um avanço estrutural real: há backend TypeScript, domínio compartilhado, mock API com reducer comum, data-source switch, rotas de produto e primeira jornada Playwright. Mas o app ainda não está pronto como fluxo funcional de adoção multiusuário ou shared/controlled.

A falha principal não é visual. É de contrato de autoridade: o modelo de `account != membership != role assignment != authority` está descrito, mas a API ainda protege quase tudo com "tem sessão e workspace", não com permissões resolvidas. Isso permite mutações sensíveis por qualquer membro e cria authority efetiva por dado enviado pelo cliente.

Recomendação curta: antes de continuar telas, fazer uma fatia R1.1 de `authorization + membership binding + onboarding completion gate`, com fixtures adversariais. Sem isso, o frontend tende a polir um fluxo que o backend ainda não consegue governar.

## 3. Findings priorizados

| id           | sev | fato observado                                                                                                                                                                                                                                                                                                    | interpretação                                                                                                                                                                                                  | cenário concreto                                                                                                                                                                                                                   | correção recomendada                                                                                                                                                                                                                                                                             |
| ------------ | --: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1-AUTH-01   |  P0 | `adoption-commands.ts` usa `requireMember(...)` como guarda para `profile`, `workspace-mode`, `workspace-stack`, `member.invite`, `role.assign`, `host`, `work-source`, `assistant` e `integration` (linhas 191-587). As rotas locais chamam `requireWorkspaceSession()` e encaminham o comando.                  | O backend tem authority derivada, mas não a usa para autorizar mutações sensíveis. Qualquer principal com membership no workspace pode alterar postura, stack, host, fontes, assistente, integrações e papéis. | Uma pessoa convidada para participar do workspace muda `workspace-mode` para `local`, marca integração como `configured`, aprova provider cloud por `egressApproved: true`, ou declara sandbox para finalizar onboarding sem host. | Criar `authorizeLocalCommand(state, principalId, workspaceId, action)` com matriz por ação, profile e role efetiva. Rotas e reducer devem falhar fechado quando não houver authority. Começar por: `workspace-admin`, `membership-manager`, `security-owner`, `integration-owner`, `host-owner`. |
| R1-AUTH-02   |  P0 | `roles/route.ts` aceita `actorPersonId` do body (linhas 37-42). `local.role.assign` marca `self-assigned` se `payload.actorPersonId === subject.id` (adoption-commands.ts linhas 340-357). `resolveWorkspaceAuthority()` concede authority para `accepted` ou `self-assigned` (adoption-shell.ts linhas 634-653). | O cliente decide se a atribuição é autoatribuída. Isso transforma um campo de payload em authority efetiva.                                                                                                    | Prova local com reducer: enviar `actorPersonId` igual ao `subject.id` gerou assignment `status: "self-assigned"` e grant `security-owner` efetivo, sem aceite do sujeito e sem policy.                                             | Nunca aceitar `actorPersonId` do cliente. Derivar ator de uma vinculação `principal -> person` resolvida no servidor. Autoatribuição deve passar por policy/profile e role permitida. Em `full`, papel sensível autoatribuído deve bloquear ou exigir aprovação separada.                        |
| R1-MEMBER-03 |  P0 | `members/invites/[id]/route.ts` exige `requireWorkspaceSession()` antes de aceitar convite (linhas 9-20). O reducer `local.invite.accept` cria `WorkspacePerson`, mas não cria `PrincipalMembership`; `principalWorkspaces()` usa apenas `AdoptionState.memberships` (adoption-shell.ts linhas 489-603).          | O aceite de convite não é um fluxo real de entrada no workspace. Um convidado externo não tem sessão de workspace para aceitar; e, mesmo aceito, vira pessoa no workspace, não principal com acesso.           | Convidar alguém gera token; a pessoa abre link, mas sem workspace selecionado recebe `no-workspace-selected`. Se um membro existente aceita por ela, cria apenas uma pessoa auditável, não acesso de conta.                        | Separar `invite.accept` público/tokenizado de ações autenticadas. Aceite deve vincular `principalId -> personId -> workspaceId`, criar `PrincipalMembership` e registrar `acceptedByPrincipalId`. Revogação continua exigindo authority.                                                         |
| R1-ONB-04    |  P1 | `local.onboarding.set-status` permite `finished` se o caller é membro (adoption-commands.ts linhas 170-183). `APP-DECISIONS.md` QRD-08 diz que onboarding real não conclui sem governance host, salvo sandbox explícito (linhas 256-266).                                                                         | A regra central do onboarding ainda não está mecanizada. O status `finished` pode ser gravado sem host, sem sandbox e sem validar o mínimo configurado.                                                        | Workspace novo sem host chama `/api/local/onboarding/status` com `finished`; a Home deixa de forçar continuação embora não exista lugar autoritativo para governança.                                                              | Criar `canCompleteOnboarding(workspace)` fail-closed: exige profile, workspace-mode, stack compatível, host scaffolded/linked com manifest+event-log ou sandbox explícito, e warnings críticos resolvidos/aceitos conforme profile.                                                              |
| R1-AUTH-05   |  P1 | `APP-DECISIONS.md` define quem pode propor/aceitar/revogar papéis: propor papel comum exige `workspace-admin`, sponsor ou `role-management`; aceitar/rejeitar papel é somente do sujeito (linhas 424-436). O código atual só checa membership.                                                                    | A implementação contradiz a decisão versionada. Mesmo que R1 tenha sido uma fatia, esta lacuna é perigosa porque o app já expõe rotas reais.                                                                   | Um membro não-admin propõe papel sensível para si ou para outro subject; outro membro aceita/rejeita um assignment que não lhe pertence.                                                                                           | Implementar policy de papéis antes de telas avançadas: `role.assign`, `role.accept`, `role.reject`, `role.revoke` precisam de guards separados e fixtures negativas.                                                                                                                             |
| R1-HOST-06   |  P1 | `runHostFitCheck()` calcula `ok` de modo permissivo: `writable && (!pathExists                                                                                                                                                                                                                                    |                                                                                                                                                                                                                | manifestPresent === existsSync(...host.yml))`(host-scaffold.ts linhas 82-83) e depois retorna`ok`verdadeiro para caminho existente gravável sem manifest quando`manifestPresent` é falso (linhas 88-92).                           | O fit-check pode parecer sucesso para uma pasta que ainda não é host. O `link` bloqueia sem manifest, mas a UI/diagnóstico fica otimista demais.                                                                                                                                                 | Usuário escolhe pasta vazia; fit-check mostra ok/sucesso; depois link falha ou o usuário entende que já está governando. | Trocar `ok` por estados explícitos: `ready-to-link`, `ready-to-scaffold`, `blocked`, `warning`. Para host existente, `ok` de link deve exigir `host.yml` + `events/events.jsonl`. |
| R1-TEST-07   |  P1 | A suíte Playwright tem uma jornada só: signup -> workspace -> onboarding parcial -> Home com card de continuar (test/journeys/onboarding-journey.spec.ts linhas 1-43).                                                                                                                                            | A cobertura não falsifica as partes novas de R1: membership, role assignment, host scaffold, source scan, assistant config, integration backlog e completion gate.                                             | Regressões em `role.assign`, host sem manifest, cloud assistant sem aprovação, ou onboarding finished sem host não seriam pegas pelo e2e atual.                                                                                    | Adicionar jornadas mínimas: `invite accept -> membership`, `role proposed -> subject accepts`, `onboarding cannot finish without host`, `host scaffold creates manifest`, `assistant cloud blocked without approval`, `source scan marks trust`.                                                 |
| R1-TS-08     |  P2 | `acme-governance-next-app` não tem script `typecheck`; `npx tsc --noEmit` falha se `.next/types/**/*.ts` referencia arquivos gerados que não existem. O build oficial passa porque o Next gera tipos durante `next build`.                                                                                        | O caminho de desenvolvimento é frágil e confuso. Isso vai gerar falso negativo para qualquer pessoa tentando validar TS sem rodar build completo.                                                              | Dev roda `npx tsc --noEmit` e recebe dezenas de `TS6053` em `.next/types`; conclui que a migração TS quebrou, embora `check-governance-app` passe.                                                                                 | Adicionar script explícito: `typecheck: "next build --webpack"` ou `typecheck: "next typegen && tsc --noEmit"` se disponível. Alternativamente remover `.next/types/**/*.ts` do include e documentar o check oficial.                                                                            |
| R1-SCAN-09   |  P2 | `scanLocalSource()` usa `statSync` recursivo e segue diretórios sem controle de symlink/inode (source-scan.ts linhas 57-77). Há limite de 2000 arquivos, mas symlink para ancestral pode causar loop/erro dependente do FS.                                                                                       | Robustez local ainda é fraca para fontes arbitrárias. Não é um bypass de governança, mas pode travar ou falhar mal em pastas reais.                                                                            | Usuário aponta para pasta com junction/symlink recursivo em Windows; scan demora, repete árvore ou retorna erro pouco explicável.                                                                                                  | Usar `lstatSync`, ignorar symlink por default, registrar `skippedSymlinkCount`, e manter erro honesto quando precisar seguir link explicitamente.                                                                                                                                                |

## 4. Evidência do exploit de self-assigned authority

Teste local com `applyShellCommand()`:

```json
{
  "assignment": {
    "id": "role-1",
    "subject": {
      "kind": "person",
      "id": "person-bruna"
    },
    "roleId": "security-owner",
    "assignedBy": "principal-a",
    "assignedAt": "2026-07-04T00:00:00Z",
    "status": "self-assigned",
    "proposedAt": "2026-07-04T00:00:00Z"
  },
  "authority": [
    {
      "personId": "person-bruna",
      "roleId": "security-owner",
      "origin": "self-assigned",
      "assignmentId": "role-1"
    }
  ]
}
```

O ponto não é que `security-owner` exista. O ponto é que o servidor aceitou `actorPersonId` vindo do payload como prova de self-assignment. Isso viola a decisão de que authority efetiva vem de membership, role assignment válido e policy, não de texto fornecido pelo cliente.

## 5. O que está forte

- O backend TypeScript existe e tem domínio compartilhado em `backend/src/domain`.
- A mock API não é apenas CRUD: usa o mesmo reducer do domínio.
- `GOVERNANCE_DATA_SOURCE=mock-api` é bloqueado em produção por `data-source.ts`.
- Backend e mock API passam typecheck.
- `check-governance-app.mjs` passa e faz build real do Next.
- A primeira jornada Playwright passa.
- `work-source.add` via aplicação grava `sourceTrust: "declared"`; a confiança maior vem do scan, não do body público.
- O reset CLI da mock API reescreve `.data/db.json` diretamente, então corrupção do DB é recuperável via comando local.

## 6. O que isso significa para o próximo passo

Eu não seguiria agora para "mais telas". A UI já está expondo conceitos que o backend não governa com dente suficiente. O próximo incremento deveria ser R1.1:

1. **Authorization kernel do shell local**
   - `principal -> person` binding.
   - `authorizeLocalAction()` por ação.
   - policy por `governance-profile` e `workspace-mode`.
   - fixtures negativas para não-admin.

2. **Membership real**
   - convite tokenizado sem exigir workspace session.
   - aceite cria `PrincipalMembership` e vincula `personId`.
   - convite revogado/expirado não cria acesso.

3. **Completion gate do onboarding**
   - `finished` só se `canCompleteOnboarding()` passar.
   - host ou sandbox explícito obrigatório.
   - warnings críticos não podem sumir como texto.

4. **E2E mínimo de fluxo real**
   - shared workspace com convite e papel aceito.
   - host scaffold/link.
   - bloqueio de finalização sem host.
   - assistant local/cloud com egress correto.

Depois disso, faz sentido voltar para UX: tela de pessoas, papéis, host, fontes, assistente e integrações. Antes disso, a interface vai parecer funcional sem ter contrato suficiente por baixo.

## 7. Prompt sugerido para a próxima implementação

```text
Implementar R1.1 do governance-demo: authorization + membership binding + onboarding completion gate.

Leia primeiro:
- governance-demo/APP-DECISIONS.md QRD-08, QRD-10, QRD-11, QRD-19, QRD-23
- governance-demo/APP-FUNCTIONAL-SPEC.md seções 7.5, 7.6, 9.2 e 15
- _reviews/2026-07-04-r0-r1-backend-frontend-audit.md

Objetivo:
Fechar os findings R1-AUTH-01, R1-AUTH-02, R1-MEMBER-03, R1-ONB-04 e R1-AUTH-05.

Regras:
- Não adicionar campos cerimoniais.
- Não confiar em actorPersonId/body para authority.
- Toda ação sensível precisa passar por resolver fail-closed.
- Membership, role assignment e authority continuam separados.
- Mock API e backend real devem usar o mesmo reducer/policy.
- Adicionar fixtures/e2e negativos antes de declarar pronto.

Entregar:
1. Binding principal -> person.
2. Invite accept público/tokenizado que cria PrincipalMembership.
3. authorizeLocalAction() por ação sensível.
4. role.assign/accept/reject/revoke com subject-only e role-manager policy.
5. canCompleteOnboarding() exigindo host scaffolded/linked ou sandbox explícito.
6. Tests: não-admin bloqueado; self-assignment spoof bloqueado; convite externo aceita; onboarding sem host não finaliza; host/sandbox finaliza.
7. Atualizar docs somente onde o comportamento mudou.
```
