#### [GR-TEST-01] Happy Path Rule

```yaml
id: GR-TEST-01
scope: universal
category: correctness
evidence_strength: strong
sources: ["TEST-1"]
applicable_languages: ["all"]
tags: ["test"]
```

**Instruction (en):**

This is a test instruction in English.
It can span multiple lines.

**Documentação (pt-br):**

Esta é uma documentação de teste em português.

Também pode ter múltiplas linhas.

#### [GR-TEST-02] Rule with only instruction

```yaml
id: GR-TEST-02
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["all"]
tags: ["test"]
```

**Instruction (en):**
This rule only has an instruction.
