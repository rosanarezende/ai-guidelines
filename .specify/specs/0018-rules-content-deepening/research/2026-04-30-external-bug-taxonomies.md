---
title: Taxonomias externas de bugs e defeitos (CWE, CERT, Sonar, OWASP)
spec: 0018-rules-content-deepening
bloco: B
sub-bloco: B.0
date: 2026-04-30
status: Stage 1 — research output (sem decisões cravadas)
informa:
  - "[DEC-0018-B01] Taxonomia das categorias de regras"
  - "[DEC-0018-B05] Metodologia do eval mínimo"
sources:
  - https://cwe.mitre.org/top25/
  - https://cwe.mitre.org/top25/archive/2024/2024_cwe_top25.html
  - https://cwe.mitre.org/top25/archive/2024/2024_top25_list.html
  - https://www.cisa.gov/news-events/alerts/2024/11/20/2024-cwe-top-25-most-dangerous-software-weaknesses
  - https://wiki.sei.cmu.edu/confluence/display/seccode
  - https://wiki.sei.cmu.edu/confluence/display/c
  - https://www.sei.cmu.edu/library/sei-cert-c-and-c-coding-standards/
  - https://en.wikipedia.org/wiki/CERT_Coding_Standards
  - https://docs.sonarsource.com/sonarqube-server/10.8/user-guide/rules/security-related-rules
  - https://docs.sonarsource.com/sonarqube-cloud/digging-deeper/rules
  - https://owasp.org/Top10/2021/
  - https://owasp.org/www-project-top-ten/
  - https://owasp.org/www-project-top-10-for-large-language-model-applications/
  - https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf
  - https://genai.owasp.org/llm-top-10/
  - https://genai.owasp.org/llmrisk/llm01-prompt-injection/
  - https://eslint.org/docs/latest/rules/
  - https://eslint.style/rules
---

# Taxonomias externas de bugs e defeitos (CWE, CERT, Sonar, OWASP, ESLint)

> **Stage 1 research output.** Este documento sintetiza taxonomias canônicas de
> defeitos para alimentar `[DEC-0018-B01]` (estrutura de categorias das regras
> em `quality-gates.md` / `global-rules.md`) e `[DEC-0018-B05]` (metodologia do
> eval). **Não cravam-se decisões aqui** — apenas opções estruturadas.

---

## 1. Sumário executivo

### 1.1 Achados-chave

1. **Existem ao menos cinco taxonomias canônicas amplamente aceitas** —
   CWE (MITRE), SEI CERT, SonarSource (Sonar Way), OWASP Top 10 (web),
   OWASP Top 10 for LLM Applications (GenAI Security Project) — e uma
   taxonomia "de bolso" (ESLint) que cobre o domínio de correctness/style
   em JavaScript/TypeScript.
2. **Nenhuma das cinco cobre integralmente o escopo do `ai-guidelines`**, que
   é "regras editoriais para um agente IA escrever código de produção"
   (correctness + manutenibilidade + segurança + processo + colaboração).
   Cada fonte cobre **um eixo dominante**:
   - CWE → eixo *security/correctness* baixo nível.
   - CERT → eixo *secure coding* por linguagem (C/C++/Java/Perl/Android).
   - SonarSource → eixo *quality model* multi-domínio (Reliability,
     Maintainability, Security) com tipo binário (Bug / Code Smell /
     Vulnerability / Hotspot).
   - OWASP Top 10 (web) → eixo *application security risks*.
   - OWASP Top 10 for LLM → eixo *LLM-specific risks* (relevante porque o
     consumidor do `ai-guidelines` é, ele próprio, um sistema com IA).
   - ESLint → eixo *correctness/best practices/style/ES6* em JS.
3. **Convergência num núcleo de 3-4 dimensões.** Atravessando as fontes,
   emerge um núcleo recorrente: **correctness** (o código está errado),
   **security** (o código pode ser explorado), **maintainability /
   readability** (o código está certo mas dificulta evolução),
   **style / convention** (o código está certo mas viola convenção). Sonar
   formaliza essas três primeiras como tipos; ESLint as separa em
   "categories"; CWE não tem essa dimensão (foca em security/correctness).
4. **CWE é a "moeda comum" de cross-reference.** SonarSource regras carregam
   CWE refs; CERT carrega CWE refs; OWASP Top 10 mapeia para CWE via
   "Mapped CWEs". CWE é, portanto, o **lingua franca técnica** entre as
   taxonomias — qualquer regra de `quality-gates.md` que toque
   security/correctness pode ancorar num CWE.
5. **Estrutura de uma "regra" individual converge num esqueleto comum**:
   ID + nome + descrição + (exemplo non-compliant / compliant) + risco /
   severidade + mitigação + cross-references. CWE e Sonar têm o esqueleto
   mais rico; OWASP-LLM 2025 também segue (descrição → tipos → impacto →
   mitigação → cenários de ataque → referências).
6. **Para o escopo `ai-guidelines`, a taxonomia mais aplicável é uma
   *combinação*** — não uma única fonte. As opções estruturadas estão na
   §10. A linha de força mais frequente nas fontes é a **divisão
   Sonar-style em 3-4 tipos top-level** (correctness / security /
   maintainability / [+ style ou + processo IA]) com **subcategorias por
   domínio** (e cross-ref para CWE quando aplicável).

### 1.2 Como ler este documento

- §2-§7 descrevem cada fonte (estrutura, hierarquia, campos canônicos de
  uma regra).
- §8 apresenta o mapa de cobertura cruzada por eixo.
- §9 discute aplicabilidade ao escopo do `ai-guidelines`.
- §10 elenca **opções de taxonomia** para `[DEC-0018-B01]` e
  metodologias de eval para `[DEC-0018-B05]`.
- §11 limita o escopo desta síntese.

---

## 2. CWE — Common Weakness Enumeration (MITRE)

### 2.1 Estrutura geral

CWE é uma enumeração comunitária mantida pela MITRE Corporation, com
financiamento da CISA, que cataloga **fraquezas** (weaknesses) — i.e.,
condições no código, design ou arquitetura que podem levar a
vulnerabilidades. Não é uma lista de vulnerabilidades concretas (essas
vivem no CVE); é o **catálogo de classes** de defeito.

A organização é **hierárquica e multidimensional**, com vistas (views)
diferentes:

- **Research View (CWE-1000)** — agrupa por *theoretical concept*. Tem
  ~10 categorias top-level ("Pillars"): por exemplo, Improper Access
  Control, Improper Interaction Between Multiple Correctly-Behaving
  Entities, Improper Control of a Resource Through its Lifetime, Improper
  Check or Handling of Exceptional Conditions, Improper Neutralization,
  Improper Adherence to Coding Standards, Insufficient Control Flow
  Management, Protection Mechanism Failure, Incorrect Calculation,
  Incorrect Comparison.
- **Development View (CWE-699)** — agrupa por *concept familiar to
  developers* (Audit, Authentication, Authorization, Cryptographic
  Issues, Memory Buffer Errors, etc.).
- **Architectural View (CWE-1008)** — agrupa por princípio arquitetural.
- **Top 25 View (CWE-1425 para 2024)** — vista plana ranqueada.

Existem ~900 CWEs catalogadas, com **relacionamentos**
(ChildOf / ParentOf / PeerOf / CanPrecede / CanFollow / CanAlsoBe).

### 2.2 Top 25 de 2024 (lista plana, ranqueada por frequência × severidade)

A metodologia: dataset de 31.770 CVEs publicados entre 2023-06-01 e
2024-06-01; cada CVE mapeia para uma CWE; score = frequência × severidade
CVSS médio.

| # | CWE | Nome |
| -: | :-- | :--- |
| 1 | CWE-79 | Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting') |
| 2 | CWE-787 | Out-of-bounds Write |
| 3 | CWE-89 | Improper Neutralization of Special Elements used in an SQL Command ('SQL Injection') |
| 4 | CWE-352 | Cross-Site Request Forgery (CSRF) |
| 5 | CWE-22 | Improper Limitation of a Pathname to a Restricted Directory ('Path Traversal') |
| 6 | CWE-125 | Out-of-bounds Read |
| 7 | CWE-78 | Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection') |
| 8 | CWE-416 | Use After Free |
| 9 | CWE-862 | Missing Authorization |
| 10 | CWE-434 | Unrestricted Upload of File with Dangerous Type |
| 11 | CWE-94 | Improper Control of Generation of Code ('Code Injection') |
| 12 | CWE-20 | Improper Input Validation |
| 13 | CWE-77 | Improper Neutralization of Special Elements used in a Command ('Command Injection') |
| 14 | CWE-287 | Improper Authentication |
| 15 | CWE-269 | Improper Privilege Management |
| 16 | CWE-502 | Deserialization of Untrusted Data |
| 17 | CWE-200 | Exposure of Sensitive Information to an Unauthorized Actor |
| 18 | CWE-863 | Incorrect Authorization |
| 19 | CWE-918 | Server-Side Request Forgery (SSRF) |
| 20 | CWE-119 | Improper Restriction of Operations within the Bounds of a Memory Buffer |
| 21 | CWE-476 | NULL Pointer Dereference |
| 22 | CWE-798 | Use of Hard-coded Credentials |
| 23 | CWE-190 | Integer Overflow or Wraparound |
| 24 | CWE-400 | Uncontrolled Resource Consumption |
| 25 | CWE-306 | Missing Authentication for Critical Function |

Fonte: <https://cwe.mitre.org/top25/archive/2024/2024_top25_list.html>.

Observação editorial: o Top 25 mistura *injection*, *memory safety*,
*authn/authz*, *resource exhaustion*. Não é uma taxonomia limpa por
domínio — é um *ranking de risco agregado*. Para fins de taxonomia
descritiva, a **Research View (CWE-1000)** com seus ~10 Pillars é melhor
âncora.

### 2.3 Campos canônicos de uma entrada CWE individual

Uma página CWE típica (ex.: CWE-79) tem os seguintes campos:

- **Description** — definição curta (1 frase).
- **Extended Description** — vários parágrafos detalhando o mecanismo.
- **Alternate Terms** — sinônimos.
- **Relationships** — `Nature` × `Type` × `ID` × `Name` × `View`
  (ChildOf, ParentOf, PeerOf, etc.).
- **Applicable Platforms** — Languages, Operating Systems, Architectures,
  Technologies; cada um com `Class` / `Prevalence`.
- **Background Details** — contexto técnico.
- **Modes of Introduction** — em que fase do SDLC entra (Architecture
  and Design, Implementation, Operation).
- **Common Consequences** — `Scope` × `Impact` × `Likelihood` × `Note`.
- **Likelihood of Exploit** — Low/Medium/High.
- **Demonstrative Examples** — pares de código vulnerável + corrigido.
- **Observed Examples** — referências a CVEs concretos.
- **Potential Mitigations** — lista numerada com Phase
  (Architecture/Implementation/Operation), Strategy, Description,
  Effectiveness.
- **Detection Methods** — Automated Static Analysis, Manual Analysis,
  Fuzzing, etc., com Effectiveness.
- **Memberships** — relação com Categories e Views.
- **Vulnerability Mapping Notes** — orienta como mapear CVEs novos.
- **Notes**, **Taxonomy Mappings** (PLOVER, OWASP, WASC), **References**.

Esse esqueleto é o **mais rico** entre as taxonomias estudadas e serve de
referência canônica para o que uma "regra bem documentada" deveria conter.

---

## 3. SEI CERT Coding Standards

### 3.1 Estrutura geral

Os SEI CERT Coding Standards são desenvolvidos pelo CERT Coordination
Center (Software Engineering Institute, Carnegie Mellon University). São
**standards prescritivos por linguagem**, não um catálogo descritivo
multi-linguagem como CWE.

Linguagens cobertas (Wikipedia / wiki.sei.cmu.edu):

- C
- C++
- Java
- Android (subconjunto Java)
- Perl

Existem dois tipos de items:

- **Rules (Rxx)** — violar gera defeito mensurável; obrigatórias para
  conformidade.
- **Recommendations (Rec)** — boas práticas; opcionais para conformidade.

### 3.2 Formato de identificador

```
<MNEMONIC><NN>-<LANG>
```

- `MNEMONIC` — três letras representando a categoria.
- `NN` — número 00..99.
- `LANG` — sufixo `-C`, `-CPP`, `-J`, `-PL`.

Exemplo: `PRE30-C` = "Do not create a universal character name through
concatenation" (Preprocessor, regra 30, linguagem C).

### 3.3 Categorias do CERT C (mnemonics)

Conforme listadas pelo wiki.sei.cmu.edu / blackduck.com:

| Mnemonic | Categoria |
| :-- | :-- |
| PRE | Preprocessor |
| DCL | Declarations and Initialization |
| EXP | Expressions |
| INT | Integers |
| FLP | Floating Point |
| ARR | Arrays |
| STR | Characters and Strings |
| MEM | Memory Management |
| FIO | Input Output |
| ENV | Environment |
| SIG | Signals |
| ERR | Error Handling |
| API | Application Programming Interfaces |
| CON | Concurrency |
| MSC | Miscellaneous |
| POS | POSIX |
| WIN | Microsoft Windows |

Observação: a categorização do CERT é **sintática/de subsistema da
linguagem** (preprocessor, expressões, ponteiros, I/O), não por
*efeito* (security/correctness). Isso é coerente com o público-alvo:
desenvolvedores C escrevendo código defensivo.

### 3.4 Campos canônicos de uma regra CERT

Cada regra/recomendação tem:

- **Title** com o ID.
- **Introductory paragraphs** — define a regra (a obrigação prescritiva).
- **Noncompliant Code Example(s)** — frequentemente vários, cada um
  ilustrando uma armadilha.
- **Compliant Solution(s)** — pareadas com cada noncompliant.
- **Risk Assessment** — tabela com **Severity** (Low/Medium/High),
  **Likelihood** (Unlikely/Probable/Likely), **Remediation Cost**
  (High/Medium/Low), **Priority** (P1..P27), **Level** (L1/L2/L3).
- **Automated Detection** — ferramentas que detectam (Coverity,
  GCC, Compass/ROSE, etc.).
- **Related Vulnerabilities** — CVEs reais.
- **Related Guidelines** — links cruzados com CWE, MISRA, ISO/IEC TS
  17961, MITRE CWE.
- **Bibliography** — referências.

A presença sistemática de **Risk Assessment com priority numérica** é
distintiva; nenhuma outra taxonomia formaliza assim.

---

## 4. SonarSource (SonarQube / Sonar Way)

### 4.1 Estrutura geral

SonarSource publica um catálogo de regras (rules.sonarsource.com)
classificadas por:

- **Linguagem** (Java, JavaScript, TypeScript, Python, C#, C/C++, Go,
  PHP, Ruby, Kotlin, Swift, Scala, etc.).
- **Tipo** — quatro top-level: **Bug**, **Code Smell**,
  **Vulnerability**, **Security Hotspot**.
- **Severidade** — Blocker, Critical, Major, Minor, Info.
- **Tags** — convenções, brain-overload, cwe, owasp-top10, sans-top25,
  pitfall, etc.
- **Quality Model dimension** — Reliability (Bug), Maintainability (Code
  Smell), Security (Vulnerability + Hotspot).

### 4.2 Os 4 tipos top-level (definições)

Conforme docs.sonarsource.com:

- **Bug** — "Code that is demonstrably wrong, or more likely wrong than
  not." Algo está objetivamente errado.
- **Code Smell** — "Code that is neither a bug nor a vulnerability,
  but… makes the maintainer's job harder." Maintainability.
- **Vulnerability** — "Code that could be exploited by an attacker."
  Security; **fix obrigatório** (e.g. SQL injection detectada).
- **Security Hotspot** — "Code that is security-sensitive." Requer
  **revisão humana contextual**, fix nem sempre obrigatório (e.g.
  cookie sem `HttpOnly`).

A distinção Vulnerability vs. Hotspot é a contribuição editorial mais
original do Sonar — separa o que **certamente exige correção** do que
**exige avaliação de contexto**.

### 4.3 Sub-classificação de regras de segurança

A documentação SonarQube ≥ 10.x divide regras de segurança em duas
mecânicas:

- **Security-Injection rules** — usam **taint analysis**: rastreiam
  fluxo de dados não validados de **sources** (entradas do usuário) até
  **sinks** (funções sensíveis). Tipicamente Vulnerability.
- **Security-Configuration rules** — detectam configuração insegura
  (parâmetros incorretos, validações ausentes). Mistura Vulnerability e
  Hotspot.

### 4.4 Campos de uma RSPEC (SonarSource Rule Specification)

Cada regra publicada tem (conforme rules.sonarsource.com):

- **ID** (ex.: `S2068` = hard-coded credentials).
- **Name** — frase prescritiva.
- **Description** — Why is this an issue?
- **Noncompliant Code Example**.
- **Compliant Solution**.
- **Exceptions** — quando a regra não se aplica.
- **See also** — cross-refs (CWE, OWASP, SANS, CERT).
- **Type** (Bug/Code Smell/Vulnerability/Hotspot).
- **Severity** (Blocker → Info).
- **Tags**.
- **Languages**.
- **Available since** versão.

A seção "See also" tipicamente lista CWE-XXX, OWASP Top 10 A0X, SANS Top
25 — confirmando o papel de CWE como **lingua franca técnica**.

### 4.5 Padrões de referência em Sonar

A documentação SonarQube referencia conformidade explícita com:

- OWASP Top 10
- CWE Top 25 (SANS/CWE)
- PCI DSS
- OWASP ASVS 4.0

---

## 5. OWASP Top 10 (Web)

### 5.1 OWASP Top 10:2021

Lista das 10 categorias mais críticas de risco em aplicações web,
ranqueadas por dados comunitários + Top 10 community survey.

| ID | Categoria |
| :-- | :-- |
| A01:2021 | Broken Access Control |
| A02:2021 | Cryptographic Failures (renamed from "Sensitive Data Exposure") |
| A03:2021 | Injection (now includes XSS) |
| A04:2021 | Insecure Design |
| A05:2021 | Security Misconfiguration (now includes XXE) |
| A06:2021 | Vulnerable and Outdated Components |
| A07:2021 | Identification and Authentication Failures |
| A08:2021 | Software and Data Integrity Failures (includes Insecure Deserialization) |
| A09:2021 | Security Logging and Monitoring Failures |
| A10:2021 | Server-Side Request Forgery (SSRF) |

> **Nota de fact-check**: a search engine devolveu uma variante do A07
> rotulada "Cross-Site Scripting (XSS)", mas a documentação oficial
> (owasp.org/Top10/2021) lista A07 como *Identification and
> Authentication Failures* — e XSS foi consolidado dentro de A03
> Injection. Tomamos a versão oficial.

### 5.2 OWASP Top 10:2025 (em desenvolvimento)

Há indicação de uma versão 2025 em desenvolvimento (`owasp.org/Top10/2025/`
publicou "A05_2025-Injection"), mas o release final ainda não estava
estabilizado no momento desta pesquisa. **Não cravar** referências a
Top 10:2025 sem confirmação oficial.

### 5.3 Estrutura de uma entrada OWASP Top 10

Cada A0X tem páginas com:

- **Factors** — incidência, exploitability, detectability, impact,
  CWEs relacionados, max CVSS.
- **Overview / Description**.
- **How to Prevent**.
- **Example Attack Scenarios**.
- **References** — links para Cheat Sheets, CWEs, NIST.
- **List of Mapped CWEs** — explícita.

### 5.4 Critério de classificação

OWASP Top 10 (web) é organizada por **risco agregado em apps web**,
não por mecanismo técnico. Categorias mesclam falhas de design,
implementação e operação. Por isso, **uma única falha pode pertencer a
mais de uma categoria** (e.g. autenticação fraca pode ser A04 design ou
A07 implementação dependendo da causa raiz).

---

## 6. OWASP Top 10 for LLM Applications (GenAI Security Project)

### 6.1 Estrutura geral

Mantido pelo **OWASP GenAI Security Project**. A versão corrente é
**v2.0 / 2025**, publicada 2024-11-18 (PDF
`OWASP-Top-10-for-LLMs-v2025.pdf`). É a taxonomia mais relevante para
contextos de **agente IA escrevendo código**, embora seu foco primário
seja *aplicações que integram LLM* (não "código gerado por LLM" em si).

### 6.2 Lista 2025 completa

| ID | Categoria | Resumo |
| :-- | :-- | :-- |
| LLM01:2025 | Prompt Injection | Instruções maliciosas (diretas via input ou indiretas via documentos retornados, tool outputs, web pages) sobrescrevem o comportamento pretendido do LLM. |
| LLM02:2025 | Sensitive Information Disclosure | Exposição não intencional de dados privados, credenciais, API keys ou informação confidencial nas saídas do LLM. |
| LLM03:2025 | Supply Chain | Vulnerabilidades em modelos de terceiros, datasets pré-treinados, plugins, extensões. |
| LLM04:2025 | Data and Model Poisoning | Manipulação de dados de treino/fine-tuning/embeddings. |
| LLM05:2025 | Improper Output Handling | Plugins ou consumidores aceitam output do LLM sem sanitização → XSS, RCE em backend. |
| LLM06:2025 | Excessive Agency | Conceder ao LLM autonomia/ferramentas/permissões em excesso. |
| LLM07:2025 | System Prompt Leakage | Exposição de prompts de sistema com instruções/credenciais sensíveis (novo em 2025). |
| LLM08:2025 | Vector and Embedding Weaknesses | Vulnerabilidades em sistemas RAG e bancos vetoriais (novo em 2025). |
| LLM09:2025 | Misinformation | Saídas factualmente erradas / hallucinations geram dependência incorreta. |
| LLM10:2025 | Unbounded Consumption | Uso excessivo de recursos (DoS, exfiltração financeira, replicação não autorizada do modelo). |

### 6.3 Estrutura/campos de uma entrada LLM0X

Conforme genai.owasp.org/llmrisk/llm01-prompt-injection (LLM01 como
referência):

- **Definition** — descrição concisa (1 parágrafo).
- **Types of Vulnerability** — sub-classificação (LLM01: direct vs
  indirect).
- **Impact / Outcomes** — consequências possíveis.
- **Prevention and Mitigation Strategies** — lista numerada acionável
  (LLM01 lista 7).
- **Example Attack Scenarios** — cenários narrativos (LLM01 lista 9).
- **Reference Links** — academia, MITRE ATLAS, NIST AI RMF.

### 6.4 Critério de classificação

Como o OWASP Top 10 web, é por **risco agregado em apps LLM** — mistura
design (Excessive Agency), implementação (Improper Output Handling),
operação (Supply Chain), e dados (Poisoning). É **descritiva**, não
prescritiva: descreve riscos, não impõe regras de codificação.

### 6.5 Relevância para `ai-guidelines`

O `ai-guidelines` produz **regras editoriais para um agente IA escrever
código**. Há duas leituras possíveis:

1. **Aplicar OWASP-LLM ao consumidor** — projetos que adotam o framework
   e que **embutem LLMs** devem ter regras inspiradas em OWASP-LLM
   (input sanitization de prompts, output handling, etc.). Essa é a
   leitura óbvia.
2. **Aplicar OWASP-LLM ao próprio framework** — o `ai-guidelines` é
   *consumido por agentes IA*; regras como "não vazar system prompts" ou
   "não conceder excessive agency a si mesmo" podem refletir como o
   agente deve se comportar enquanto escreve código. Essa é uma leitura
   mais sutil, e pode justificar uma sub-categoria "regras de
   colaboração com IA" que já existe parcialmente em `global-rules.md`.

---

## 7. ESLint — taxonomia por propósito

### 7.1 Categorias históricas

ESLint historicamente organizou suas regras (até o redesenho de
docs em ~v8) em sete categorias:

| Categoria | Propósito |
| :-- | :-- |
| Possible Errors | Apanha erros prováveis em código (ex.: `no-undef`, `no-extra-semi`, `no-unreachable`). |
| Best Practices | Práticas que evitam bugs e facilitam manutenção (ex.: `eqeqeq`, `curly`, `no-eval`). |
| Strict Mode | Uso correto de `"use strict"`. |
| Variables | Boas práticas de declaração e escopo (ex.: `no-unused-vars`, `no-shadow`). |
| Node.js and CommonJS | Idiomas do Node (ex.: `no-process-exit`). |
| Stylistic Issues | Formatação, naming, sintaxe equivalente (ex.: `camelcase`, `quotes`, `indent`). |
| ECMAScript 6 | Idiomas ES6+ (ex.: `no-var`, `prefer-const`, `arrow-spacing`). |

A partir do `@stylistic/eslint-plugin` (eslint.style), ESLint
**desacoplou** as regras puramente estilísticas — Prettier
e dprint cobrem isso melhor. As demais categorias seguem.

### 7.2 Critério de classificação

ESLint classifica por **propósito da regra**:

- *Detecta um bug provável*?  → Possible Errors.
- *Evita um bug futuro / facilita manutenção*?  → Best Practices.
- *Cuida de naming/formatting sem alterar runtime*?  → Stylistic.
- *Idioma específico de uma versão da linguagem*?  → ECMAScript 6.

Não há eixo de **severity** intrínseco — quem configura o `eslint.config`
escolhe `error` / `warn` / `off` por regra.

### 7.3 Campos de uma regra ESLint

- **Rule ID** (ex.: `no-unused-vars`).
- **Description**.
- **Examples of incorrect code** (com o trecho exato).
- **Examples of correct code**.
- **Options** — configuração da regra.
- **When Not To Use It**.
- **Related Rules**.
- **Compatibility** (e.g., compatível com JSHint).
- **Version** desde quando existe.
- **Resources** (source, tests, docs).

---

## 8. Mapa de cobertura cruzada

Tabela: **eixo de defeito × fontes que cobrem**.

| Eixo / domínio | CWE | CERT | Sonar | OWASP Top 10 (web) | OWASP Top 10 LLM | ESLint |
| :-- | :--: | :--: | :--: | :--: | :--: | :--: |
| **Security — injection** | Sim (CWE-79, 89, 78, 94, 77) | Sim (várias FIO/STR/EXP) | Sim (Vulnerability) | Sim (A03) | Sim (LLM01, LLM05) | Parcial (`no-eval`) |
| **Security — auth/authz** | Sim (CWE-287, 862, 863, 269, 306) | Parcial | Sim (Vulnerability/Hotspot) | Sim (A01, A07) | Indireto | Não |
| **Security — crypto** | Sim (CWE-327, 798) | Sim (MSC para C) | Sim (Vulnerability) | Sim (A02) | Não | Não |
| **Security — config / supply chain** | Sim (CWE-1188 família) | Não | Sim (Hotspot) | Sim (A05, A06, A08) | Sim (LLM03) | Não |
| **Security — LLM-specific** | Não (CWE ainda incipiente em LLM) | Não | Não (parcial em rules recentes) | Não | **Sim** (todo o catálogo) | Não |
| **Memory safety** | Sim (CWE-787, 125, 416, 119, 476, 190) | Sim (MEM, ARR, INT, FLP) | Sim (Bug em C++) | Não | Não | Não |
| **Correctness — logic / control flow** | Parcial (CWE-665, 754) | Sim (EXP, INT, ERR) | Sim (Bug) | Não | Não | Sim (Possible Errors) |
| **Correctness — error handling** | Parcial (CWE-754, 755) | Sim (ERR) | Sim (Bug + Code Smell) | Indireto (A09) | Não | Sim (Best Practices) |
| **Maintainability — complexity / smells** | Não | Parcial (Recommendations) | **Sim** (Code Smell) | Não | Não | Sim (Best Practices) |
| **Maintainability — readability / style** | Não | Não | Sim (Code Smell minor) | Não | Não | **Sim** (Stylistic) |
| **Resource exhaustion / DoS** | Sim (CWE-400) | Sim (CON, MEM) | Sim (Bug/Hotspot) | Indireto | Sim (LLM10) | Não |
| **Logging / observability** | Sim (CWE-117, 778) | Não | Sim (Code Smell) | Sim (A09) | Não | Não |
| **Process / collaboration / IA editorial** | Não | Não | Não | Não | Parcial (LLM06 Excessive Agency) | Não |

**Leituras-chave da tabela**:

- **CWE** é o catálogo mais largo em segurança/correctness mas **não cobre
  maintainability/style/processo**.
- **Sonar** é o **único** que cobre os 4 eixos clássicos
  (correctness/security/maintainability/style) num modelo coeso.
- **OWASP-LLM** é o **único** que cobre LLM-specific.
- **ESLint** é o **único** que cobre correctness/style num modelo
  acessível para regras de pequena granularidade.
- **Nenhuma fonte** cobre o eixo "processo / colaboração com IA" — que é
  parte do escopo declarado de `global-rules.md`.

---

## 9. Aplicabilidade ao escopo do `ai-guidelines`

### 9.1 O que o `ai-guidelines` é (recap)

- Framework de **regras editoriais** que um agente IA recebe via
  `AGENTS.md` para **escrever código melhor**.
- Núcleo (`.core/rules/global-rules.md`) é **universal** (princípios
  agnósticos de stack/processo).
- Opt-in (`.core/rules/opt-in/`) cobre quality-gates, TDD, BDD —
  dependentes de stack/processo.

O escopo cobre, no mínimo:

- **Correctness universal** (validação de input, error handling,
  fail-fast, type-guards).
- **Security básica** (não logar secrets, não usar `eval`, etc.).
- **Maintainability** (concorrência explícita, evitar funções enormes,
  etc.).
- **Engenharia editorial / processo IA** (idioma PT-BR, cadeia de
  commit, BDD test naming, etc.).
- **Quality gates** (cobertura ≥ 85%, mutation kill ≥ 60%).

### 9.2 Quais taxonomias se mapeiam

| Eixo do `ai-guidelines` | Taxonomia(s) que melhor mapeia |
| :-- | :-- |
| Correctness universal | ESLint Possible Errors + CERT EXP/ERR + Sonar Bug |
| Security básica | CWE Top 25 (subset) + OWASP Top 10 web (subset) |
| Maintainability | Sonar Code Smell + ESLint Best Practices |
| Style / convention | Sonar Code Smell minor + ESLint Stylistic (mas **delegado** a Prettier no framework) |
| LLM/IA-specific | OWASP Top 10 for LLM (LLM01, 02, 05, 06 são os mais aderentes) |
| Processo / colaboração | **Nenhuma fonte externa cobre** — é contribuição original do framework |

### 9.3 Quais taxonomias *não* se mapeiam

- **CERT integralmente** — é por linguagem (C/C++/Java); o framework é
  **multi-linguagem por design**. Mas o **formato de "Risk Assessment"**
  (Severity × Likelihood × Cost × Priority) é portável.
- **CWE granular individual** — usar 900 CWEs é overkill. Mas usar
  **CWE como cross-ref** ("ver CWE-79") é portável e barato.
- **OWASP Top 10 web na íntegra** — muitas categorias (A05 misconfig,
  A06 outdated components) são *operacionais*, não editoriais.

### 9.4 Eixo "processo / IA editorial" como contribuição original

Há um espaço **não preenchido** por nenhuma das fontes externas:
*regras sobre como o agente IA deve se comportar editorialmente*
(idioma, cadeia de commit, formato de teste, decision-brief antes de
mudanças não-triviais, fail-fast em PRs). Esse eixo é **sui generis** ao
`ai-guidelines` e talvez à categoria mais ampla de "AI coding agent
governance frameworks". Não inventar referência externa para isso.

---

## 10. Implicações para `[DEC-0018-B01]` e `[DEC-0018-B05]`

### 10.1 Opções para `[DEC-0018-B01]` — Taxonomia das categorias

#### Opção A — 4 categorias top-level inspiradas em SonarSource

```
1. Correctness          (≈ Bug)
2. Security             (≈ Vulnerability + Hotspot)
3. Maintainability      (≈ Code Smell de alto impacto)
4. Process / IA-Editorial   (sui generis ao ai-guidelines)
```

- **Prós**: alinha com o modelo mais maduro multi-domínio (Sonar);
  fácil de explicar; mapeia diretamente para tags de PR/issue.
- **Contras**: "Process / IA-Editorial" não tem âncora externa; se
  cresce muito vira saco de gato. "Maintainability" e "Correctness" às
  vezes se sobrepõem.

#### Opção B — 6 categorias inspiradas em OWASP-LLM + correctness

```
1. Correctness
2. Security (clássica — CWE/OWASP-Top-10 subset)
3. LLM-Security (OWASP-LLM subset — prompt injection, output handling,
   excessive agency, sensitive disclosure)
4. Maintainability
5. Quality Gates (cobertura, mutation, types)
6. Process / IA-Editorial (idioma, commit chain, test naming, BDD)
```

- **Prós**: explicita o eixo LLM/IA — diferencial do framework;
  isola Quality Gates como categoria de primeira classe (já é feature
  opt-in dedicada); reflete a estrutura `.core/rules/` × `opt-in/`.
- **Contras**: 6 categorias é o limite cognitivo; risco de sobreposição
  Security ↔ LLM-Security; alguns consumidores vão querer simplificar
  para 4.

#### Opção C — 3 dimensões + tags ortogonais (modelo Sonar full)

```
Tipo (1 de 4):     {Bug, Code Smell, Vulnerability, Security Hotspot}
Severidade (1 de 5): {Blocker, Critical, Major, Minor, Info}
Domínio (tags livres):
   correctness, security, llm-security, maintainability, style,
   quality-gate, process, ia-editorial, ...
```

- **Prós**: mais expressivo; permite filtrar regras de várias formas
  (por tipo, severidade, domínio); espelha um sistema de produção
  (Sonar) — fácil de cross-ref.
- **Contras**: mais cognitivamente caro; o framework hoje **não tem
  CI rodando essas regras** (são editoriais para a IA), então severity é
  semi-arbitrário; setup overhead alto para autores de novas regras.

#### Opção D — Estratificação por *fase* (inspirada em CERT "Modes of Introduction")

```
1. Design-time rules        (decisão arquitetural)
2. Implementation-time rules (escrita do código)
3. Review-time rules         (PR/checklist)
4. Operation-time rules      (logging, monitoring, secrets)
```

- **Prós**: mapeia para o ciclo SDLC; ressoa com `decision-brief.md`,
  `plan.md`, `tasks.md` do workflow SDD.
- **Contras**: a maioria das regras editoriais cabe em "implementation-
  time" — fica desbalanceado; as outras 3 categorias ficam pequenas e
  forçadas.

#### Síntese das opções

| Critério | A (4 Sonar) | B (6 + LLM) | C (3 dim + tags) | D (4 fase SDLC) |
| :-- | :--: | :--: | :--: | :--: |
| Aderência a fonte externa | Alta (Sonar) | Média (Sonar + OWASP-LLM) | Alta (Sonar) | Média (CERT) |
| Cobre eixo IA-editorial | Sim (top-level) | Sim (top-level) | Sim (tag) | Não direto |
| Cobre LLM-security | Não destaca | Sim (top-level) | Sim (tag) | Não direto |
| Custo cognitivo p/ autor | Baixo | Médio | Alto | Médio |
| Compatível com cross-ref CWE | Sim | Sim | Sim | Indireto |
| Risco de sobreposição | Médio | Médio-alto | Baixo | Alto |

### 10.2 Opções para `[DEC-0018-B05]` — Metodologia de eval mínimo

A inspiração externa para "como avaliar se uma regra cumpre seu
propósito" também vem das fontes:

#### Opção E1 — Eval no estilo "CERT Risk Assessment"

Para cada regra, exigir:
- **Severity** (Low/Medium/High).
- **Likelihood** (Unlikely/Probable/Likely).
- **Remediation Cost** (High/Medium/Low).
- **Priority** computada (matriz CERT).

- **Prós**: força o autor a justificar quantitativamente a regra.
- **Contras**: regras editoriais para IA não têm "remediation cost"
  natural — IA segue ou não segue.

#### Opção E2 — Eval no estilo "OWASP Top 10 Factors"

Para cada regra, exigir:
- **Incidence** (frequência no corpus de PRs/commits do framework).
- **Exploitability / Impact** (consequência se a IA viola).
- **Detectability** (humano consegue notar a violação?).
- **CWE / OWASP cross-refs** quando aplicável.

- **Prós**: fácil de instanciar com dados internos
  (commits/PRs do próprio repo para "incidence").
- **Contras**: precisa baseline empírica — caro para
  bootstrap.

#### Opção E3 — Eval no estilo "ESLint regression test" (golden examples)

Para cada regra, exigir:
- **Exemplo non-compliant** (mínimo 1, ideal 2-3).
- **Exemplo compliant** (par a par).
- **Prompt-eval**: rodar uma IA contra o `AGENTS.md` que **inclui** a
  regra e contra um `AGENTS.md` que **não** inclui; medir delta no
  comportamento sobre os exemplos.

- **Prós**: empirista; mensura *o efeito da regra na IA*, não só sua
  formulação. Alinha com a natureza do produto (regras editoriais para
  IA → o eval correto é "a IA muda?").
- **Contras**: requer infra de eval (test runner contra modelo); custo
  alto de manter golden set.

#### Opção E4 — Eval estilo "Sonar RSPEC + see also"

Para cada regra, exigir o mínimo da RSPEC do Sonar:
- ID, Name, Why is this an issue?, Noncompliant, Compliant, Exceptions,
  See also (CWE/OWASP/CERT/ESLint refs), Tags, Severity.
- **Sem** prompt-eval — eval = revisão por humano + cross-ref.

- **Prós**: barato; alinha com prática indústria; ergonômico.
- **Contras**: não mede efeito na IA — só formaliza a documentação.

#### Síntese E

Combinação plausível: **E4 obrigatório + E3 amostral** — toda regra tem
RSPEC mínima, e um *subset* de regras críticas tem prompt-eval real
(golden examples rodados contra modelo).

### 10.3 Observação meta sobre as opções

As opções A-D são **mutuamente exclusivas** (a taxonomia top-level só
pode ser uma). As opções E1-E4 são **combináveis** (uma regra pode ter
RSPEC + Risk Assessment + golden examples). `[DEC-0018-B01]` e
`[DEC-0018-B05]` são, portanto, decisões de natureza diferente — uma
estrutural, outra metodológica.

---

## 11. Limitações desta síntese

1. **Profundidade de fetch limitada**. Tentamos fetch direto da página
   CWE Top 25 (sucesso parcial) e da rules.sonarsource.com (sucesso na
   docs SonarQube, mas não no catálogo plural de RSPECs). Não foi
   possível baixar o PDF v2025 do OWASP-LLM (excedeu limite de tamanho
   do tooling) — usamos as descrições de páginas oficiais
   (genai.owasp.org/llm-top-10/) e fontes derivadas para a lista
   completa LLM01-LLM10.
2. **CWE Research View (CWE-1000) não foi inspecionada in loco** — a
   hierarquia de Pillars descrita na §2.1 vem de conhecimento prévio +
   menções nas search results, não de fetch direto. **Validar** antes
   de cravar contagem exata de Pillars.
3. **OWASP Top 10:2025 (web)** está em desenvolvimento e
   intencionalmente não foi citado como fonte estável — só Top 10:2021.
4. **CERT — não fizemos fetch da página principal** (wiki.sei.cmu.edu
   socket fechou). Categorias listadas vêm das search results
   blackduck.com / wikipedia.org / sei.cmu.edu — devem ser
   verificadas no wiki oficial antes de citar como autoridade.
5. **ESLint** — a taxonomia descrita reflete a organização clássica
   (até docs antigas v4-v6); o site atual `eslint.org/docs/latest/rules`
   reorganizou as categorias e desacoplou stylistic em
   `@stylistic/eslint-plugin`. As 7 categorias da §7.1 são **históricas**;
   na taxonomia atual há ~4-5 grupos. Validar antes de cravar.
6. **SonarSource — número exato de regras por linguagem e estrutura
   detalhada de tags** não foi obtida em fetch direto (404 na URL
   atual); descrição da §4 vem de páginas adjacentes
   (security-related-rules) que confirmam apenas a taxonomia top-level.
7. **Não cobrimos**: MISRA C/C++ (relevante para automotive/embarcado),
   ISO/IEC TS 17961 (C secure coding), NIST Secure Software Development
   Framework (SSDF), JPL Coding Standard (NASA). Ficam para extensão
   futura se a Spec 0018 quiser ampliar o leque.
8. **Fontes que não validamos contra primária neste round**:
   `oligo.security`, `aembit.io`, `mend.io`, `invicti.com` foram tratadas
   como confirmatórias da lista LLM2025 mas não como fontes primárias.
   Para citações finais, ancorar em owasp.org/genai.owasp.org.

---

## Anexo A — Cross-reference rápido CWE × OWASP web × OWASP-LLM

| Tema | CWE primário | OWASP web | OWASP-LLM |
| :-- | :-- | :-- | :-- |
| Injection genérica | CWE-77, 78, 89, 94 | A03 | LLM01 (prompt), LLM05 (output) |
| Sensitive data exposure | CWE-200, 798 | A02, A04 | LLM02, LLM07 |
| Authn/authz | CWE-287, 306, 862, 863 | A01, A07 | LLM06 (excessive agency) |
| Supply chain integrity | CWE-1357, 502 | A06, A08 | LLM03, LLM04 |
| Resource exhaustion | CWE-400 | (indireto) | LLM10 |
| Logging | CWE-117, 778 | A09 | (indireto) |
| SSRF | CWE-918 | A10 | (não direto) |

---

## Anexo B — Esqueleto recomendado de "regra bem documentada" (consolidado das fontes)

Baseado em interseção CWE / CERT / Sonar RSPEC / OWASP-LLM / ESLint:

```yaml
id: AIGL-XXX                # ID local do framework
name: Frase prescritiva curta
type: correctness | security | maintainability | process-ia
severity: blocker | critical | major | minor | info
why_is_this_an_issue: |
  Parágrafo explicando o porquê (não o quê).
noncompliant_example: |
  ```ts
  // código que viola
  ```
compliant_example: |
  ```ts
  // versão correta
  ```
exceptions: |
  Quando a regra não se aplica.
risk_assessment:                # opcional, estilo CERT
  likelihood: unlikely | probable | likely
  impact: low | medium | high
  remediation_cost: low | medium | high
see_also:
  - CWE-XX
  - OWASP-A0X / OWASP-LLM0X
  - CERT XXX-NN-LANG
  - ESLint rule-name
tags: [correctness, llm, ts]
applicable_languages: [ts, js, ...]   # ou "all"
introduced_in_version: 0.X.0
mode_of_introduction: design | implementation | review | operation
```

Esse esqueleto é uma **proposta consolidada para discussão**, não
decisão. Cabe a `[DEC-0018-B01]` aceitar/rejeitar/encurtar.
