# ADR 0015 — Classificação Universal vs Opt-in para Regras Distribuídas

**Status**: Aceita
**Origem histórica**: Spec 0008 (canonizou a distinção) — promovida a ADR pela Spec 0021 sub-bloco 4.B.2 (2026-05-17).
**Estende**: [`ADR 0005 — Curadoria Público/Privado`](./0005-curadoria-publico-privado.md) (princípio "opt-in é exatamente o que varia por stack").

---

## Contexto

O framework distribui regras de governança para consumidores via CLI (`init`, `adopt`). Algumas regras valem para **qualquer** projeto que use o framework — independentemente de linguagem, stack ou processo — e devem ser sempre injetadas. Outras só fazem sentido para **alguns** projetos: TDD para times que praticam TDD, Prettier para projetos JS/TS, Quality Gates para times que querem threshold de cobertura no CI.

Sem critério explícito de classificação, três anti-padrões aparecem: (a) regra opt-in vira mandatória por inércia, forçando consumidores a engolir convenções que não casam com a stack deles; (b) regra universal vira opt-in por excesso de cautela, deixando consumidores sem o piso mínimo de governança; (c) decisão de "onde a regra mora" vira discussão a cada nova regra, gastando energia em bikeshedding.

## Princípio

**Toda regra distribuída pelo baseline declara explicitamente sua classe: universal ou opt-in. Universal = vale para qualquer consumidor independentemente de stack; opt-in = varia por stack, processo ou preferência.** A classificação é parte do contrato da regra, não convenção implícita.

Duas implicações operacionais decorrem do princípio:

1. **Universal vive em `.core/rules/top/` e `.core/rules/center/`** (ou camadas equivalentes na evolução da topologia). É sempre injetado no `<AI_GUIDELINES>` compilado do consumidor. Mudanças em regra universal afetam todos os consumidores no próximo `update`.

2. **Opt-in vive em `.core/rules/base/<tema>/` + `cli/features/opt-in/<tema>/`** (ou equivalente). Wizard interativo pergunta no `init`/`adopt`; consumidor escolhe. Mudanças em regra opt-in só afetam consumidores que ativaram a feature correspondente.

## Critério prático para classificar

Pergunta-teste para decidir entre universal e opt-in:

> "Esta regra valeria para um projeto X em stack Y com processo Z que **não** compartilha convenções com a minha stack/processo?"

- **Sim, vale para qualquer projeto** → universal. Exemplos: workflow obrigatório do agente IA, princípio "agir mediante plano formado", política de PR collaborative description.
- **Não, depende de stack/processo** → opt-in. Exemplos: TDD (depende de processo), Prettier (depende de stack JS/TS), Quality Gates com threshold X (depende de tolerância do time).

Quando a resposta é "depende", a regra é opt-in. Universal é o subconjunto **estritamente** independente de stack.

## Opções avaliadas

| #   | Opção                                                        | Trade-off                                                                                                                                                |
| --- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | **Toda regra é universal** (não existe opt-in)               | Simples mentalmente, mas força consumidores em stacks divergentes a engolir convenções que não casam — adoção cai por fricção.                           |
| B   | **Toda regra é opt-in** (nada é mandatório)                  | Maximiza customização, mas perde o piso de governança que justifica a existência do framework. Consumidor pode opt-out de "agir mediante plano formado". |
| C   | **Universal vs opt-in declarado explicitamente** (escolhida) | Vincula classificação ao contrato da regra; força reflexão no ato de criação; permite piso firme + customização real onde faz sentido.                   |

## Onde se aplica

Este princípio rege:

- A escolha de topologia em `.core/rules/{top,center,base,adapters}/` (cada zona já é uma decisão de classificação reificada).
- O comportamento do wizard de `init`/`adopt`: pergunta por features opt-in, nunca por universals.
- A política de promoção de regra em qualquer spec: regra promovida nasce com classificação declarada, ou o review rejeita.
- Adapters (`.core/rules/adapters/`) são uma subcategoria: regras opt-in **por provider de IA**, não por stack.

Este princípio **não** rege:

- A política de runtime injection (monolítica vs federada) — isso é decisão separada (ADR 0008).
- A escolha de quais features opt-in vêm "ligadas por default" no wizard — isso é UX de bootstrap, não classificação.

## Consequências

- Discussão "onde a regra mora" desaparece: é determinada pela classificação.
- Consumidores enxergam **com clareza** o que vão receber por default vs o que está sob seu controle.
- Risco residual: classificação errada (universal classificada como opt-in ou vice-versa) tem custo de migração se descoberta tardiamente. **Mitigação**: review de PR que promove regra exige justificativa explícita da classe.

---

_Operacionalização da classificação (paths, sincronização, wizard): [`.core/process/governance-foundation.md`](../../process/governance-foundation.md) § "Categorias de regras"._
