# Falsificação — `confirmOrAbort` (confirm-in-run): a extração mínima NÃO se justifica

> Auditoria adversarial (a pedido) sobre a **única** extração candidata do padrão
> `plan → render → confirm → execute`. Veredito: **falsificada e revertida**.
> Encerra o thread `confirm-in-run` como **"sem abstração — inline é o correto"**.
> Data: 2026-06-06.

---

## 1. Contexto

Os 3 fluxos transacionais — `release-prep` (`src/cli/release-prep.ts`),
`open-integration-pr` e `merge-stack` (`src/cli/workflow.ts`) — compartilham o
idioma `plan → render → confirm → execute`. O **orquestrador completo**
(`runTransactional`) já fora rejeitado como over-modeling. Restava testar
empiricamente a extração **mínima**: só o portão de confirmação (`confirmOrAbort`).
Foi implementada, validada (941 testes verdes) e **depois submetida a auditoria
adversarial** com o objetivo explícito de falsificá-la.

## 2. Auditoria — 7 falsificadores

| #   | Pergunta                                     | Resultado                                                                                                                                                         |
| --- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 4º fluxo transacional?                       | **Não** — exatamente 3 `prompts.confirm` em `src/` (população fechada). A camada `.mjs` confirma via outro mecanismo (`promptUser`), fora de alcance e de idioma. |
| 2   | Semântica divergente a proteger?             | **Não** — zero `default:true`, zero outro `confirm`, zero `select`-como-gate.                                                                                     |
| 3   | Conhecimento de domínio no helper?           | **Não** — infra estrita (`Prompts` + `Logger` + 2 strings). _(único item favorável)_                                                                              |
| 4   | Re-inlinando, perde-se garantia além de DRY? | **NÃO** — decisivo (§3).                                                                                                                                          |
| 5   | Reduz risco operacional?                     | **Não** — só repetição textual.                                                                                                                                   |
| 6   | Abstraction magnet?                          | **Risco moderado** — é a semente do `runTransactional` proibido.                                                                                                  |
| 7   | Justificável com 2 sites?                    | **Não** — com 3 fica _no limiar_ da regra-de-três, não acima.                                                                                                     |

## 3. O falsificador decisivo

O argumento forte da extração era "single-source do invariante de segurança
_deny-by-default_". Mas esse invariante **já é single-sourced no port**:

```ts
// src/infrastructure/io/InquirerPrompts.ts — confirm()
default: options.default ?? false
```

O port coage `undefined → false`. Logo o `default:false` nos call sites é
**redundante com o contrato do port**, e um helper de call-site **não adiciona
garantia alguma** — o invariante já mora um nível abaixo. Re-inlinar os 3 sites
**não perde nada arquitetural**: o port continua impondo o default seguro.

Sem a garantia de segurança, o que sobra é DRY textual de um idioma trivial
(`confirm + log + return`), **sem ganho de LOC** (o helper + args explícitos +
teste aumentam o total), no limiar da regra-de-três, com risco de magnet.

## 4. Veredito

**Extração revertida.** Os 3 sites permanecem inline. O **deny-by-default vive no
port `Prompts.confirm`** — esse é o single-source correto; replicá-lo num helper de
call-site é **preferência estética, não necessidade arquitetural**.

`confirm-in-run` encerra como **"sem abstração"**: nem `runTransactional`
(over-modeling), nem `confirmOrAbort` (redundante com o port).

## 5. Lente reusável

> Antes de extrair um helper de confirm/guard, verificar se o invariante já está
> single-sourced no **port/adapter**. Se está (`default ?? false`), um helper de
> call-site não adiciona garantia — só DRY textual.

Irmã da taxonomia de superfícies de enforcement (`PIT-0008` / `2026-06-05-enforcement-surfaces.md`):
ali a pergunta era _"qual a superfície correta do constraint?"_; aqui é _"onde já
mora o invariante?"_ — e a resposta (o port) torna o call-site supérfluo.

## 6. Cross-refs

- Código auditado: `src/cli/release-prep.ts` (l.114), `src/cli/workflow.ts`
  (`runOpenIntegrationPRWizard`, `runMergeStackWizard`),
  `src/infrastructure/io/InquirerPrompts.ts` (l.38, o single-source real).
- Encerra o thread `confirm-in-run`: checkpoint `2026-06-05-checkpoint-pr35-visual-governance.md` §6a + `2026-06-06-checkpoint-merge-prematuro-encerramento.md` §7.
