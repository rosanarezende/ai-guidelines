# Capability Extraction Prompt

Use this prompt when an AI channel helps a company adopt the framework for an existing repository.

The AI output is advisory only. It must not write the manifest directly. A human owner reviews the suggested capability list before it becomes `.governance/manifest.yml`.

## Input

- repository id
- package name and dependencies
- exported symbols from source
- selected source snippets
- existing owner/team if known
- current `.governance/capability-candidates.yml`

## Task

Produce a manifest patch proposal:

```yaml
provides:
  - name:
    kind:
    status: proposed
    evidence:
      - "file:src/..."
consumes:
  - contract:
    why:
    evidence:
      - "package:@acme-sim/..."
capabilities:
  - text:
    tags:
      - tag
    confidence: low|medium|high
    evidence:
      - "export:functionName"
      - "file:src/..."
unknowns:
  - question:
    suggested-owner:
```

## Rules

- Do not infer confidential names, metrics or business facts.
- Prefer `unknowns` over confident guesses.
- Never classify a capability as attested; use `proposed`.
- Preserve repo owner from the current registry unless evidence proves it is stale.
- If source evidence is weak, mark confidence `low`.
