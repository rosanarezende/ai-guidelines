# Pesquisa A.7 — Benchmarks OSS public-ready (2025–2026)

## 1. LICENSE choices

### Observado em benchmarks de AI/dev-tooling

- `cline/cline`: Apache-2.0  
  https://github.com/cline/cline/blob/main/LICENSE
- `continuedev/continue`: Apache-2.0  
  https://github.com/continuedev/continue/blob/main/LICENSE
- `github/spec-kit`: MIT  
  https://github.com/github/spec-kit/blob/main/LICENSE
- `multica-ai/multica`: Apache-2.0 com cláusulas adicionais restritivas  
  https://github.com/multica-ai/multica/blob/main/LICENSE

### Trade-offs

- **MIT**: máxima simplicidade e adoção.
- **Apache-2.0**: mais proteção (inclui patente) com boa adoção em tooling.
- **BSL / Elastic-2.0**: úteis para “source-available”, mas não ideais se o objetivo for percepção clara de OSS permissivo.  
  https://mariadb.com/bsl-faq-adopting/  
  https://www.elastic.co/licensing/elastic-license

## 2. `CONTRIBUTING.md` patterns

Padrões recorrentes nos benchmarks:

- onboarding + setup local detalhado;
- regras de escopo de PR;
- exigência de testes/docs;
- explicitação de workflow de revisão;
- em alguns casos, disclosure de IA no PR.

Referências:

- Cline: https://github.com/cline/cline/blob/main/CONTRIBUTING.md
- Continue: https://github.com/continuedev/continue/blob/main/CONTRIBUTING.md
- Spec Kit: https://github.com/github/spec-kit/blob/main/CONTRIBUTING.md
- Aider: https://github.com/Aider-AI/aider/blob/main/CONTRIBUTING.md

## 3. `CODE_OF_CONDUCT.md`

Adoção de Contributor Covenant é baseline de mercado:

- Cline: https://github.com/cline/cline/blob/main/CODE_OF_CONDUCT.md
- Continue: https://github.com/continuedev/continue/blob/main/CODE_OF_CONDUCT.md
- Spec Kit: https://github.com/github/spec-kit/blob/main/CODE_OF_CONDUCT.md
- Padrão de referência: https://www.contributor-covenant.org/version/2/1/code_of_conduct/

## 4. `SECURITY.md` e disclosure

Padrões fortes:

- canal privado de reporte;
- instrução para não abrir issue pública;
- processo básico de triagem;
- uso de private vulnerability reporting no GitHub.

Referências:

- Cline SECURITY: https://github.com/cline/cline/blob/main/SECURITY.md
- Continue SECURITY: https://github.com/continuedev/continue/blob/main/SECURITY.md
- Spec Kit SECURITY: https://github.com/github/spec-kit/blob/main/SECURITY.md
- Guia GitHub PVR: https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository

## 5. Issue/PR templates

Repos maduros mantêm `.github/ISSUE_TEMPLATE/*` e template de PR com checklist:

- Cline: `bug_report.yml`, `pull_request_template.md`  
  https://github.com/cline/cline/tree/main/.github
- Continue: issue templates + PR template  
  https://github.com/continuedev/continue/tree/main/.github
- Spec Kit: múltiplos templates (bug, feature, submissions) + PR template  
  https://github.com/github/spec-kit/tree/main/.github
- Multica: bug/feature templates + PR template  
  https://github.com/multica-ai/multica/tree/main/.github

## 6. Curadoria público vs privado

Padrão de mercado: separar o que é público por default e evitar artefato operacional local no git. Em projetos com processo rigoroso, essa separação aparece como:

- documentação pública versionada;
- segredos e payloads operacionais fora do repo;
- diretrizes explícitas de segurança/reporting.

No caso do `ai-guidelines`, o próprio conjunto de regras já reforça não versionar artefatos locais (`AGENTS.md` no root).

## 7. Bilinguismo PT-BR + EN

Sinal de maturidade global: README e docs mínimas em EN, com espaço para idioma local.

Exemplos:

- Multica oferece README em EN + zh-CN (`README.md` -> `README.zh-CN.md`).
- ecossistema benchmark (Cline/Continue/Spec Kit/Aider) é majoritariamente EN.

Para um showcase BR, a melhor estratégia costuma ser:

1. README principal bilíngue (ou EN principal com link PT-BR),
2. docs estratégicas traduzidas (quickstart, contribuição, segurança),
3. demais docs podem permanecer PT-BR no início.

## Recomendação consolidada para spec 0004

**Baseline recomendado para `ai-guidelines` public-ready 2026:**

1. **Licença:** Apache-2.0 (ou MIT se priorizar máxima simplicidade).
2. **Hygiene mínima obrigatória:** `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant), `SECURITY.md` + PVR ativado, templates de issue/PR.
3. **PR template com disclosure de IA** (aprendizado útil de Spec Kit/Multica).
4. **Curadoria público/privado explícita** em docs de contribuição.
5. **Estratégia bilíngue incremental:** README e docs de entrada em EN+PT-BR, mantendo profundidade técnica em PT-BR inicialmente.
