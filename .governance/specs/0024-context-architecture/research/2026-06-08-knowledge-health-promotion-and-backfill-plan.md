# CO-2.1 — Knowledge Health, criterios de promocao e plano de backfill amplo

> Status: plano arquitetural do PR #37. Este artefato responde aos limites reais
> do CO-2/CO-2.1 sem transformar julgamento semantico em runtime mecanico.
> Atualizacao CO-2.2: `script-contracts` foi antecipado para o PR #37 como
> `checkpoint-script-contracts`; `knowledge-readiness` passa a consumi-lo como
> capacidade ja materializada, nao como no futuro.
>
> Autoridade: `state.yml § topology` vence este documento quando houver divergencia.

## 1. Problema

O CO-2 materializou `Falsification`, `GovernedRef`, arestas negativas e o inventario
minimo. O CO-2.1 provou adocao minima com 14 entradas e `RulesCatalog` projetado como
Knowledge. Ainda restam tres fronteiras que precisam ficar governadas:

1. F4b semantico nao e enforcement mecanico.
2. `co-knowledge:check` e advisory-first.
3. O backfill historico amplo ainda nao existe.

## 2. Decisao — criar um momento de Knowledge Health

Nao devemos esperar que o humano perceba duplicatas semanticas sozinho. Tambem nao
devemos colocar LLM no runtime para decidir equivalencia. A fronteira correta e:

- runtime deterministico coleta sinais e monta um dossie;
- IA atua como canal de sintese/adversarial review sobre esse dossie;
- humano decide no Gate se ha duplicata, supersessao, reabertura legitima ou nada a fazer.

Nome operacional proposto para o no final: `knowledge-readiness`.

Comando/ritual alvo:

- `knowledge:health` ou equivalente: gera um dossie local, reconstruivel e versionavel
  sobre a saude dos nos Knowledge.
- O comando nao chama LLM. Ele deve emitir dados + prompt de revisao assistida para o
  canal de IA.
- A IA sugere candidatos; ela nao sela estado.

Sinais que o dossie deve cobrir:

- possiveis duplicatas semanticas entre `claim` de `Falsification`;
- possiveis duplicatas semanticas entre novas decisions/ADRs/rules e claims falsificadas;
- refs orfas ou nao materializadas que deveriam estar no backfill final;
- nos planejados com deadline vencido ou ausente;
- clusters desconectados relevantes para retomada;
- divergencias entre `AGENTS.md` como projecao e `RulesCatalog` como fonte;
- candidatos a `supersedes`/`equivalent_to` decididos por humano.

## 3. Criterios de promocao do `co-knowledge:check`

### 3.1 Separar integridade estrutural de julgamento de ciclo de vida

Promocao nao deve ser "tudo ou nada". O caminho recomendado e separar:

- `co-knowledge:integrity` required: schema, parser, F1, F2, F3, fingerprint e forma
  dos refs. Isto bloqueia apenas fatos primarios malformados ou adulterados.
- `co-knowledge:check` advisory: F4a por ref e sinais de reabertura, ate que o dominio
  tenha status suficiente para todos os tipos de Knowledge.
- F4b: nunca vira enforcement mecanico; entra em `knowledge:health` como revisao
  assistida por IA + decisao humana.

### 3.2 Criterios minimos para promover integridade a required

Promover a parte estrutural para required somente quando todos os criterios forem
verdadeiros:

1. **Determinismo:** usa apenas arquivos do repo; sem rede, sem tempo corrente, sem LLM.
2. **Escopo bloqueante estreito:** bloqueia apenas erro de forma, tamper-evidence,
   fingerprint divergente, ref malformado, campos obrigatorios vazios.
3. **Mensagem acionavel:** toda falha aponta arquivo, id e acao esperada.
4. **Evidencia de uso:** passou em pelo menos dois ciclos governados consecutivos ou no
   ciclo final `knowledge-readiness` sem falso positivo registrado.
5. **Fixture de regressao:** cada classe bloqueante tem teste com caso vermelho e caso
   verde.
6. **Human Gate explicito:** a owner aprova a promocao como mudanca de lifecycle, nao
   como detalhe tecnico.

### 3.3 Criterios para promover F4a

F4a por ref so deve virar required se, alem dos criterios acima:

1. houver fonte de status suficiente para todos os tipos materializados (`insight`,
   `decision`, `rule`, `guardrail`, `doctrine`) ou uma regra explicitamente limitada;
2. o falso positivo "reabertura legitima com supersessao" estiver modelado;
3. existir relacao humana de resolucao (`supersedes`, `equivalent_to`, `reopened_as` ou
   equivalente) para desbloquear casos legitimos.

Enquanto isso nao existir, F4a permanece advisory.

## 4. Plano de backfill amplo

O backfill amplo nao entra como implementacao no PR #37. Ele passa a ser condicao
governada para o no final antes do PR de integracao.

No planejado: `knowledge-readiness`.

Posicao: ultimo no de execucao da Spec 0024, imediatamente antes de `integration-final`.

Objetivo:

- converter o inventario minimo em cobertura operacional ampla;
- rodar `knowledge:health`;
- decidir a promocao de checks;
- deixar o grafo pronto para o PR de integracao.

### 4.1 Escopo P0

Obrigatorio antes de `integration-final`:

- todas as DECs da Spec 0024 que sustentam topologia, gates, CO e stack;
- ADRs load-bearing para a Spec 0024: ADR 0018, 0020, 0021, 0022, 0025, 0026 e outras
  referenciadas por gates ativos;
- todas as `Falsification` existentes em `.governance/runtime/falsifications/ledger.yml`;
- todos os `PIT-*` usados por CO-1/CO-2 e por retomada operacional;
- regras required/runtime que aparecem em `validate`, PR workflow e `<AI_GUIDELINES>`;
- guardrails que bloqueiam ou condicionam merge/gate.

### 4.2 Escopo P1

Desejavel antes de `integration-final`, salvo justificativa explicita:

- demais ADRs em `.core/governance/adrs/`;
- demais DECs da 0024 que nao sejam P0;
- regras `CORE-*`, `GR-*`, `OPT-*`, `ADP-*` do `RulesCatalog`;
- guardrails planejados com deadline dentro da 0024.

### 4.3 Escopo P2

Pode ficar fora da 0024 com justificativa:

- historico legado sob `.specify/` sem carga operacional na stack atual;
- documentos de pesquisa antigos sem aresta ativa para decisao, regra, gate ou falsificacao;
- artefatos que seriam melhor tratados apos `dualroot-collapse`.

### 4.4 Criterios de saida do no `knowledge-readiness`

O no final so fecha quando:

1. `knowledge-backfill.yml` ou sucessor cobre P0 integralmente.
2. Todo item P1 esta `done`, `planned` com deadline, ou `not_applicable` com rationale.
3. `knowledge:health` gerou dossie e prompt de revisao assistida.
4. O Human Gate decidiu os candidatos de duplicata/supersessao P0.
5. A promocao de `co-knowledge:integrity` foi aprovada ou explicitamente rejeitada com
   rationale.
6. Nenhum banco externo foi adotado como SSOT. Se houver Neo4j ou outro graph store, e
   somente projecao derivada reconstruivel.

## 5. Nao objetivos

- Nao colocar LLM no runtime.
- Nao bloquear build por equivalencia semantica.
- Nao adotar banco externo como fonte primaria.
- Nao migrar cegamente todo historico sem prioridade.
- Nao reabrir `script-contracts` como no independente: contrato de scripts foi absorvido
  no PR #37; o no final apenas usa essa capacidade como insumo de saude operacional.
