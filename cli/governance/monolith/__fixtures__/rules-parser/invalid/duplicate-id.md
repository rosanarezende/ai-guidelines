## Regra com ID Duplicado

#### [GR-0001] First rule with duplicate ID

```yaml
id: GR-0001
scope: universal
category: correctness
evidence_strength: strong
sources: ["CWE-1"]
applicable_languages: []
tags: []
```

Primeira.

#### [GR-0001] Second rule same ID (error!)

```yaml
id: GR-0001
scope: universal
category: correctness
evidence_strength: strong
sources: ["CWE-1"]
applicable_languages: []
tags: []
```

Duplicada.
