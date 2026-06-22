# PR #44 — Modelo de checkpoints, PRs e mapa visual da Spec 0024

Data: 2026-06-22  
Spec: 0024 — context-architecture  
No: `co-flow-continuation`  
PR: #44 — `feat/spec-0024-co-flow-continuation`  
Artefato visual relacionado: `assets/spec-0024-map-v2.html`
Inventario relacionado:
`research/2026-06-22-checkpoint-co-flow-continuation-lifecycle-model-inventory.md`

## 1. Decisao registrada nesta rodada

A mantenedora escolheu a **Opcao A** para o PR #44:

> PR #44 fecha a decisao de modelo + inventario.

Isso significa que o PR #44 deve entregar uma decisao clara sobre como o framework
modela no, checkpoint e PR, alem de um inventario robusto do ciclo ponta a ponta.
Ele nao deve tentar absorver toda a refatoracao arquitetural, a falsificacao ampla
ou a implementacao final do runtime unificado.

O inventario passa a ser a saida principal de analise do PR #44. O mapa visual e
uma projecao humana dessa decisao, nao a fonte de verdade.

## 2. Problema observado

Durante a Spec 0024, a nomenclatura `CO-10.8.*` passou a representar sub-sub
checkpoints. Isso ajudou localmente, mas deixou o sistema estranho para humanos:

- fica dificil entender se `CO-10.8.1` e um checkpoint real ou uma tarefa interna;
- fica dificil saber se o PR fecha um checkpoint, varios checkpoints ou apenas uma
  fatia dentro de um checkpoint;
- mapas, handoffs e revisoes passam a depender de convencao textual, nao de um
  modelo claro;
- o PR vira um lugar onde varias frentes competem por significado.

A conclusao desta rodada e que precisamos separar tres conceitos:

1. **No topologico**: unidade estrutural ordenada em `state.yml § topology`.
2. **Checkpoint**: unidade governada de entrega, com criterio de saida humano.
3. **PR**: container de revisao e integracao, que pode agrupar trabalho coeso,
   mas nao e a fonte de verdade da topologia.

## 3. Modelo proposto

```text
state.yml § topology
  define a ordem dos nos

checkpoint
  define a entrega governada dentro de um no

PR
  agrupa um ou mais checkpoints pequenos e coesos para revisao
```

Regras candidatas:

- Um PR pode conter mais de um checkpoint quando eles forem pequenos, coesos e
  revisaveis juntos.
- Um checkpoint nao deveria atravessar varios PRs. Se isso acontecer, e sinal de
  que o checkpoint esta grande demais e deve ser quebrado.
- Checkpoints devem ter nomes semanticos, nao numeracao decimal artificial como
  `CO-10.8.1`.
- O PR pode ser Draft enquanto o checkpoint esta em desenvolvimento.
- Ready/Human Gate deve decidir a entrega governada, nao apenas "o PR esta verde".
- O mapa visual deve projetar esse modelo; ele nao deve virar uma nova fonte de
  verdade.

## 4. Como isso ficaria a partir do PR #44

O `assets/spec-0024-map-v2.html` modela visualmente a Spec 0024 a partir do PR #44
assim:

- PR #43: fecha o recorte `co-flow-convergence` ate CO-10.7.
- PR #44: fecha drift + decisao de modelo + inventario.
- Proximos PRs/checkpoints: confronto modelo x codigo, refatoracao do lifecycle,
  BDD visual para mantenedores, falsificacao ampla, revisao externa e Human Gate.

Essa divisao evita um PR gigante e evita empurrar tudo para sub-sub checkpoints.

## 5. Mapa da spec como projecao, nao como SSOT

O mapa se mostrou muito util para acompanhamento humano. A decisao de produto
candidata e transformar esse tipo de mapa em uma **projecao oficial**, derivada
de fontes governadas.

Fluxo desejado:

```text
state.yml / tasks.md / decisions / reviews / gates / PR GitHub / CI
        ↓
SpecMapViewModel gerado
        ↓
HTML visual / JSON / site / futura API
```

Fluxo proibido:

```text
mapa editado manualmente
        ↓
estado governado
```

O mapa deve ajudar humanos e liderancas a entenderem o andamento, mas nao deve
ser usado como fonte para alterar topologia, readiness, gate ou tarefas.

## 6. De-para de fontes para o mapa

| Fonte                  | Informacao                            | Projecao no mapa        |
| ---------------------- | ------------------------------------- | ----------------------- |
| `state.yml § topology` | nos, ordem, cursor, proximo no        | timeline estrutural     |
| `tasks.md`             | checkpoints, status, recorte ativo    | blocos de entrega       |
| `decision-brief.md`    | decisoes e rationale                  | decisoes relacionadas   |
| reviews/gates          | TA/AR/Security/Human Gate             | gates por checkpoint/PR |
| GitHub PR              | Draft/Ready, branch, base, checks     | camada de revisao       |
| CI/checks              | verde/falha/pendente                  | saude operacional       |
| Governance Doctor      | drift detectado, explicado, reparavel | alertas do mapa         |
| `assets/`              | imagens e prompts visuais             | apoio visual versionado |
| `research/`            | evidencias, auditorias, dogfood       | links de contexto       |

## 7. Caminho tecnico recomendado

Antes de uma API dinamica, o caminho mais seguro e criar uma projecao estatica
e verificavel:

```text
src/cli/spec-map/
  buildSpecMapViewModel.ts
  specMapSchema.ts
  renderSpecMapHtml.ts
```

Saidas candidatas:

```text
.governance/specs/0024-context-architecture/generated/spec-map.json
.governance/specs/0024-context-architecture/assets/spec-0024-map.html
```

Scripts candidatos:

```text
npm run spec-map:sync -- 0024
npm run spec-map:check -- 0024
```

Isso permitiria:

- mapa sempre regeneravel;
- teste de drift;
- HTML visual para humanos;
- JSON consumivel pelo site;
- futura API sem reinventar o modelo.

## 8. Tres niveis de atualizacao em tempo real

A mantenedora gostou da ideia de evoluir em tres niveis:

### Nivel 1 — Quase real-time por push

GitHub Actions/CI regenera `spec-map.json` e `spec-map.html` a cada push.

Vantagens:

- simples;
- versionavel;
- auditavel;
- compativel com o modelo repo-first.

Limite:

- nao reflete mudancas ate haver novo push.

### Nivel 2 — Site lendo JSON publicado

Cloudflare Pages ou o site estatico leem o JSON gerado e exibem mapas navegaveis
para varias specs.

Vantagens:

- bom para times e liderancas;
- dispensa abrir arquivos locais;
- preserva SSOT no repo.

Limite:

- ainda depende do ciclo de build/publicacao.

### Nivel 3 — API/Worker com dados vivos

Uma API consulta o repo e GitHub para expor estado quase em tempo real:

```text
GET /api/specs
GET /api/specs/0024/map
GET /api/specs/0024/prs
GET /api/specs/0024/drifts
```

Vantagens:

- melhor visibilidade operacional;
- permite dashboards;
- pode exibir checks/PRs mais recentes.

Limites:

- exige autenticacao/limites de API;
- precisa manter a regra: API expõe, mas nao vira SSOT;
- qualquer escrita continua governada por comandos/decisoes humanas.

## 9. Imagens e prompts no mapa

Outro ponto de produto identificado nesta rodada: hoje existem prompts de geracao
de imagens em PRs e conversas, mas eles nao estao conectados ao mapa.

Se o mapa se mostrar util, podemos projetar tambem uma secao visual por checkpoint
ou PR:

- prompt sugerido para gerar imagem/infografico;
- imagem versionada em `assets/`, quando existir;
- status da imagem: `sem imagem`, `prompt pronto`, `imagem gerada`, `imagem revisada`;
- origem: gerada por LLM, criada manualmente ou colada pelo humano;
- links para arquivos em `assets/`.

Fluxo desejado:

```text
checkpoint / PR / decisao
        ↓
prompt visual versionado
        ↓
imagem opcional em assets/
        ↓
mapa renderiza imagem ou prompt
```

Regras candidatas:

- O prompt pode aparecer no mapa mesmo sem imagem ainda.
- Se a LLM auxiliar tiver capacidade de gerar imagem, ela pode usar o prompt.
- Se nao tiver, o humano pode gerar fora e colar em `assets/`.
- A imagem e apoio visual; ela nao substitui estado, tarefas, reviews ou gates.
- Prompts e imagens devem ser versionados quando forem usados para comunicar o
  andamento de um PR grande.

## 10. Decisoes ainda pendentes

Antes de transformar isso em implementacao estrutural, ainda precisamos decidir:

1. O mapa passa a ser artefato recomendado para todo PR grande ou so para specs
   complexas?
2. O primeiro gerador deve cobrir apenas a Spec 0024 ou ser generico desde o
   inicio?
3. O HTML deve continuar versionado em `assets/` ou ser sempre gerado em
   `generated/` e publicado no site?
4. Os prompts de imagem devem morar no proprio modelo do mapa, em `research/`, ou
   em um novo catalogo visual?
5. A API deve ficar para um no futuro (`co-events`/dashboard) ou ja deve entrar no
   backlog da continuacao?

## 11. Recomendacao atual

Para o PR #44:

- manter `spec-0024-map-v2.html` como prototipo visual;
- registrar a Opcao A como decisao de recorte;
- usar o inventario de lifecycle para definir os proximos checkpoints sem
  `CO-10.8.*`;
- nao implementar a API agora;
- registrar o mapa gerado e os prompts visuais como candidatos fortes de produto.

Para o proximo ciclo:

- criar `SpecMapViewModel`;
- gerar `spec-map.json` e HTML a partir das fontes governadas;
- adicionar `spec-map:sync` e `spec-map:check`;
- depois avaliar publicacao no site e API.

## 12. Revisao de falsificacao relacionada

Este modelo foi submetido a uma revisao de falsificacao pre-implementacao em
`research/2026-06-22-checkpoint-co-flow-continuation-spec-map-falsification-review.md`.

A revisao e narrativa de apoio, nao autoridade. Ela apontou que o modelo conceitual
e promissor, mas ainda nao pode liderar a topologia: antes de usar o mapa como base
dos proximos PRs, a decisao precisa ser registrada em DEC e reconciliada com
`state.yml`, `tasks.md`, `next` e o body do PR #44.
