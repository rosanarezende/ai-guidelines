## Exemplo de Regra Simples

#### [GR-0001] Sempre verificar tipos em atribuições

```yaml
id: GR-0001
scope: universal
category: correctness
evidence_strength: strong
sources:
  - "CWE-400: Uncontrolled Resource Consumption"
  - "https://example.com/research"
applicable_languages: ["JavaScript", "TypeScript", "Python"]
tags: [type-safety, correctness]
```

Descrição da regra aqui.

#### [GR-0002] Segunda regra no mesmo arquivo

```yaml
id: GR-0002
scope: universal
category: security
evidence_strength: medium
sources:
  - "CERT-C-02"
applicable_languages: []
tags: [security]
```

Outra regra.
