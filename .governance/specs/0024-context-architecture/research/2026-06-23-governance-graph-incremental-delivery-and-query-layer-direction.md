# Direcao — Grafo de governanca, entrega incremental e camada de consulta

- **Data:** 2026-06-23
- **Spec:** 0024 — context-architecture
- **Checkpoint ativo:** `artifact-taxonomy-and-model-review-contract` (PR #45)
- **Natureza:** research/direction, narrativa de apoio e compilado de revisoes
- **Autoridade:** nao-operacional. Em divergencia, vencem `state.yml`, `tasks.md`,
  `decision-brief.md`, reviews/gates, Git e GitHub.
- **Status:** aguardando revisao complementar do Claude Code antes de promover
  qualquer ponto para DEC/task/model-review.

## 1. Por que este artefato existe

Durante a discussao sobre o simulador de jornadas governadas, apareceu uma dor
maior do que a implementacao do simulador: a Spec 0024 esta encontrando problemas
estruturais por dogfood manual tarde demais, enquanto os checkpoints ficam cada
vez mais parecidos com entregas de produto ponta a ponta, grandes, com prova de
valor apenas no final.

Esse sintoma levou a tres hipoteses conectadas:

1. O sistema precisa de um modelo explicito de governanca operacional como grafo,
   nao apenas Markdown/YAML interpretado por comandos e checks.
2. O sistema precisa dimensionar entregas incrementais com prova de valor, para
   evitar tanto prova minima falsa quanto checkpoint grande demais.
3. O grafo deve nascer preparado para camada de consulta externa, possivelmente
   banco orientado a grafo, sempre como projecao estritamente derivada do repo.

Este arquivo preserva a historia da dor, as hipoteses, os pareceres externos ja
recebidos e as perguntas que devem orientar a proxima decisao. Ele nao executa
decisao, nao altera topologia e nao autoriza implementacao.

## 2. Caminho percorrido

### 2.1 Simulador de jornadas

A ideia inicial era criar um simulador navegavel para visualizar estados do
runtime. A conversa refinou o escopo: o simulador nao deveria ser uma pagina
hand-authored, mas uma lente sobre mini-repos/fixtures rodando o runtime real.

Direcao ja registrada em
`research/2026-06-23-broad-flow-falsification-direction.md`:

- criar uma fonte canonica `fixtures/journeys`;
- unificar fixtures de teste e simulador;
- rodar `work`, `decide`, Doctor e demais superficies contra repos-fixture;
- usar a navegacao como falsificacao do lifecycle, nao como maquete.

### 2.2 Percepcao de saturacao do dogfood manual

A owner formulou a suspeita de que o dogfood manual deixou de ajudar como
instrumento principal de descoberta arquitetural. A formulacao refinada neste
compilado:

> Dogfood manual continua util como validacao situada, mas parece saturado como
> mecanismo principal de descoberta. O proximo nivel deve ser falsificacao
> sistematica via fixtures tipadas e runtime real.

### 2.3 Proposta de grafo de governanca

A conversa levantou a possibilidade de uma `spec-modelo` para repensar o sistema
sem se prender ao modelo atual. A revisao posterior apontou uma restricao
importante: `[DEC-0024-G08]` ja decidiu que a direcao orientada a grafo vive
dentro da Spec 0024, rejeitando uma "0025 independente" naquele momento.

O repo tambem ja tem `KnowledgeGraph` em
`src/app/projections/KnowledgeGraph.ts`, mas ele modela conhecimento
(`artifact`, `falsification`, arestas como `graduatedTo`, `falsifies`,
`constrains`, `crystallizedAs`), nao governanca operacional.

Assim, a pergunta deixa de ser "devemos inventar um grafo?" e passa a ser:

> Devemos estender o grafo existente, criar um bounded context novo de grafo de
> governanca, ou manter os dois separados com contrato explicito de projecao?

### 2.4 Hipotese de camada de consulta orientada a grafo

A owner tambem registrou uma inclinacao forte: se o grafo for modelado agora,
ele deve nascer preparado para uma camada externa de consulta, possivelmente
Neo4j ou equivalente, porque o valor futuro inclui:

- site em repositorio separado;
- simulador em repositorio ou superficie separada;
- dashboards para times;
- paineis para lideranca;
- visao cross-repo para empresas que adotam `ai-guidelines`;
- analise de bloqueios, riscos, decisoes, gates, reviews e valor entregue.

Restricao principal:

> O banco orientado a grafo nunca deve virar SSOT. Ele deve ser uma projecao
> derivada, regeneravel e auditavel dos artefatos versionados do repo.

## 3. Fatos e restricoes do repo

- O vocabulario governado atual e `Spec > Frente > Checkpoint > Etapa > Tarefa`
  (`[DEC-0024-G22]`).
- `Frente` e leitura/projecao derivada, nao nova SSOT nem campo obrigatorio de
  `state.yml`.
- `Checkpoint` e entrega governada e revisavel.
- `Etapa` e subdivisao opcional dentro de checkpoint grande.
- `Tarefa` e folha executavel ou evidencia, sem autoridade propria.
- `PR` e conteiner de revisao no GitHub, nao unidade de autoridade do lifecycle.
- `[DEC-0024-G08]` ja aceitou direcao orientada a grafo dentro da Spec 0024 e
  rejeitou uma spec independente naquele contexto.
- `KnowledgeGraph` existe, mas cobre o dominio Knowledge, nao o lifecycle
  operacional completo.
- `broad-flow-falsification` esta planejada, mas ainda nao ativa.
- O checkpoint ativo PR #45 ainda precisa fechar taxonomia de artefatos e
  contrato de model-review/pre-coding review.
- Qualquer decisao estrutural sem disposicao governada viola o espirito de
  `GG-0005 — Sem debito arquitetural silencioso`.

## 4. Hipoteses a investigar

### H1 — Grafo de governanca operacional

O sistema precisa representar governanca operacional como grafo tipado,
incluindo lifecycle, bloqueios, revisoes, gates, evidencias, decisoes, checks e
projecoes.

Pergunta central:

> O grafo de governanca deve ser extensao do `KnowledgeGraph`, novo bounded
> context, ou read-model derivado de varios bounded contexts?

### H2 — Dogfood reposicionado como validacao/falsificacao

Dogfood manual nao deve ser abandonado, mas nao deve continuar como mecanismo
principal de descoberta arquitetural. A descoberta deve migrar para fixtures
tipadas, jornadas executaveis e checks de falsificacao.

Pergunta central:

> Qual parte do aprendizado deve vir de fixtures/journeys e qual parte ainda
> exige dogfood humano situado?

### H3 — Entrega incremental com prova de valor

O modelo precisa impedir que specs/checkpoints virem entregas grandes demais sem
prova de valor intermediaria.

Pergunta central:

> Como representar o menor incremento governado que entrega valor verificavel,
> sem aceitar prova minima falsa e sem exigir entrega ponta a ponta antes de
> aprender?

Entidades/propriedades candidatas:

- `Slice`
- `Outcome`
- `ValueClaim`
- `Proof`
- `AcceptanceCriterion`
- `Risk`
- `AdoptionScenario`
- `proof_of_value`
- `minimal_viable_increment`

Relacoes candidatas:

- `delivers_value`
- `validates_hypothesis`
- `enables_next_slice`
- `can_ship_without`
- `requires_integration`
- `deferred_by_decision`

### H4 — Camada de consulta grafo-derivada

O sistema deve produzir um grafo canonico derivado do repo, capaz de alimentar
uma camada externa de consulta, inclusive banco orientado a grafo.

Pergunta central:

> O primeiro contrato deve ser um graph snapshot local, um adapter Neo4j, ou um
> modelo hibrido em que snapshot e banco sao projecoes do mesmo grafo canonico?

Restricoes:

- repo versionado permanece SSOT;
- banco nao decide;
- banco e site sao consumidores/projecoes;
- dados no banco devem apontar para fonte versionada;
- projecao deve ser regeneravel;
- drift deve ser detectavel;
- runtime local deve funcionar offline, sem banco;
- adapters externos nao entram no nucleo do dominio.

### H5 — Sete tipos MECE como dimensao ortogonal

Os 7 tipos MECE nao devem virar outra taxonomia concorrente sem necessidade.
Eles podem ser:

- tipos de trabalho;
- tipos de valor;
- tipos de risco;
- tipos de evidencia;
- lentes de decisao;
- dimensao ortogonal no grafo.

Pergunta central:

> Os 7 tipos MECE sao eixo primario do modelo, propriedade de nos/arestas, ou
> projecao derivada para planejamento e revisao?

## 5. Entidades e relacoes candidatas

### 5.1 Entidades candidatas

- `Repo`
- `Spec`
- `Frente` (provavelmente derivada)
- `Checkpoint`
- `Etapa`
- `Tarefa`
- `Artifact`
- `Decision`
- `Finding`
- `Review`
- `Gate`
- `Validation`
- `Policy`
- `JourneyFixture`
- `PR`
- `Commit`
- `Outcome`
- `ValueClaim`
- `Proof`
- `Slice`
- `Risk`
- `AdoptionScenario`

### 5.2 Relacoes candidatas

- `contains`
- `depends_on`
- `blocks`
- `produces`
- `evidences`
- `decides`
- `reviews`
- `validates`
- `projects_to`
- `supersedes`
- `derived_from`
- `applies_to`
- `requires_human_decision`
- `delivers_value`
- `validates_hypothesis`
- `enables_next_slice`
- `can_ship_without`
- `requires_integration`

### 5.3 Cuidado contra over-modeling

Nem toda candidata deve virar entidade ou aresta. Criterio proposto:

> Uma candidata so vira no/aresta primaria se existir uma consulta, travessia,
> check, decisao, projecao ou fixture que precise dela como estrutura, nao apenas
> como texto.

## 6. Camada de consulta e banco orientado a grafo

### 6.1 Opcoes de arquitetura

1. **Grafo em memoria derivado do repo**
   - Mais simples.
   - Bom para CLI/checks locais.
   - Limitado para dashboards, multi-repo e consultas interativas.

2. **Graph snapshot local derivado**
   - JSON/NDJSON deterministico com nodes, edges, source refs e hashes.
   - Continua repo-first.
   - Pode alimentar site, simulador e testes.
   - Bom contrato intermediario mesmo se houver banco depois.

3. **Banco orientado a grafo como projecao**
   - Exemplos a investigar: Neo4j, Memgraph, Kuzu, ArangoDB, SurrealDB.
   - Bom para dashboards, queries complexas e agregacao cross-repo.
   - Maior custo operacional.
   - Risco de virar segunda SSOT se o contrato de derivacao nao for rigido.

4. **Modelo hibrido**
   - Runtime compila grafo canonico.
   - Snapshot local e adapter de banco derivam do mesmo contrato.
   - Site/simulador/dashboard consomem snapshot ou banco.
   - Banco e opcional para consumidores simples, mas previsto para empresas.

### 6.2 Criterios de decisao para banco

- Quais queries reais nao ficam boas em JSON/snapshot?
- Precisamos consultar multiplos repos ao mesmo tempo?
- Precisamos de historico temporal ou apenas estado atual?
- O produto deve rodar offline?
- O banco sera hospedado pelo consumidor, pela empresa ou por um servico?
- Como representar identidades globais cross-repo?
- Como rastrear cada no/aresta ate arquivo, commit, PR ou gate?
- Como detectar drift entre repo e banco?
- Como impedir vazamento de informacao sensivel entre repos?
- Como evitar lock-in em Neo4j se o modelo conceitual for mais amplo?

### 6.3 Posicao provisoria da owner

A owner esta inclinada a escolher um banco orientado a grafo, desde que ele seja
estritamente derivado. O motivo nao e apenas tecnico: esse caminho permitiria
site e dashboards em repos separados e, no futuro, exposicao agregada de dados
por empresas que adotam `ai-guidelines` em varios repositorios.

Conclusao provisoria:

> Validar a hipotese de banco/projecao externa agora e essencial para nao
> desenhar um grafo local demais. A adocao concreta de Neo4j ou similar ainda
> exige comparacao e criterio, mas o modelo canonico ja deve nascer preparado
> para exportacao cross-repo.

## 7. Revisoes externas recebidas

### 7.1 Antigravity — Claude Opus 4.6 Thinking

Veredito resumido:

> Direcao correta na essencia, perigosa na forma.

Pontos centrais:

- O repo ja tem um `KnowledgeGraph` operacional.
- O problema nao e ausencia de grafo, mas escopo: o grafo atual modela
  conhecimento, nao governanca operacional.
- A solucao deve ser extensao/integracao, nao redesenho do zero.
- Dogfood manual saturou como instrumento de descoberta, mas continua util como
  validacao.
- As perguntas levantadas sao legitimas, mas varias ja foram respondidas por
  DECs existentes; outras cabem nas etapas ja planejadas.
- Nao recomenda nova spec, nova frente ou novo repo neste momento.
- Recomenda research note com perguntas remanescentes como acceptance criteria de
  falsificacao.

Leitura deste compilado:

- Parecer fortemente ancorado no repo, especialmente em G08/G22 e na existencia
  de `KnowledgeGraph`.
- Deve ser levado a serio como freio contra second-system effect.

### 7.2 Antigravity — Gemini 3.5 Flash High

Veredito resumido:

> Direcao correta.

Pontos centrais:

- Modelar governanca como grafo tipado ataca a raiz da fragilidade
  Markdown/regex.
- Dogfood manual esta atrasando e mascarando problemas.
- Markdown deveria virar view/projecao humana, nao SSOT logica.
- Recomenda concluir PR #45, criar artefato de model-review e deixar a
  implementacao fisica do motor de grafo para uma nova spec.

Leitura deste compilado:

- Captura bem a dor de produto e a fragilidade das superficies atuais.
- A recomendacao de nova spec conflita com G08, salvo se a owner decidir
  explicitamente superseder G08.

### 7.3 Sintese provisoria Codex

Sinais convergentes:

- Grafo tipado e direcao correta.
- Dogfood manual precisa ser reposicionado.
- Fixtures/journeys precisam virar mecanismo de falsificacao.
- O modelo deve evitar segunda SSOT.

Divergencias reais:

- Nova spec vs etapas existentes da 0024.
- Estender `KnowledgeGraph` vs criar bounded context proprio.
- Snapshot local primeiro vs banco orientado a grafo desde o inicio.
- Onde entram entrega incremental e prova de valor.

Posicao provisoria:

> Nao abrir nova spec agora. Registrar a direcao, pedir revisao do Claude sobre
> este compilado, e so promover para DEC/task/model-review depois de decidir a
> relacao com G08, PR #45 e as etapas planejadas.

## 8. Perguntas abertas para decisao

### 8.1 Modelo de governanca

1. O grafo de governanca e extensao do `KnowledgeGraph`, novo bounded context ou
   read-model derivado de varios contexts?
2. `Checkpoint` deve carregar prova de valor explicitamente?
3. `Etapa` e subdivisao tecnica, prova incremental, ou ambas?
4. `Tarefa` deve permanecer documental ou entrar no grafo como leaf consultavel?
5. `Decision` e no primario, artifact, ou evento registrado?
6. `Review` e `Gate` sao entidades primarias ou artefatos com arestas?

### 8.2 Entrega incremental

1. Como representar "menor incremento governado com valor verificavel"?
2. O que impede prova minima falsa?
3. O que impede checkpoint grande demais?
4. Como `ValueClaim`, `Outcome`, `Proof` e `AcceptanceCriterion` se conectam a
   Checkpoint/Etapa?
5. Como uma fixture prova valor incremental, nao apenas transicao valida?

### 8.3 Falsificacao e fixtures

1. Qual e o contrato canonico de `fixtures/journeys`?
2. Mini-repos devem conter snapshots de estado, historico Git sintetico ou
   comandos executaveis?
3. Como garantir que site, simulador e testes consomem a mesma fonte?
4. Como migrar fixtures existentes sem quebrar valor ja testado?
5. Quando dogfood humano ainda e necessario?

### 8.4 Camada de consulta

1. Qual e o contrato minimo do graph snapshot?
2. Quais identidades precisam ser globais cross-repo?
3. Como representar organizacao, repo, spec, frente, checkpoint, etapa e tarefa
   sem acoplar ao GitHub?
4. Quais queries justificam banco orientado a grafo?
5. Neo4j e a melhor opcao ou devemos comparar alternativas?
6. Como provar que o banco e projecao derivada e regeneravel?
7. Como proteger informacao sensivel em cenarios multi-repo/empresa?

### 8.5 Artefatos e templates

1. `spec.md`, `plan.md`, `tasks.md`, `decision-brief.md` e `research/` ainda
   fazem sentido?
2. Se fazem, cada um e view de qual parte do grafo?
3. O que herdamos de spec-kit por conveniencia historica?
4. Qual e a casa unica dos templates?
5. Como os 7 tipos MECE entram sem virar taxonomia paralela?

### 8.6 Veiculo governado

1. Isso cabe nas etapas planejadas da 0024?
2. G08 precisa ser mantida, refinada ou superseded?
3. O que deve ficar no PR #45?
4. O que deve esperar `internal-architecture-refactor-ddd-bdd`?
5. O que deve esperar `broad-flow-falsification`?
6. Existe justificativa forte para nova spec, nova frente ou novo repo?

## 9. O que nao implementar ainda

- Nao implementar motor de grafo de governanca.
- Nao adicionar Neo4j ou outro banco.
- Nao criar simulador navegavel.
- Nao migrar templates.
- Nao criar nova spec.
- Nao alterar `state.yml`, `tasks.md` ou `decision-brief.md` com base neste
  arquivo sem decisao governada posterior.
- Nao tratar este research como DEC.
- Nao substituir dogfood por fixtures sem definir contrato e criterio de
  equivalencia.

## 10. Proximo uso recomendado deste artefato

Quando o limite do Claude Code voltar, pedir uma revisao arquitetural deste
compilado. A revisao deve responder principalmente:

1. A lacuna de entrega incremental/prova de valor muda a recomendacao de nao
   criar nova spec?
2. A inclinacao por banco orientado a grafo, estritamente derivado, deve alterar
   o modelo inicial?
3. O caminho correto e estender `KnowledgeGraph`, criar novo bounded context, ou
   definir um graph snapshot canonico acima dos contexts?
4. O que deve virar acceptance criteria de `internal-architecture-refactor-ddd-bdd`
   e `broad-flow-falsification`?
5. O que, se algo, deve ser absorvido pelo PR #45?

## 11. Prompt sugerido para a proxima revisao

```md
Voce e revisor arquitetural da Spec 0024 no repo `ai-guidelines`.

Nao implemente nada. Leia o repo e este research:

`.governance/specs/0024-context-architecture/research/2026-06-23-governance-graph-incremental-delivery-and-query-layer-direction.md`

Contexto:

- Vocabulário correto: `Spec > Frente > Checkpoint > Etapa > Tarefa`.
- `[DEC-0024-G08]` ja aceitou direcao orientada a grafo dentro da 0024 e rejeitou uma spec independente naquele contexto.
- `[DEC-0024-G22]` define Frente como projecao derivada, Checkpoint como entrega governada/revisavel, Etapa como subdivisao opcional, Tarefa como folha/evidencia e PR como conteiner.
- O repo ja tem `KnowledgeGraph`, mas ele modela conhecimento, nao governanca operacional.
- A owner suspeita que dogfood manual saturou como instrumento de descoberta.
- A owner tambem quer investigar banco orientado a grafo, estritamente derivado, para site, simulador, dashboards e visao cross-repo empresarial.
- Um ponto novo e essencial: o modelo precisa dimensionar entregas incrementais com prova de valor, pois specs/checkpoints estao virando entregas ponta a ponta grandes demais.

Peca:

1. Veredito curto sobre o compilado.
2. O que esta correto, incorreto ou perigoso.
3. Se a lacuna de entrega incremental/prova de valor e real.
4. Se a hipotese de banco orientado a grafo derivado deve influenciar o modelo agora.
5. Se devemos manter o trabalho dentro das etapas planejadas da 0024, superseder/refinar G08, criar nova spec, nova frente ou novo repo.
6. Se o grafo deve estender `KnowledgeGraph`, virar novo bounded context ou ser graph snapshot canonico acima dos contexts.
7. O menor proximo artefato governado.
8. O que nao implementar ainda.
9. Como isso se relaciona com PR #45, `internal-architecture-refactor-ddd-bdd` e `broad-flow-falsification`.

Formato:

- Veredito curto
- Fatos observados no repo
- Interpretacao
- Divergencias
- Riscos reais
- Bloqueadores
- Recomendacao
- Proximo artefato minimo
```

## 12. Estado deste research

Este arquivo preserva uma decisao em formacao, nao uma decisao tomada. Seu valor
e evitar perda de contexto enquanto aguardamos a revisao complementar do Claude.
Depois da revisao, este conteudo deve ser:

- mantido apenas como research historica;
- complementado com a revisao do Claude;
- ou promovido parcialmente para DEC/task/model-review, conforme decisao da owner.
