# \_templates — os moldes do modelo de fluxo (G25), para validar/adaptar um a um

> Coletânea **canônica** dos templates que criamos no `_flow-model-dogfood/`, reunidos aqui para **validar e
> adaptar cada um**. A simulação (`../_repo-simulation/`) os exercita; o que ela **falsifica** vira adaptação
> aqui. Não-autoridade (o template vivo real, pós-DEC, vai para `.core/governance/templates/`).

## Catálogo + status de validação

| Template             | Nó / artefato          | Status          | Observação                                                                                                       |
| -------------------- | ---------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `intent-brief.md`    | abertura (Dense)       | ⚠️ **adaptar**  | **F1:** `sealed` é por-kind (delivery/experiment=true; incident=false; spike=leve) — hoje assume `true` p/ todos |
| `intent-inline.md`   | abertura (Virtual)     | ❌ **superado** | **F2:** "inline no PR" = GitHub como fonte (rejeitado). Substituído por `registry-entry.yml`                     |
| `registry-entry.yml` | entrada de `registry/` | 🆕 **novo**     | Virtual = a entrada **É** o trabalho; Dense = a entrada **indexa** o workspace                                   |
| `state.yml`          | SSOT estrutural        | ✅ validado     | dogfood G25                                                                                                      |
| `decision-brief.yml` | índice derivado        | ✅ validado     | derivado de `decisions/*` (`into` preenchido/`null`)                                                             |
| `learning-record.md` | fecho experiment/spike | ✅ validado     | exercido no experiment (won→promotes)                                                                            |
| `question.md`        | pergunta               | ✅ validado     | opções neutras + A+ gerado                                                                                       |
| `research.md`        | investigação           | ✅ validado     | back-pointer `investigates`                                                                                      |
| `decision.md`        | decisão (bundle)       | ✅ validado     | `resolves` (q→§Dx) + gate humano                                                                                 |

> `gate` não está aqui: o molde canônico já existe em `.core/governance/templates` (`_TEMPLATE.gate.yml`).

## Como validamos cada um

Para cada template: instanciar na simulação (`../_repo-simulation/`), ver se a forma encaixa no kind; se não,
**adaptar o template aqui** e registrar o achado na research
(`research/2026-06-24-opening-artifact-by-kind-and-repo-simulation.md` §6). É a iteração "validar cada um".
