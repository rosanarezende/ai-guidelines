# ADR 0005 — Separação entre Validação Semântica e Validação Estética em Artefatos Gerados

**Status:** Aceita
**Data:** 2026-05-11
**Origem histórica:** Spec 0021 (`governance-information-architecture`)
**Pesquisa de suporte:** `.specify/specs/researchs/governance/2026-05-11-living-docs-and-template-composition-practices.md`

---

## Princípio

> **Artefatos gerados pelo framework são validados quanto à semântica do seu gênero documental (estrutura, slots obrigatórios, ordem canônica, ausência de seções proibidas) — nunca quanto à formatação estética (estilo de bullet, espaçamento, capitalização, largura de linha).** Linting estético, se adotado, vive em camada separada e opcional. Confundir as duas validações degrada ambas.

## Contexto

Sistemas que geram artefatos para consumo humano e por IAs (Markdown, YAML, manifests) enfrentam pressão por dois tipos de validação muito diferentes:

1. **Validação semântica de gênero.** Um `tasks.md` de uma spec `evidence-driven` precisa ter a seção `## Harness Lock`, os sub-blocos por fase, o bloco `[PR-MGMT]`, `[DEBT-REVIEW]` e `[ARCHITECTURE]` em cada sub-bloco terminal. Uma ADR precisa ter `## Status`, `## Decisão`, `## Consequências`. A ausência de qualquer um desses **viola o contrato de informação** do gênero — o artefato não cumpre o que o consumidor espera ler ali.
2. **Validação estética de formatação.** Bullets com `-` vs `*`, número de blank lines entre seções, trailing whitespace, capitalização de heading, largura de linha, aspas curvas vs retas. Nada disso afeta o que o artefato comunica — afeta como ele se parece.

Quando as duas validações são **misturadas em uma camada**, três falhas recorrentes aparecem:

1. **Bloqueio injusto.** PR review é bloqueado por blank line ausente quando a ADR está estruturalmente perfeita; revisor humano gasta atenção em ruído.
2. **Editorial perde força.** Quem tenta consertar o artefato corre atrás de regras estéticas e perde de vista se o gênero está cumprido.
3. **Mensagens de erro inúteis.** "Missing blank line after heading" e "Missing required section: Status" recebem o mesmo peso. O acionável e o irrelevante se confundem.

A separação correta trata as duas como **camadas independentes**:

- Semântica é **parte do contrato do gênero** — declarada na receita do artefato, validada pelo template engine, bloqueia geração.
- Estética é **convenção de formatação** — declarada em ferramentas de lint (markdownlint, prettier, remark-lint), validada em camada opcional separada, não bloqueia geração.

Esse desenho permite que cada camada evolua em seu próprio ritmo, com critérios próprios, sem contaminar a outra.

## Decisão

1. **Validação semântica é responsabilidade do template engine** (ou do produtor do artefato, quando não há engine). Cobre:
   - **Headings obrigatórios** presentes por gênero.
   - **Ordem canônica** das seções — out-of-order falha.
   - **Blocos mandatórios** — ex.: `## Harness Lock` em `tasks.md` evidence-driven, `## Decisão` em ADR.
   - **Seções proibidas** — ex.: "Stage 1" não pode aparecer em artefato `direct`.
   - **Coerência declaração ↔ uso** — slot declarado em recipe sem partial correspondente falha; partial referenciado mas inexistente em disco falha.

2. **Critérios são declarativos, por gênero, não code-hardcoded.** A própria recipe (ou schema do gênero) declara seções obrigatórias, ordem, proibições. O validator é genérico e consome a especificação — adicionar gênero novo é editar dados, não código.

3. **Recipe é o contrato de validação — não objeto auxiliar.** A mesma recipe que descreve **como montar** o artefato (slots, partials, ordem) **também descreve quais invariantes** o artefato precisa cumprir. Não há recipe que só monta sem declarar requisitos, nem schema de validação separado da recipe. A unidade é uma só: editar a recipe é editar simultaneamente "o que produzir" e "o que aceitar como válido". Isso impede o anti-padrão histórico de **recipe + validator desincronizados** (recipe gera Markdown que o próprio validator rejeita).

4. **Mensagens determinísticas e auto-explicativas.** Cada falha gera código estável (`STRUCT_MISSING_HEADING`, `STRUCT_OUT_OF_ORDER`, `STRUCT_FORBIDDEN_SECTION`, `STRUCT_PARTIAL_NOT_FOUND`) e mensagem que cita `artifactKind`, slot ofensor, expectativa. Quem leu o erro sabe imediatamente o que corrigir.

5. **Validação estética fica fora do engine.** O produtor do artefato **não bloqueia** por:
   - estilo de bullet (`-` vs `*`);
   - número de blank lines entre seções;
   - presença de trailing whitespace;
   - capitalização de heading;
   - largura de linha;
   - encoding de aspas.

6. **Linting estético adotado, se necessário, em camada separada e opcional.** Pré-commit hook ou job CI dedicado (markdownlint, prettier, remark-lint) com configuração própria. Roda em paralelo ao engine, **não acoplado**. Configuração explícita vive em arquivo dedicado (`.markdownlint.yml` etc.), nunca embutida no template engine.

7. **Princípio se estende a outros artefatos.** Não é regra exclusiva de Markdown:
   - YAML do registry: valida `schema` (campos obrigatórios, tipos, enums) — não valida ordem alfabética de chaves dentro de bloco ou indentação cosmética.
   - JSON de manifests: valida shape — não valida pretty-printing.
   - Bash/shell scripts gerados: valida invariantes funcionais — não valida shellcheck-style.

## Aplicações

### Escopo v0 (PR3 da spec 0021) vs v1

A ADR define o princípio completo de validação estrutural, mas a implementação inicial focou no subconjunto de maior criticidade e menor risco de _false positives_.

- **Escopo v0 (implementado em PR3 da spec 0021):** Validação de `forbiddenHeadings` (case-sensitive literal), `slot completeness` (slots obrigatórios presentes) e `recipe↔metadata self-consistency`. A extração de headings usa regex simples e ignora código bloqueado.
- **Escopo v1 (futuro):** Erros de `STRUCT_MISSING_HEADING`, `STRUCT_OUT_OF_ORDER` e headings mandatórios por gênero. Exige bump no `schemaVersion` da Recipe para suportar schema declarativo de headings, e possivelmente um AST extractor de Markdown mais robusto que regex para capturar hierarquia.

### Aplicação inicial — Template Engine para artefatos de spec

`TemplateEngine` (PR3 da spec 0021, sub-bloco 3.E) compõe `spec.md`, `plan.md`, `tasks.md`, `decision-brief.md`, ADRs a partir de recipes + partials atômicas. Cada recipe declara:

```yaml
artifactKind: tasks
workflowType: evidence-driven
slots:
  - id: header
    required: true
    partials: [common/spec-header.md]
  - id: harness-lock
    required: true
    partials: [common/harness-lock.md]
  - id: phases
    required: true
    minOccurrences: 1
    partials: [tasks/phase-evidence.md]
  # ...
```

O validator confere a montagem contra a declaração e falha com erro estável se um slot required estiver vazio ou se aparecer slot não-declarado.

### Aplicações previstas

- **Registry YAML guard** já implementado em 2.B segue o mesmo princípio (rejeita `UNKNOWN_KIND`, `DENSE_MISSING_WORKSPACE`, `VIRTUAL_HAS_DENSE_FIELD` — semântica; ignora indentação e ordem de campos — estética).
- **ADRs futuras** geradas pelo template engine: gênero ADR exige `## Status`, `## Princípio`, `## Decisão`, `## Consequências` — semântica. Linting estético separado.
- **Manifests `package.json` / `_meta/`** gerados pela CLI: valida shape funcional, não pretty-printing.

## Alternativas avaliadas e rejeitadas

| Opção                                                | Por que rejeitada                                                                                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Validador único (semântica + estética em uma camada) | Bloqueia PR por motivo irrelevante; mensagens se confundem; difícil evoluir cada camada independentemente        |
| Sem validação semântica (só estética)                | Permite artefatos sintaticamente bonitos mas semanticamente quebrados — pior cenário, e mais difícil de detectar |
| Sem validação alguma (confiança no autor)            | Garante drift entre o que o framework promete e o que entrega                                                    |
| markdownlint como única validação                    | Regras estéticas não cobrem semântica de gênero; falha silenciosamente quando seção essencial falta              |
| Validação por LLM (prompt: "isto está correto?")     | Não-determinístico; resposta varia entre runs; não-auditável                                                     |

## Consequências

### Positivas

- **PR review foca no que importa.** Revisor humano vê erros sobre seção faltando, não sobre espaço em branco.
- **Mensagens acionáveis.** "Missing required heading: ## Stage 2 Planning" indica o que fazer; "missing blank line between sections" é ruído.
- **Composição atômica protegida.** Partial faltando ou slot vazio bloqueia geração — não chega no consumidor um Markdown silenciosamente truncado.
- **Cada camada evolui no seu ritmo.** Adoção de markdownlint é decisão independente; o engine não muda.
- **Receita é o contrato.** Mudar regras estruturais é editar a recipe (declarativo), não código do validator. Reduz acoplamento.

### Negativas / Riscos

- **Estética pode degradar** se nenhum lint for adotado em paralelo. Aceito como custo da separação; alternativas resolvem a estética sem entrelaçar com semântica.
- **Recipe authoring exige cuidado.** Quem cria recipe precisa declarar seções obrigatórias, ordem, proibições. Mais trabalho upfront — mas único, vivendo longe da implementação.
- **Validação pode parecer "fraca"** para quem espera "lint completo". Documentação editorial precisa explicar a separação.

## Nota histórica

O princípio foi explicitado durante o sub-bloco `[3.E]` do PR3 da Spec 0021, ao decidir a forma de `MarkdownStructuralValidation`. A auditoria revelou que o projeto já praticava a separação em 2.B (registry YAML guard valida schema, não formato), sem documentação canônica; ADR 0005 generaliza para qualquer artefato gerado, presente e futuro.
