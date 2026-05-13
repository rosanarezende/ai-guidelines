# ADR 0002 — Outcomes em Artefatos Derivados são Enums Fechados com Mensagem Determinística

**Status:** Aceita
**Data:** 2026-05-11
**Origem histórica:** Spec 0021 (`governance-information-architecture`)
**Pesquisa de suporte:** `.specify/specs/researchs/governance/2026-05-11-living-docs-and-template-composition-practices.md`

---

## Princípio

> **Quando um artefato derivado precisa expressar o estado de um item — cobertura, resolução, escopo, modo, fase — esse estado é modelado como enum fechado, com conjunto pequeno e estável, e mensagens de erro que nomeiam o conjunto permitido.** String livre, enum aberto ou "default silencioso" são rejeitados como design.

## Contexto

Estados de outcome aparecem em todo lugar onde um sistema descreve "como está esta coisa" para um consumidor a jusante: `won/lost/inconclusive` em experimentos, `pass/fail/skip` em testes, `accepted/superseded/rejected` em ADRs, `covered/pending/deprecated` em projeções de regras, `cleaned-up/kept/pending` em resoluções de experimento. Cada um desses estados se torna um **galho de ramificação** em consumidores — humanos lendo dashboards, IAs gerando relatórios, scripts gerando visões derivadas, pipelines de CI decidindo gate.

Quando o estado é modelado como **string livre**, três falhas recorrentes aparecem:

1. **Drift incremental.** "in-progress", "wip", "todo", "blocked" surgem organicamente em itens diferentes, sem definição clara, sem ordenação semântica entre eles.
2. **Consumidores complexos.** Toda ramificação precisa cobrir N casos crescentes; o ramo `else` (catch-all) silencia bugs.
3. **Mensagens de erro inúteis.** "Estado desconhecido" sem dizer quais são válidos transfere o trabalho de descoberta para quem leu o erro.

Quando o estado é modelado como **enum fechado**, o domínio expressa a invariante na própria forma do dado: o conjunto cresce só por decisão explícita (ADR de extensão), os consumidores ramificam sobre cardinalidade conhecida, e o erro nomeia o que era permitido.

O princípio se aplica a qualquer artefato gerado pelo framework para consumidores: o registry YAML, as projeções derivadas do RulesEngine, as projeções do LivingDocumentation, qualquer dashboard ou visão futura.

## Decisão

1. **Outcomes/states em artefatos derivados são enums fechados** declarados como literal unions no TypeScript:

   ```ts
   type Outcome = "covered" | "pending" | "deprecated";
   ```

   Não `string`. Não `string & { __brand: 'Outcome' }`. Não enum aberto de runtime.

2. **Mudar o conjunto exige ADR de extensão.** Adicionar ou remover valor é mudança de contrato — o consumidor a jusante depende da cardinalidade conhecida. O conjunto é tratado como API pública do artefato.

3. **Mensagens de erro listam o conjunto válido.** O código de erro é estável (não muda entre versões), a mensagem nomeia os valores permitidos:

   ```
   LIVING_DOCS_INVALID_COVERAGE_STATE: expected one of: covered, pending, deprecated; got: "in-progress"
   ```

   Quem leu o erro sabe imediatamente o que era esperado, sem consultar documentação externa.

4. **Sem fallback silencioso.** Se o produtor do artefato não consegue determinar um valor válido (input ambíguo, estado inferido falha), o artefato **falha a geração** com erro estável (`INDETERMINATE_<estado>`). **Nunca** é emitido um default não-declarado para "manter o pipeline verde".

5. **Coerência de família.** Estados que pertencem a um mesmo domínio compartilham padrões: nomes em snake-case ou kebab-case (não misturar), tom neutro (não "blocked-by-other-team"), foco no estado atual (não na causa). O glossário arquitetural (`ARCHITECTURE-REFERENCE.md` §5) registra cada enum e sua semântica.

6. **Schema versioning lida com evolução.** Quando a cardinalidade muda, `schemaVersion` é incrementado e a ADR de extensão documenta a transição. Consumidores que leem versão antiga continuam tratando o conjunto antigo; novos consumidores leem o conjunto expandido. Migração de artefatos antigos não é responsabilidade da ADR — ADR de migração separada decide.

## Aplicações

| Enum                                                                             | Domínio                                  | Status            |
| -------------------------------------------------------------------------------- | ---------------------------------------- | ----------------- |
| `WorkItemKind` (`spec\|experiment\|spike\|incident\|fix\|patch\|proposal`)       | Domain — `Work Item`                     | Em uso (PR1)      |
| `LifecycleStatus` (`backlog\|in-progress\|review\|done\|rejected`)               | Domain — ciclo de vida do Work Item      | Em uso (PR1)      |
| `ResolutionMode` (`cleaned-up\|kept\|pending`)                                   | Domain — fechamento de experimento       | Em uso (PR1)      |
| `RuleScope` (`universal\|adapter\|opt-in`)                                       | Domain — catalogação de regras           | Em uso (PR2.C)    |
| `RuleZone` (`top\|center\|base\|adapter`)                                        | Domain — projeção runtime do RulesEngine | Em uso (PR2.C)    |
| `WorkspaceState` (`pristine\|governance\|legacy\|mixed`)                         | Domain — discovery do workspace          | Em uso (PR2.A)    |
| `WorkspaceResolution` (`needs-init\|governance-ssot\|needs-adoption\|ambiguous`) | Domain — precedência                     | Em uso (PR2.A)    |
| `coverageState` (`covered\|pending\|deprecated`)                                 | LivingDocumentation — projeção de regras | **Próximo (PR3)** |

A consistência da família é a evidência de que o princípio já é editorial no projeto. ADR 0002 o torna **explícito** para que evoluções futuras (e novos consumidores) não introduzam string livre por hábito.

## Alternativas avaliadas e rejeitadas

| Opção                                | Por que rejeitada                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| String livre com validação por regex | Aceita drift; mensagens de erro inúteis ("doesn't match pattern"); não impede valores semanticamente errados que casam o regex |
| Enum aberto com fallback `unknown`   | Esconde drift; consumidores nunca recebem erro acionável; "unknown" vira lixo que se acumula                                   |
| Enum por convenção (string + lint)   | Depende de lint estar configurado em todo lugar; cross-context (humano editando YAML à mão) escapa do lint                     |
| Boolean (`isCovered: true/false`)    | Perde nuance (pending ≠ uncovered ≠ deprecated); força mais fields opcionais                                                   |
| Numeric severity (0–9)               | Ordenação implícita engana; consumidores tratam 2 e 3 como "talvez iguais"; perde nomes                                        |

## Consequências

### Positivas

- Erro de input recebe **resposta acionável** na mesma string — sem ida e volta à doc.
- Consumidores ramificam sobre cardinalidade conhecida — `switch` exaustivo no TypeScript fecha o caso pelo compilador.
- Drift detectado por construção: valor novo é PR explícito + ADR de extensão.
- Padrão único atravessa o framework — onboarding fica mais simples ("todo outcome é enum fechado, é só procurar o tipo no glossário").

### Negativas / Riscos

- **Granularidade limitada.** Estados intermediários ("in-review", "experimental", "soft-deprecated") não cabem sem ADR. Aceito como custo da estabilidade.
- **Custo de evolução.** Adicionar valor é evento auditável, não casual. Aceito — esse é o ponto.
- **Pressão por "string livre na borda".** Tentação de aceitar string e converter "no fim". Mitigação: schema guard valida na entrada, não na saída.

## Nota histórica

O princípio foi formalizado durante o sub-bloco `[3.0]` do PR3 da Spec 0021, ao decidir a forma de `coverageState` no schema do LivingDocumentation. A auditoria revelou que o projeto já praticava o princípio em 7 enums anteriores (tabela acima) sem documentação explícita; ADR 0002 consolida o que era convenção e fixa o caminho para outcomes futuros.
