# ADR 0013 — Análise Estática AST como SSOT para Artefatos Derivados de Código

**Status:** Aceita
**Data:** 2026-05-11
**Origem histórica:** Spec 0021 (`governance-information-architecture`)
**Pesquisa de suporte:** `.specify/specs/researchs/governance/2026-05-11-living-docs-and-template-composition-practices.md`

---

## Princípio

> **Artefatos derivados do código (catálogos, projeções, manifests, documentações vivas) são produzidos por análise estática sobre AST — não por instrumentação em runtime.** Determinismo e independência de execução são propriedades arquiteturais; telemetria de execução vive em camada separada, opcional e aditiva.

## Contexto

Sistemas que precisam expor "o que o código declara" a consumidores a jusante (humanos, IAs, scripts de governance, dashboards) enfrentam uma escolha técnica recorrente: ler o código **estaticamente** (parse + walk AST) ou observar o código **rodando** (instrumentação, custom reporters, hooks de runtime).

Em superfície os dois caminhos parecem equivalentes — ambos produzem o mesmo dado. Em profundidade são opostos:

- **Análise estática AST.** O artefato é função pura da árvore sintática. Mesma árvore → mesmo artefato byte-a-byte. Não exige rodar testes, não exige ambiente preparado, roda em pre-commit hook, sobrevive a troca de runner. Captura **o que está declarado** — não distingue declarado-mas-falhando de declarado-e-passando.
- **Instrumentação runtime.** O artefato depende de uma execução específica do código. Captura `lastRunStatus`, tempo de execução, side effects. Mas perde determinismo (mesma árvore + run flaky → artefato diferente), exige Jest (ou framework equivalente) rodar, e o artefato passa a ser **observação temporal**, não declaração.

Confundir as duas camadas leva a artefatos que **misturam** o que o código diz com o que aconteceu no último CI. Consumidores tratam isso como verdade absoluta e o sistema acumula contradições (uma regra é "covered" no artefato mas o teste estava falhando; ninguém sabe se acreditar no artefato ou no run history).

O caminho correto é separar:

1. **AST → SSOT** (artefato declarado: o que o código está dizendo agora).
2. **Runtime telemetry → camada aditiva** (campo opcional `lastRunStatus`, dashboard de execução, projeção temporal).

A camada 1 nasce primeiro, é fundacional, e governa contratos de CI (drift guard, schema check). A camada 2 entra quando — e se — telemetria de execução virar requisito explícito.

## Decisão

1. **Artefatos derivados de código usam AST como fonte única.** Identificadores, metadados, estados declarados, source mapping — tudo extraído por percurso da árvore sintática.

2. **Determinismo é contrato.** Mesma árvore + mesma versão do extractor + mesma versão do schema → artefato byte-a-byte idêntico. Hash do artefato em duas máquinas, dois momentos, deve coincidir.

3. **Filtro estrito por contexto sintático.** Identificadores reconhecidos só são considerados quando aparecem em **call sites estruturalmente esperados** (ex.: argumento string de `it(...)`/`test(...)` em arquivo `.test.ts`). IDs em comentários, strings de produção, fixtures, ou outros call sites são logados para debugging mas **não viram entradas** no artefato. False positive é defeito estrutural, não erro de regex.

4. **Estado declarado, não estado observado.** Quando o artefato carrega um campo de "estado" (ex.: `coverageState`), o valor é derivado da forma sintática — `it.skip(...)` produz `pending`, `it(...)` produz `covered`, ausência de teste mais diretiva de bypass produz `deprecated`. Nunca da execução.

5. **Independência de framework de teste.** O extractor não depende de Jest, Vitest, Bun test ou outro runner. Quando o framework de teste é trocado, o extractor sobrevive — adapta-se reconhecendo o novo conjunto de call sites.

6. **Telemetria de runtime é camada opcional.** Quando — e se — for útil saber `lastRunStatus` ou tempo de execução, um custom reporter (Jest reporter ou equivalente) emite **artefato separado** com schema próprio. Os dois artefatos podem ser cruzados por consumidores específicos, mas o SSOT do framework continua sendo o AST.

7. **AST instanciada serve múltiplos guards.** O mesmo TS Compiler API (ou `ts-morph` como wrapper, decisão da implementação) que produz o catálogo de regras pode produzir o grafo de boundary, o índice de exports, ou outros artefatos. Investir em AST tooling tem retorno composto.

## Aplicações

### Aplicação inicial — Rule Extractor para Living Documentation

O `RuleExtractor` (PR3) percorre `.test.ts` files, identifica `it(...)`/`test(...)` cujo argumento string contém `[BR-CLI-*]`, extrai source mapping (file + line range + describe context), e emite cada regra como entrada em `living-docs.yml`. Estado é derivado sintaticamente (skip → pending; bypass directive → deprecated; presente → covered).

### Aplicações previstas

- **Boundary enforcement** (`Boundaries.test.ts`, hoje regex sobre source). Migração para AST está documentada como débito desde a Fase 1; ADR 0013 abre o caminho — o mesmo TS Compiler API instanciada para o RuleExtractor produz também o grafo de imports.
- **Glossário cruzado com identificadores de código.** Detectar termos do `ARCHITECTURE-REFERENCE.md` §5 que não têm contraparte em tipos exportados.
- **Schema check do registry YAML** com referências a tipos do domínio (validar que `kind: spec` casa com o `WorkItemKind` exportado).
- **Catálogo de exports públicos** do pacote npm (para evitar quebra acidental de API).

### Aplicação rejeitada para a camada 1

- Instrumentação runtime para capturar **se** um teste passou. Pertence à camada 2 (telemetria), via custom reporter, com schema separado.

## Alternativas avaliadas e rejeitadas

| Opção                                                    | Por que rejeitada para a camada 1                                                                                                                                 |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Regex sobre source                                       | Frágil para casos exóticos (multi-linha, template literals, comentários); falso-negativo silencioso; já reconhecido como provisório no boundary enforcement atual |
| Custom reporter Jest como SSOT                           | Acopla artefato a um run; perde determinismo; exige Jest rodar; quebra se runner mudar                                                                            |
| Híbrido (AST extrai IDs + reporter atualiza estado)      | Mistura as camadas; consumidores não sabem qual é a verdade                                                                                                       |
| Plugin no compilador (TypeScript transformer)            | Acopla ao processo de build; mais complexo; menos portátil                                                                                                        |
| Análise por reflection em runtime (require + introspect) | Exige executar o módulo; side effects; acoplado ao loader; perde análise de testes não-exportados                                                                 |

## Consequências

### Positivas

- **Determinismo total.** Drift guard (ADR 0012) funciona sobre comparação byte-a-byte estável.
- **Velocidade.** Extractor não espera testes; roda em pre-commit hook se desejado.
- **Independência de runner.** Trocar framework de teste não quebra o artefato.
- **Investimento composto.** AST tooling instanciada serve múltiplos guards futuros.
- **Telemetria possível, não obrigatória.** Quando a dor de "lastRunStatus" aparecer, é camada aditiva, não reescrita.

### Negativas / Riscos

- **Não captura execução.** Uma regra pode ser `covered` no AST mas estar quebrada no último run. Aceito; pertence a outra camada.
- **Custo de walker.** Identificar contexto sintático correto (estamos dentro de `it`? Argumento string ou template literal?) exige cuidado. Mitigação: testes negativos cobrindo false positives conhecidos.
- **Template literals limitam expressividade.** `it(\`[BR-CLI-${var}]\`, ...)` não pode ser resolvido estaticamente. Mitigação editorial: convenção proíbe interpolação no argumento que carrega o ID estável; lint rule pode formalizar.
- **Tentação de migrar para reporter "porque seria mais fácil capturar X".** Mitigação cultural: cada novo dado que parecer pertencer ao artefato passa pelo teste "isso é declaração ou observação?".

## Nota histórica

O princípio foi consolidado durante a Spec 0021 ao escolher o caminho técnico do `RuleExtractor` (sub-bloco 3.B). A pesquisa de design comparou AST-only com custom reporter e híbridos; ADR 0013 generaliza a escolha como decisão arquitetural perene — artefatos derivados são estáticos por construção, telemetria é aditiva.
