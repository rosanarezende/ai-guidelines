---
artifact-kind: decision-brief
---

# Rodada de decisao do produto visual

> **Status:** rodada aberta.
> **Data:** 2026-07-07.
> **Escopo:** produto visual que nasceu como `governance-demo`.
> **Autoridade:** organiza a proxima sequencia de QRDs; nao substitui
> [`APP-DECISIONS.md`](APP-DECISIONS.md), [`PRODUCT-TOPOLOGY.md`](PRODUCT-TOPOLOGY.md)
> nem [`APP-ITERATION-MAP.md`](APP-ITERATION-MAP.md).

## 1. Por que esta rodada existe

O app deixou de ser apenas uma demo tecnica dentro da Spec 0024. Ele virou uma
superficie humana de produto: portal, login passwordless, workspaces, convites,
governance host Git-backed, onboarding, configuracoes, resultados, mapas,
integracoes e Cup.

Isso cria uma divergencia importante:

- o runtime da Spec 0024 ainda projeta readiness do checkpoint de taxonomia;
- a owner decidiu que o app ainda nao foi validado como produto;
- continuar criando telas grandes sem decidir nome, distribuicao desktop,
  extracao, GitHub host e politica do portal aumenta retrabalho.

Portanto, esta rodada pausa novas grandes telas e organiza as decisoes que
precisam ser fechadas antes de continuar a v1 do produto visual.

## 2. Fatos ja decididos

- O produto visual usa arquitetura hibrida: portal para contas/convites e
  governance host Git-backed para a governanca real.
- O portal nao guarda governanca autoritativa.
- O produto nao deve guardar senhas de usuarios finais.
- O caminho humano de entrada e passwordless: magic link e providers quando
  configurados.
- Demo anonima deve existir sem criar conta de portal nem authority governada.
- GitHub e o primeiro provider real para governance host e fontes versionadas.
- Neo4j deve existir como read-model opcional real, nao como store transacional
  do portal.
- O app visual deve virar produto proprio, separado conceitualmente da CLI
  `ai-guidelines`.
- QRD-52 mudou a direcao da v1 para desktop local-first; portal continua
  complementar para colaboracao e pessoas nao tecnicas.

## 3. Ordem de decisao

### 3.1 Nome publico e identidade do produto

**Pergunta:** qual sera o nome publico candidato do produto visual e quais
criterios ele precisa cumprir antes de virar repo/package/site?

**Por que vem primeiro:** nome afeta repositorio, pacote, dominio, docs, marca,
comunidade, exemplos, screenshots e narrativa open-source.

**Saida esperada:** criterio de escolha, shortlist, verificacoes obrigatorias
e regra para quando o nome vira "bom o bastante" para cortar repo.

**Criterios ja aprovados:** QRD-47 decidiu os criterios antes da shortlist. O
nome deve diferenciar o produto visual de `ai-guidelines`, comunicar governanca
sem burocracia, funcionar para pessoas nao tecnicas, nao prometer autonomia de
IA, ser adequado para open-source, ser internacionalizavel, extensivel,
verificavel em disponibilidade, nao generico demais e coerente com a arquitetura
hibrida portal + governance host Git-backed.

**Entradas coletadas:** as respostas iniciais de Codex, Gemini 3.1 Pro e Claude
Opus 4.8 estao registradas em
[`PRODUCT-NAMING-CANDIDATES.md`](PRODUCT-NAMING-CANDIDATES.md). A proxima etapa
e comparar os candidatos contra os criterios da QRD-47.

**Filtro aplicado:** o primeiro tier semantico e Guilda, Nodus, Lumina,
Contexta, Pacta, Tessera, Trellis e Vento. Guilda, Nodus e Lumina receberam
sinal positivo inicial da owner e devem ser comparados com narrativa mais
profunda; a checagem factual inicial foi feita primeiro nesses tres nomes.

**Checagem factual inicial:** Guilda permanece como melhor dos tres nomes
destacados, mas precisa de variacao composta porque o nome curto tem GitHub e
dominios ocupados. Nodus e Lumina foram rebaixados para nome principal por
colisoes fortes em pacotes/ecossistemas proximos.

**Hipotese de marca:** a direcao provisoria e Guilda como guarda-chuva, Guilda
Governance como app/produto visual, `guilda flow` como CLI publica futura,
Guilda Workgraph como modelo tecnico, Guilda Host como governance host, Guilda
Cup como assistente contextual e `ai-guidelines` como engine/core repo-first ate
decisao posterior. A proxima checagem deve testar nomes compostos, nao apenas
`Guilda` isolado.

**Direcao visual candidata:** rodada visual em 2026-07-08 consolidou a
candidata principal como um workgraph humano, nao um monograma literal: decisao
humana central, areas de trabalho, contexto/evidencia, politicas/guardrails,
responsabilidades e fluxo externo para repositorios, integracoes e governance
host. A frase guia e "Pessoas decidem. O sistema apoia." O registro completo
esta em [`PRODUCT-BRAND-DIRECTION.md`](PRODUCT-BRAND-DIRECTION.md).

**Checagem de compostos:** nomes como `guilda-governance`, `guilda-flow`,
`guilda-workgraph`, `guilda-host`, `guilda-cup` e `use-guilda` nao apareceram
em npm/PyPI/GitHub exato na checagem preliminar. O risco principal segue sendo
juridico/comercial: existe **GUILDA Cyber Solutions** em setor proximo
(cybersecurity/compliance/governance), entao o nome continua candidato, nao
decisao final.

### 3.2 Distribuicao desktop local-first

**Pergunta:** como o produto sera distribuido para o caso fundador de dev
solo/local que trabalha com varios repos, sem depender de portal publico?

**Por que vem antes de novas telas:** se a superficie principal for desktop,
as telas de onboarding, sources, workspace e host precisam conhecer filesystem,
Git local, SQLite local, permissoes do shell e sincronizacao com GitHub.

**Saida esperada:** spike S2b/S2c com bancada desktop-local, decisao Tauri/Rust
vs Electron, contrato de dialogo de pasta, indice local, empacotamento minimo e
fronteira com web/portal.

**Estado atual:** QRD-52 decidiu a direcao e
[`SPIKE-DESKTOP-LOCAL-FIRST.md`](SPIKE-DESKTOP-LOCAL-FIRST.md) documenta a
primeira prova. O backend ja prova filesystem/Git/host/SQLite em
`backend/tests/desktop-local-spike.test.ts`.

### 3.3 Extracao para repo irmao

**Pergunta:** o produto visual sai da Spec 0024 diretamente para um repo irmao?
O que fica em `ai-guidelines` e o que passa a viver no novo repo?

**Por que vem antes de novas telas:** cada nova tela aumenta o custo de mover
paths, workspaces, CI, docs, imports e checks.

**Saida esperada:** plano de corte, paths de origem/destino, criterio de
preservacao de historico, checks minimos no repo novo e contrato de consumo do
`ai-guidelines`.

**Decisao atual:** sim, o produto vivo deve ir para um repo irmao antes da
proxima grande leva de implementacao. A decisao foi registrada na QRD-53 e o
protocolo operacional esta em
[`PRODUCT-EXTRACTION-PLAN.md`](PRODUCT-EXTRACTION-PLAN.md).

**Regra pratica:** este repo mantem a historia da Spec 0024; o repo novo passa
a conter a v1 viva do produto visual/desktop. Enquanto o corte nao acontecer,
novas implementacoes estruturais devem ser limitadas a preparacao de extracao,
spikes isolados ou correcoes pequenas.

### 3.4 Governance host GitHub

**Pergunta:** como o portal cria, vincula, le e escreve em um governance host no
GitHub sem virar segundo SSOT?

**Por que vem antes de finalizar onboarding/configuracoes:** onboarding e
settings precisam explicar onde a governanca mora e quais permissoes sao
necessarias.

**Saida esperada:** contrato de GitHub provider: repo dedicado vs embutido,
permissoes, commit/PR, `sourceRevision`, conflito/stale, audit trail e modo
read-only quando a permissao nao basta.

### 3.5 Politica do portal

**Pergunta:** quais dados o portal pode guardar, por quanto tempo, como entrega
magic link, e quais eventos de jornada podem ser medidos?

**Por que vem antes de deploy publico:** o portal guarda contas, convites e
memberships. Mesmo sem guardar governanca, isso exige politica minima.

**Saida esperada:** politica de dados, e-mail/magic-link provider,
analytics/growth minimizado, redacao de secrets, retencao e modo self-hosted.

### 3.6 Dogfood da plataforma

**Pergunta:** como a propria plataforma sera governada usando o produto visual?

**Por que vem antes de v1:** o dogfood precisa provar o modelo real: `ai-guidelines`
e o repo do produto visual governados por um governance host da plataforma.

**Saida esperada:** topologia de repos, workspace da plataforma, roles iniciais,
governance host, fontes de trabalho e criterio de "dogfood suficiente".

## 4. O que fica explicitamente fora desta rodada

- Declarar readiness do app.
- Exercer Human Gate.
- Converter o PR para Ready.
- Fazer merge.
- Construir novas telas grandes antes de fechar as decisoes acima.
- Tratar hospedagem do portal como pre-requisito para o caso desktop local.
- Transformar portal membership em authority governada.
- Fazer do banco do portal um segundo SSOT.

## 5. Criterio de saida da rodada

A rodada termina quando houver QRDs fechadas ou dispositionadas para:

1. nome publico candidato;
2. contrato de distribuicao desktop local-first;
3. plano de extracao para repo irmao;
4. contrato inicial do GitHub governance host;
5. politica minima do portal;
6. topologia de dogfood da plataforma.

Enquanto isso nao estiver resolvido, implementacoes devem ser limitadas a:

- testes e contratos;
- documentacao;
- correcoes pequenas;
- spikes isolados;
- ajustes que reduzem risco da extracao.
