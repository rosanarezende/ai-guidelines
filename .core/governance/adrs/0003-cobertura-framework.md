# ADR 0003 — Rastreabilidade `[BR-CLI-*]` é Contrato; Cobertura é Política Operacional

**Status**: Aceita
**Origem histórica**: Spec 0004 (2026-04-21).
**Reescrita**: Spec 0021 sub-bloco 4.B.4 (2026-05-17) — corpo original era relatório de execução com números de linha de arquivos específicos; reescrito como princípio perene à luz do critério editorial em `.core/governance/adrs/README.md`. A parte tática (threshold numérico, lista de exceções por linha) migrou para [`.core/process/test-coverage-policy.md`](../../process/test-coverage-policy.md).

---

## Contexto

Sistemas que perseguem cobertura técnica como objetivo final tendem a um anti-padrão previsível: testes que existem para o número, não para a regra. Linhas defensivas contra falhas catastróficas de infraestrutura (e.g. `throw` se arquivo do framework sumir) só podem ser cobertas por **test hooks** que poluem o código de produção; ramos de proteção contra estados impossíveis em ambiente saudável geram testes frágeis que medem a si mesmos. A cobertura técnica numérica vira pressão contra a clareza do código.

Em paralelo, o problema **real** que cobertura tenta resolver — "minha mudança quebra uma regra de negócio?" — não é resolvido só por porcentagem de linhas executadas. Sem **vínculo explícito** entre regra de negócio e teste que a protege, dois sintomas aparecem: (a) regras documentadas mas nunca testadas; (b) testes existindo sem corresponder a nenhuma regra rastreável. Cobertura técnica passa, regra fica desprotegida.

## Princípio

**Rastreabilidade entre regra de negócio e teste é contrato; cobertura técnica é piso operacional.** Cada regra do domínio recebe um identificador imutável (`[BR-CLI-*]`) materializado no teste que a protege. A SSOT da regra é o teste, não a documentação narrativa — Living Documentation (ADR 0010, 0011, 0012, 0013, 0014) deriva artefatos estruturados a partir desses identificadores.

Cobertura técnica permanece como guardrail mínimo no pipeline, com exceções **honestas e auditáveis**: módulos cujo único caminho não-coberto é defesa contra estado impossível em ambiente saudável são isentos por escrito, não por hack. Bootstrappers que apenas roteiam para módulos cobertos são testados na integração `smoke`, não com unit threshold.

Três corolários decorrem do princípio:

1. **Paridade BDD/Negócio é threshold semântico de 100%.** Toda regra rotulada `[BR-CLI-*]` em documentação canônica deve mapear para ao menos um `it(...)` em bloco BDD nos testes. A ausência é falha de contrato, não débito de cobertura. Drift guard de Living Documentation (ADR 0012) é o mecanismo de detecção.

2. **Cobertura numérica global é piso, não meta.** Existe um threshold no pipeline (definido em `.core/process/test-coverage-policy.md`) para barrar regressão silenciosa, mas perseguir +5% sobre o piso por si só não é trabalho de valor. Trabalho de valor é fechar regra de negócio sem teste.

3. **Test colocation segue Feature-Sliced Design adaptado.** Testes do framework vivem ao lado dos scripts/módulos que cobrem (`/*.test.mjs` ao lado de `/*.mjs`; `*.test.ts` ao lado de `*.ts`). Não há diretório `tests/` paralelo espelhando a topologia de `src/` — espelhar topologia dobra o custo de mover/renomear.

## Opções avaliadas

| #   | Opção                                                                                  | Trade-off                                                                                                                                                                      |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A   | Perseguir 100% de cobertura técnica numérica                                           | Garante que toda linha seja executada por teste, mas exige test hooks em código de produção e produz testes que medem ramos defensivos irrelevantes. Pune a clareza do código. |
| B   | **Rastreabilidade BR-CLI como contrato + cobertura como piso operacional** (escolhida) | Vincula teste à regra que ele protege; cobertura técnica vira guardrail mínimo com exceções honestas; permite código de produção limpo sem perder proteção real.               |
| C   | Só rastreabilidade BR-CLI, sem threshold numérico nenhum                               | Maximiza clareza mas perde guardrail contra regressão silenciosa em código que escapa da rotulagem BR-CLI (utilitários, infraestrutura).                                       |

## Onde se aplica

Este princípio rege:

- O design da Living Documentation (ADRs 0010–0014, PR3 da Spec 0021): testes com `[BR-CLI-*]` são SSOT; `living-docs.yml` é projeção determinística; drift guard fatal.
- O contrato do pipeline de CI: threshold global definido em [`.core/process/test-coverage-policy.md`](../../process/test-coverage-policy.md); exceções listadas e justificadas no mesmo arquivo.
- A política editorial de novas regras: toda regra adicionada à documentação canônica deve nascer com `[BR-CLI-*]` e teste correspondente, ou ser explicitamente classificada como "regra narrativa sem enforcement" (raro, exige justificativa).

Este princípio **não** rege:

- A cobertura específica de pacotes consumidores — o framework distribui ferramental (Quality Gates como opt-in), mas o threshold final é decisão do consumidor.
- A escolha de framework de testes (Vitest, Jest, node test runner) — operacional, decidida por stack.

## Consequências

- Código de produção fica **livre de test hooks** para cobertura: defesa contra estado impossível pode ser declarada e isentada.
- Suíte de testes é **mais rápida e menos frágil**: menos ramos triviais sendo testados pelo próprio teste.
- Mudanças em regras de negócio são **rastreáveis em duas direções**: do `.md` ao teste pelo `[BR-CLI-*]`; do teste ao `.md` pelo `evidence[]` da Living Documentation.
- Risco residual: erros em linhas isentas (e.g. throw catastrófico) só seriam detectados em runtime real. **Aceito**: nesses caminhos o framework já estaria corrompido.

---

_Operacionalização (thresholds, lista de exceções, bootstrappers isentos): [`.core/process/test-coverage-policy.md`](../../process/test-coverage-policy.md)._
