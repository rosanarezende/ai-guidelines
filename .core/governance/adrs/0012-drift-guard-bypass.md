# ADR 0012 — Bypass Auditável de Contratos de CI via Diretivas Declarativas In-Code

**Status:** Aceita
**Data:** 2026-05-11
**Origem histórica:** Spec 0021 (`governance-information-architecture`)
**Pesquisa de suporte:** `.specify/specs/researchs/governance/2026-05-11-living-docs-and-template-composition-practices.md`

---

## Princípio

> **Todo contrato de CI que pode bloquear merge legítimo (drift guard, boundary lock, smoke test, schema check) precisa oferecer mecanismo de bypass que seja declarativo, in-code, próximo à infração, com prazo de expiração obrigatório e referência rastreável a uma decisão.** Sem isso, o contrato vira fricção e é desligado clandestinamente; com isso, o bypass é parte do contrato — visível, auditável, expirável.

## Contexto

Contratos de CI protegem invariantes que o time considera importantes. Quando o contrato é correto e o estado do código está em conformidade, o CI passa silenciosamente — esse é o caso comum. O caso interessante é o **incomum**: um fix de produção urgente, um experimento que precisa rodar antes de ter cobertura, uma alteração que viola temporariamente uma invariante por motivo conhecido e aceito.

Sistemas sem bypass legítimo geram bypass clandestino:

- branch protection é desligada "só desta vez";
- skip de CI via commit message;
- force-push para contornar gate;
- contrato é gradualmente esvaziado até virar suggestion.

Sistemas com bypass mal desenhado geram outras patologias:

- bypass via arquivo externo (`.allowlist`, `.ci-overrides`) → invisível no PR review, vira lixeira;
- bypass via variável de ambiente → invisível no Git, não-auditável;
- bypass sem expiração → vira tecnical debt invisível, acumula;
- bypass sem referência → ninguém sabe **por que** foi feito.

O princípio correto é bypass **declarativo, próximo à infração, no commit, expirável, com referência**. O bypass se torna evento de primeira classe — não exceção. Ele aparece no PR diff, é revisado como código, expira por construção, e remete a uma decisão explícita (ADR, incidente, spec) que o justifica.

## Decisão

1. **Sintaxe canônica única.** Toda diretiva de bypass usa o formato:

   ```
   // <guard-id>:allow-drift until=YYYY-MM-DD ref=ID_DA_DECISAO reason="texto curto"
   ```

   Onde:
   - `<guard-id>` identifica o contrato sendo bypassado (`living-docs`, `boundary-lock`, `schema-check`, etc.).
   - `until` é data ISO-8601 futura.
   - `ref` é identificador rastreável (`DEC-XXXX-YY`, `INC-YYYYMMDD-N`, `SPEC-XXXX`, ADR id).
   - `reason` é string entre aspas duplas, mínimo 8 caracteres significativos.

2. **Campos obrigatórios.** Falta de qualquer campo gera erro fatal com código estável (`<GUARD>_BYPASS_MALFORMED`) e mensagem listando os campos exigidos. Não há campo opcional — a tentação de "esquecer o `reason`" se transforma em hábito.

3. **Expiração obrigatória.** Data no passado gera erro fatal (`<GUARD>_BYPASS_EXPIRED`) com mensagem indicando data e referência. **Não há extensão automática.** Renovar exige commit deliberado que atualize `until` (e idealmente também `ref` e `reason`).

4. **Localização próxima à infração.** A diretiva é **comentário de linha** imediatamente antes do trecho que viola o contrato (teste com regra deprecated, import cross-boundary autorizado, schema field obsoleto). Diretiva em outro contexto é ignorada com warning, **nunca silencia o contrato** — silenciar exige posicionamento correto.

5. **Bypass aparece no artefato a jusante.** Se o contrato gera artefato (registry, projeção, manifest), o item bypassado aparece como entrada de primeira classe, com bloco `bypass: { until, ref, reason }` legível. Não é supressão — é **drift autorizado e registrado**.

6. **Sem bypass em massa.** Uma diretiva afeta **um** trecho próximo. Bypass de N regras exige N diretivas. Isso impede que uma flag global silencie um contrato inteiro.

7. **Sem mecanismo paralelo.** Não há `--ignore-drift` na CLI, não há env var, não há arquivo `.allowlist`. A diretiva in-code é o **único** caminho legítimo. Tentativas de bypass por outros meios não são reconhecidas (e portanto o CI permanece falhando).

## Aplicações

### Aplicação inicial — Living Documentation drift guard

O `LivingDocumentation` (PR3) regenera o artefato `living-docs.yml` a partir do AST de testes; o CI compara com a versão commitada e falha em divergência. Quando uma regra é renomeada, descontinuada, ou está em transição (incidente pediu remoção mas a nova spec ainda não foi escrita), a diretiva é:

```ts
// living-docs:allow-drift until=2026-06-15 ref=INC-20260511-3 reason="regra revisada após incidente; aguarda nova spec"
it.skip('[BR-CLI-XYZ] descrição', () => { ... });
```

O item passa a aparecer no artefato com `coverageState: deprecated` e bloco `bypass`.

### Aplicações previstas (próximas e futuras)

- **Boundary lock** (`Boundaries.test.ts`): quando uma importação cross-layer for autorizada temporariamente (ex.: spike validando viabilidade), a diretiva `// boundary-lock:allow-drift ...` é reconhecida pelo enforcement.
- **Schema check do registry YAML**: campo deprecated mas ainda presente em entradas legadas pode ser tolerado via `// schema-check:allow-drift ...` no fixture.
- **Reserved dirs contract**: alteração temporária no conjunto `RESERVED_GOVERNANCE_DIRS` durante migração pode ser autorizada in-code.

Cada novo guard que adotar bypass usa **a mesma sintaxe** — não inventa variante própria.

## Alternativas avaliadas e rejeitadas

| Opção                                                 | Por que rejeitada                                                                                          |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Arquivo externo `.allowlist.yml` (lista centralizada) | Perde visibilidade no PR review; vira lixeira; bypass sobrevive renomeação/movimentação do código original |
| Variável de ambiente (`SKIP_LIVING_DOCS=1`)           | Invisível no Git; não-auditável; trivial de adicionar em CI runner                                         |
| Skip via commit message (`[skip-living-docs]`)        | Não persiste; uma vez merged, o motivo some                                                                |
| Decorator/macro (`@AllowDrift(...)`)                  | Não disponível em todo contexto (testes, fixtures, schemas); acopla a sintaxe da linguagem                 |
| Branch protection desligada manualmente               | Não é bypass — é desligamento; perde proteção para o resto do PR                                           |
| Sem expiração (`reason="permanent"`)                  | Vira tecnical debt invisível; bypass acumula sem revisão                                                   |

## Consequências

### Positivas

- **Operacional:** fixes urgentes não ficam reféns do CI. Há caminho legítimo, rápido, auditável.
- **Cultural:** bypass é fricção controlada (3 campos obrigatórios + prazo) — desincentiva uso casual.
- **Auditoria embutida:** owner (autor do commit), motivo, prazo e referência ficam visíveis no PR review e no Git blame.
- **Auto-expiração:** bypass vencido falha CI. Não acumula débito invisível.
- **Padrão único atravessa guards:** quem aprendeu o formato para um guard sabe usar em qualquer outro.

### Negativas / Riscos

- **Verbosidade.** Comentário de 1 linha com 3 campos parece pesado em casos simples. Aceito como custo da auditabilidade.
- **Complexidade do parser.** Cada guard precisa reconhecer a diretiva. Mitigação: módulo compartilhado em domain valida a sintaxe; cada guard só decide se aplica.
- **Datas malformadas.** Humanos erram datas. Mitigação: erro estável e claro nomeando o formato esperado.
- **Tentação de prazos longos.** `until=2099-12-31` derrota a expiração. Mitigação editorial: PR review questiona prazos > 90 dias; sem regra técnica para limitar, é convenção cultural.

## Nota histórica

A sintaxe canônica (`<guard-id>:allow-drift until=… ref=… reason=…`) foi cravada durante revisão da Spec 0021 pela owner, com requisito explícito de "erro fatal em data expirada ou campo ausente". A primeira aplicação concreta é o Living Documentation drift guard no PR3; ADR 0012 generaliza para qualquer guard futuro do framework.
