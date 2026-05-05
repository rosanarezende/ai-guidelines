### Global Rules — Regras universais (runtime)

> Fonte de verdade: bloco `<AI_GUIDELINES>` compilado no `AGENTS.md`.
> Este arquivo define princípios universais aplicáveis a qualquer projeto.
> Workflow operacional (git/PR/CI) vive no `agents-core.md`.

> **Convenção YAML (Spec 0018 / B.3):**
>
> - `#### [ID] Title`
> - bloco ```yaml imediatamente após
> - `Instruction (en)` = runtime
> - `Documentação (pt-br)` = docs

---

## Engineering Principles

#### [GR-0001] Secure secret handling

```yaml
id: GR-0001
scope: universal
category: security
evidence_strength: strong
sources: ["OWASP-A2", "CWE-522", "EXT-AKITA-2026", "EXT-AIJAIL-2026"]
validated_by_benchmark: true
applicable_languages: ["*"]
tags: [engineering, security]
```

**Instruction (en):**
Never expose secrets in frontend code or versioned files. Store them in environment variables and ensure they are ignored by version control.

**Documentação (pt-br):**
Chaves de API nunca devem transitar pelo frontend ou arquivos versionados.
Use `.gitignore` e variáveis de ambiente corretamente.

---

#### [GR-0002] Strict typing (anti-hacks)

```yaml
id: GR-0002
scope: universal
category: correctness
evidence_strength: medium
sources: ["CWE-704"]
applicable_languages: ["*"]
tags: [engineering, typing]
```

**Instruction (en):**
Do not bypass the type system. Avoid unsafe casts (`any`, `unknown`, prototype manipulation) and use explicit type guards or generics.

**Documentação (pt-br):**
Evite `any`, `as unknown`, coerções inseguras e manipulação de prototype.
Prefira type guards e tipagem explícita.

---

#### [GR-0003] Immutability over shared mutation

```yaml
id: GR-0003
scope: universal
category: maintainability
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [engineering, immutability]
```

**Instruction (en):**
Use immutable data structures and pure functions. Do not mutate shared state.

**Documentação (pt-br):**
Prefira estruturas imutáveis e funções puras.
Evite estado global mutável.

---

#### [GR-0004] Fail-fast error handling

```yaml
id: GR-0004
scope: universal
category: correctness
evidence_strength: strong
sources: ["CWE-703", "EXT-AKITA-2026"]
validated_by_benchmark: true
applicable_languages: ["*"]
tags: [engineering, errors]
```

**Instruction (en):**
Fail fast and propagate errors explicitly. Do not swallow exceptions or use empty catch blocks.

**Documentação (pt-br):**
Nunca use try/catch vazio ou que apenas loga.
Erro deve ser propagado ou tratado corretamente.

---

#### [GR-0005] Explicit async and concurrency intent

```yaml
id: GR-0005
scope: universal
category: correctness
evidence_strength: medium
sources: ["CWE-362", "EXT-AKITA-2026"]
validated_by_benchmark: true
applicable_languages: ["*"]
tags: [engineering, concurrency]
```

**Instruction (en):**
Make concurrency explicit: use `Promise.all` for independent tasks and `await` sequencing for dependent ones. Do not use fire-and-forget without error handling.

**Documentação (pt-br):**
Use `Promise.all` para paralelo e `await` sequencial para dependências.
Evite fire-and-forget sem tratamento de erro.

**See also:** [OPT-0301]

---

## AI Workflow Rules

#### [GR-0101] Spec type must be declared

```yaml
id: GR-0101
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [workflow, spec]
```

**Instruction (en):**
Declare the spec type (evidence-driven, deterministic, or mixed) and require human approval when design depends on unresolved evidence.

**Documentação (pt-br):**
Specs `evidence-driven` ou `mixed` exigem decision-brief antes da implementação.

---

#### [GR-0102] Token Budget Methodology (Tok-H)

```yaml
id: GR-0102
scope: universal
category: editorial
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [workflow, spec, tokens]
```

**Instruction (en):**
When measuring the token cost of new guidelines, use the Tok-H heuristic: aggregate characters divided by 3.5. Ensure the resulting payload respects established soft ceilings (6000 aggregate, 1500 universal, 600 adapter, 1200 opt-in).

**Documentação (pt-br):**
A unidade canônica de orçamento de contexto é o token, medido pela heurística Tok-H (caracteres / 3,5, calibrado para PT-BR/EN). Linhas e quantidade de instruções são derivadas pedagógicas. Respeite os soft ceilings: agregado ≤ 6 K, universal ≤ 1,5 K, adapter ≤ 600, opt-in ≤ 1,2 K.

---

## Owner Conventions (Non-evidence rules)

> Regras baseadas em prática real. Não possuem source canônica.
> Mantidas separadas do núcleo evidence-driven.

#### [GR-0201] Repository language standard

```yaml
id: GR-0201
scope: universal
category: editorial
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [owner, language]
```

**Instruction (en):**
Always respond using the repository default language.

**Documentação (pt-br):**
Neste repositório: sempre responder em PT-BR.

---

#### [GR-0202] Context noise reduction

```yaml
id: GR-0202
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [owner, ai_efficiency]
```

**Instruction (en):**
Exclude irrelevant files (logs, builds, dependencies) from the AI context using ignore files.

**Documentação (pt-br):**
Use `.gitignore`, `.claudeignore`, `.geminiignore` para remover logs,
builds e `node_modules` do contexto.

---

#### [GR-0203] Collaborative PR description

```yaml
id: GR-0203
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [owner, workflow]
```

**Instruction (en):**
Build PR descriptions in three steps: outline topics, get human approval, then generate the final text using the repository template (if available) and perform a final human validation.

**Documentação (pt-br):**
Fluxo obrigatório:

1. listar tópicos
2. humano valida
3. gerar texto final (seguindo template do repositório, se existir)
4. humano valida novamente
