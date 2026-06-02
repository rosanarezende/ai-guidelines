# `.github/rulesets/` — política de merge como código

> Origem: **Spec 0024, Checkpoint 2.2.** Corrige uma classe de defeito descoberta
> na própria execução da 0024: o ruleset exigia o status check `guardrails`, sem
> produtor desde a consolidação `content-guardrails → repo-validation` (`12a3a28`).
> Drift SSOT→projeção silencioso, mascarado por admin-bypass. Cf. `[DEC-0024-F04]`
> e o princípio "absorção exige projeção ao ponto de consumo" (NEXT #10.9).

## O que é

`main-governance.json` é a **fonte da verdade declarativa** da política de merge do
branch default. O subconjunto declarativo (`name`, `target`, `enforcement`,
`conditions`, `bypass_actors`, `rules`) bate com o schema de export/import de
rulesets do GitHub — é **re-importável**.

## Disciplina — detect-only (NÃO há apply automático)

A automação **detecta drift e falha**; **não** muda política de merge. Aplicar é
**ação humana autorizada**:

```bash
gh api --method PUT repos/<owner>/<repo>/rulesets/<id> --input .github/rulesets/main-governance.json
```

(Cf. ADR 0018 — automação não substitui o humano, protege o espaço de decisão.)

## Dois invariantes, ranqueados

| Invariante                     | Pergunta                                                                            | Onde roda                                           | Rede?          |
| :----------------------------- | :---------------------------------------------------------------------------------- | :-------------------------------------------------- | :------------- |
| **PRIMÁRIO — producibilidade** | todo required context tem produtor **estável** (não-matriz) em `.github/workflows`? | `yarn validate` (`ruleset:check`)                   | não            |
| **SECUNDÁRIO — paridade**      | o ruleset vivo no GitHub == este arquivo?                                           | workflow `ruleset-drift` (`ruleset:check --parity`) | sim (`gh api`) |

O bug real foi de **producibilidade** — a paridade sozinha não o pegaria (um
arquivo que exigisse `guardrails` passaria na paridade enquanto o gate seguisse
morto). Por isso a producibilidade é o invariante central e entra no `validate`.

## Required contexts (e por quê são poucos e estáveis)

- **`repo-validation`** — gate de integridade (a cadeia `yarn validate` inteira).
- **`smoke`** — job **agregador estável** (`needs:` da matriz multi-OS). Exigimos
  o agregador, **nunca** os contextos expandidos por matriz
  (`smoke / ubuntu-latest / node 24.x` …): multiplicar required contexts acoplados
  à matriz reintroduz exatamente a classe de drift que este checkpoint elimina. O
  `ruleset:check` **rejeita** required context que dependa de expansão de matriz.
