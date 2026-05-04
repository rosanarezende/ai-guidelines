### Core fixtures (test-only)

#### [CORE-01] Environment check stub

```yaml
id: CORE-01
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected]
```

**Instruction (en):**
Identify platform, shell and surface before the first action.

**Documentação (pt-br):**
Stub para teste do ledger.

---

#### [CORE-08] Harness lock stub

```yaml
id: CORE-08
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, harness_lock]
```

**Instruction (en):**
Run format, check, add, commit as one chain. Never commit alone.

**Documentação (pt-br):**
Stub para teste do ledger.

---

#### [CORE-14] Commit message protocol stub

```yaml
id: CORE-14
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, commit]
```

**Instruction (en):**
The AI generates only the commit message text; humans run the chain.

**Documentação (pt-br):**
Stub para teste do ledger.

---

#### [GR-NONCORE-01] Non-core universal stub

```yaml
id: GR-NONCORE-01
scope: universal
category: editorial
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [editorial]
```

**Instruction (en):**
Should not appear in the core ledger.

**Documentação (pt-br):**
Stub não-core para garantir filtragem.
