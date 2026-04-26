# Pesquisa A.9 — Padrões de índice persistente de research/decisão

## 1. Resumo

Os padrões mais estáveis para memória técnica de longo prazo combinam: (a) registros imutáveis por decisão/proposta, (b) índice central de navegação, (c) metadados de status e relacionamento (supersedes/superseded-by). ADR, RFC, PEP e KEP convergem nesse desenho com variações de rigor e escala. Para `ai-guidelines`, a melhor solução é um índice git-native leve por spec, atualizado no fechamento de cada ciclo.

## 2. Padrões analisados

## 2.1 ADR indices (MADR, adr-tools, log4brains)

- **MADR** oferece templates com seções estruturadas e incentiva organização em `docs/decisions`:  
  https://github.com/adr/madr/blob/main/README.md
- **adr-tools** formaliza log de ADRs via CLI e histórico incremental:  
  https://github.com/npryce/adr-tools/blob/master/README.md
- **log4brains** adiciona timeline, busca e publicação estática para ADRs:  
  https://github.com/thomvaill/log4brains/blob/develop/README.md

Lição: ADR funciona bem quando há índice e status explícito.

## 2.2 RFC archives (Rust RFC)

Rust mantém processo formal com template padrão (`0000-template.md`) e lifecycle de decisão comunitária:

- https://github.com/rust-lang/rfcs/blob/master/README.md
- https://github.com/rust-lang/rfcs/blob/master/0000-template.md

Lição: consistência de template + indexação por arquivos facilita consulta histórica.

## 2.3 PEP index (Python)

PEPs usam metadados no cabeçalho (status, tipo, autores) e índice central gerado:

- https://github.com/python/peps/blob/main/README.rst
- https://github.com/python/peps/blob/main/peps/pep-0001.rst

Lição: metadado canônico no documento fonte permite automação de índice.

## 2.4 KEP model (Kubernetes)

Kubernetes enhancements usa template com checklists de prontidão, plano de teste, critérios de graduação e readiness:

- https://github.com/kubernetes/enhancements/blob/master/README.md
- https://github.com/kubernetes/enhancements/blob/master/keps/NNNN-kep-template/README.md

Lição: para propostas de alto impacto, checklist de release e readiness reduz drift de qualidade.

## 2.5 Research logs organizacionais (radars e knowledge hubs)

Modelos como Thoughtworks Radar priorizam cadência e curadoria pública de decisões/avaliações:

- https://www.thoughtworks.com/radar

Lição: utilidade vem mais de curadoria contínua do que de perfeição do formato.

## 2.6 Metadata formats e graph linking

Observou-se convergência em:

- frontmatter/head metadata,
- status explícito,
- links de relação entre registros,
- índice tabular para leitura humana rápida.

## 3. Síntese comparativa

| Pattern              | Strengths                           | Weaknesses                           | Fit para `ai-guidelines` |
| -------------------- | ----------------------------------- | ------------------------------------ | ------------------------ |
| ADR (MADR/adr-tools) | Leve, git-native, fácil adoção      | Sem curadoria pode virar cemitério   | **Alto**                 |
| RFC (Rust)           | Processo robusto e transparente     | Overhead alto para times pequenos    | Médio                    |
| PEP (Python)         | Metadados fortes + índice           | Mais formal que o necessário         | Alto                     |
| KEP (K8s)            | Checklists de maturidade excelentes | Muito pesado para decisões menores   | Médio                    |
| Radar-style          | Boa comunicação macro               | Menos rastreável no nível de arquivo | Médio                    |

## 4. Recomendação concreta para spec 0004

### Nome e localização

- **Arquivo índice:** `.specify/research-index.md`
- **Escopo dos registros fonte:** manter em `.specify/specs/<slug>/research/*.md` (como já está).

### Formato de entrada (recomendado)

Tabela por spec + metadados mínimos:

```md
| spec                                 | status | closed_at  | themes                                       | key_decisions                                             | links                                       |
| ------------------------------------ | ------ | ---------- | -------------------------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| 0004-ai-dev-foundations-public-ready | done   | 2026-04-20 | testing, ai-first, oss-hygiene, memory-index | LICENSE Apache-2.0; TDD baseline; AGENTS+CLAUDE templates | spec.md · plan.md · tasks.md · synthesis.md |
```

### Metadados obrigatórios

- `spec` (slug completo)
- `status` (`active|done|superseded`)
- `closed_at` (data ISO)
- `themes` (tags curtas)
- `key_decisions` (resumo curto)
- `links` (artefatos principais)
- `supersedes` / `superseded_by` (quando aplicável)

### Mecanismo de atualização

1. Atualização **manual obrigatória** no fechamento da spec (mais simples e confiável no início).
2. Check de CI leve: falhar PR que fecha spec sem atualizar `.specify/research-index.md`.
3. Evolução futura: script para validar schema e links.

### Convenção de links

- Sempre linkar para:
  - `spec.md`, `plan.md`, `tasks.md`,
  - `research/synthesis.md`,
  - ADR(s) criadas pela spec (se houver).

## 5. Riscos da recomendação

1. **Risco de desatualização manual** — mitigado por gate de CI no fechamento da spec.
2. **Risco de índice inflado** — mitigado por resumo curto + links (sem duplicar conteúdo).
3. **Risco de taxonomia inconsistente** — mitigado por vocabulário controlado de `themes`.
