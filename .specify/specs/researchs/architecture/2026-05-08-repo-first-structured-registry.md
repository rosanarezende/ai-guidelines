# Research: Repo-First com Registro Estruturado, Markdown Derivado e Projeções

**Data:** 2026-05-08
**Domínio:** Arquitetura de Estado do Framework
**Relacionado a:** Spec 0021 (`governance-information-architecture`), `framework-observability-dashboard`, `process-automations`

## 0. Leitura prescritiva para a Spec 0021

Este research **não é só brainstorming**. Ele registra uma direção arquitetural preferencial já debatida e deve ser lido como _guia de implementação_ para reduzir ambiguidade em sessões futuras.

### 0.1 Tese central

O framework **não deve** escolher entre:

- Markdown puro narrativo; ou
- banco de dados como fonte primária.

A direção preferencial aprovada nesta sessão é:

> **repo-first híbrido** = **registro estruturado versionado no repositório** como fonte primária + **visões Markdown derivadas** para humanos/IA + **projeções futuras** (ex.: SQLite, dashboard) como derivados, nunca como verdade inicial.

### 0.2 Interpretação correta para quem implementar sem contexto prévio

Se uma LLM futura tiver de abrir a Spec 0021 sem conhecer esta conversa, ela deve assumir:

1. **Não substituir o Git/repositório por banco como truth source.**
2. **Não manter `backlog.md`/`historico.md` como único storage manual de estado.**
3. **Sim introduzir um registro estruturado canônico dentro do repo.**
4. **Sim gerar Markdown derivado a partir desse registro.**
5. **A 0021 deve atacar Fases 1–3 agora e apenas mapear Fases 4–5.**

### 0.3 Anti-objetivos explícitos

A 0021 **não deve**:

- introduzir Postgres, Supabase, SQLite ou qualquer banco como fonte primária;
- depender de serviço externo para que backlog/histórico existam;
- tentar resolver, no mesmo movimento, todos os comandos de produto (`config`, `intake`, `spec init`, `status`);
- reescrever todo o passado do repositório para o novo modelo antes de provar o fluxo mínimo;
- degradar a legibilidade do estado para contribuidores humanos ou agentes que só operam sobre arquivos.

## 1. Problema

O framework precisa capturar e transformar em valor múltiplas classes de entrada:

- PRDs/intakes;
- incidentes reais;
- friction reports;
- entregas `no-spec`;
- specs formais;
- histórico de valor entregue.

Hoje, `backlog.md` e `historico.md` cumprem bem o papel de memória humana e contexto para IA, mas começam a sofrer em três dimensões:

1. **referenciabilidade cruzada** — relacionar PRD -> incidente -> spec -> entrega exige convenções textuais frágeis;
2. **queryabilidade** — métricas, filtros, status e dashboards futuros dependem de parsing de Markdown livre;
3. **granularidade de fluxo** — o sistema ainda está muito centrado em specs; entradas sem spec viram notas úteis, mas não um pipeline de valor tipado.

## 2. Decisão arquitetural preferencial

### 2.1 Veredito

Entre as opções discutidas, a preferência registrada aqui é:

- **Fonte primária:** arquivos estruturados versionados no repositório.
- **Superfície narrativa e de consulta humana/IA:** Markdown derivado.
- **Superfície operacional avançada futura:** projeções locais ou web.

Em outras palavras:

- **não**: banco primário + Markdown espelho;
- **não**: Markdown livre como único storage;
- **sim**: registry estruturado no repo + artefatos derivados.

### 2.2 Motivo do veredito

Esse desenho preserva simultaneamente:

- auditabilidade por PR/Git;
- portabilidade OSS;
- usabilidade para agentes de IA;
- base sólida para dashboards, métricas e queries futuras.

## 3. Tensão arquitetural

Há duas direções possíveis:

### Opção A — banco de dados como fonte primária

Prós:

- queries, filtros e dashboards ficam naturais;
- tipagem forte do estado desde cedo;
- facilita produtos futuros (`status`, dashboards, relatórios).

Contras:

- enfraquece o princípio `repo-first`;
- revisão por PR piora (diff semântico sai do Git);
- aumenta custo operacional (schema, migração, export/import, sync);
- reduz portabilidade para consumidores OSS e agentes que operam só sobre arquivos.

### Opção B — Markdown puro como fonte primária permanente

Prós:

- máxima legibilidade humana;
- excelente portabilidade;
- alinhamento total com Git e revisão textual.

Contras:

- escala mal para relacionamentos e métricas;
- força parsers frágeis sobre texto narrativo;
- dificulta representar artefatos não-spec como entidades de primeira classe.

## 4. Recomendação

Adotar um modelo **híbrido repo-first**:

1. **Fonte canônica permanece no repositório**.
2. **O estado estruturado vira artefato versionado**, não banco externo.
3. **Markdown vira visão derivada/navegável**, não único lugar onde a estrutura vive.
4. **Banco local (ex.: SQLite) entra depois como projeção derivada**, nunca como verdade primária inicial.

Resumo:

> **repo como source of truth + registro estruturado versionado + Markdown derivado + projeções futuras**

## 5. Invariantes da solução

As seguintes invariantes devem sobreviver à 0021:

1. **O repositório continua sendo a memória canônica.**
2. **Todo artefato relevante de origem é referenciável por ID estável.**
3. **Nem toda origem gera spec, mas toda origem pode ser conectada ao fluxo de valor.**
4. **`backlog.md` e `historico.md` continuam existindo como superfícies legíveis.**
5. **Qualquer projeção futura pode ser descartada e reconstruída a partir do repo.**

Se uma proposta violar qualquer uma dessas invariantes, ela está saindo da direção decidida aqui.

## 6. Modelo conceitual sugerido

### 6.1 Classes de artefato

O sistema deve reconhecer explicitamente tipos como:

- `prd`
- `incident`
- `friction`
- `note`
- `spec`
- `delivery`
- `adr`

Nem todo artefato gera spec, mas todo artefato deve ser:

- **identificável**
- **referenciável**
- **promovível** (quando aplicável)

### 6.2 Interpretação operacional dos tipos

- `prd`: demanda de negócio/produto; **deve** poder virar candidata a spec.
- `incident`: problema real observado em uso; pode virar entrega `no-spec`, ADR ou spec.
- `friction`: incoerência de governança/processo/uso; pode gerar docs, ADR ou spec.
- `note`: insight operacional ou pré-spec; útil para não perder contexto, mas com menor força de promoção.
- `spec`: artefato formal de execução estruturada.
- `delivery`: saída concreta entregue ao repositório, com ou sem spec.
- `adr`: decisão arquitetural formal.

### 6.3 Relações esperadas

Relações que o modelo precisa suportar:

- `prd -> spec`
- `incident -> no-spec delivery`
- `incident -> spec`
- `friction -> adr`
- `friction -> spec`
- `spec -> delivery`
- `delivery -> source_refs[]`

### 6.4 Regras de promoção e resolução

As regras abaixo devem orientar a implementação:

- `prd` **sempre** entra no fluxo de valor como artefato canônico.
- `prd` **não precisa** abrir spec imediatamente, mas **deve** conseguir gerar candidata no backlog.
- `incident` e `friction` podem ser resolvidos sem spec, mas **não podem** virar conhecimento solto.
- `no-spec` é um **modo de resolução**, não um tipo de origem.
- `delivery` deve conseguir apontar para múltiplas origens (`source_refs`).

### 6.5 Campos mínimos

Campos mínimos sugeridos para o registro estruturado:

- `id`
- `type`
- `title`
- `status`
- `source_refs`
- `resolution_mode`
- `promoted_to_spec`
- `value_status`
- `created_at`
- `updated_at`

Campos adicionais podem surgir por tipo (`severity` para incidentes, `audience` para PRDs, etc.), mas isso já permite backlog, histórico e rastreabilidade.

### 6.6 Campos fortemente recomendados

Para reduzir retrabalho futuro, a 0021 deveria avaliar já no Stage 1 a inclusão de:

- `owner`
- `labels`
- `tracker`
- `linked_prs`
- `linked_adrs`
- `closed_at`
- `resolution_summary`

### 6.7 Exemplo ilustrativo de entidade

O formato final pode ser YAML, JSON ou JSONC. O importante é preservar estrutura estável. Exemplo ilustrativo:

```yaml
id: INC-0007
type: incident
title: "Bootstrap de consumo real lento e encerramento estranho no repo site"
status: observed
value_status: triaged
resolution_mode: pending
source_refs: []
promoted_to_spec: null
created_at: 2026-05-08
updated_at: 2026-05-08
labels:
  - consumer
  - onboarding
  - cli
tracker: null
resolution_summary: null
```

Se esse incidente virar spec:

```yaml
promoted_to_spec: 0021
status: promoted
value_status: in-progress
```

### 6.8 Exemplo ilustrativo de delivery sem spec

```yaml
id: DEL-0012
type: delivery
title: "Registro do incidente de bootstrap do consumidor no backlog e research"
status: delivered
value_status: delivered
resolution_mode: no-spec
source_refs:
  - INC-0007
created_at: 2026-05-08
updated_at: 2026-05-08
linked_prs:
  - PR-XYZ
resolution_summary: "Documentação e triagem inicial sem alterar contrato do framework."
```

Esses exemplos **não** congelam o schema final, mas deixam claro o nível de estrutura esperado.

## 7. Papel do Markdown derivado

`backlog.md` e `historico.md` não devem desaparecer. O papel deles muda:

- **antes:** storage narrativo primário;
- **depois:** índice derivado, legível, curado, resumido.

### 7.1 O que o Markdown ainda deve fazer

- permitir leitura rápida por humano;
- servir de contexto acessível para agentes;
- mostrar prioridade, estado e relações principais;
- funcionar como fallback legível mesmo sem tooling.

### 7.2 O que o Markdown não deve mais concentrar sozinho

- todos os metadados relacionais;
- a verdade única sobre status;
- vínculos complexos entre origem, spec, ADR e entrega;
- métricas e consultas estruturadas.

### 7.3 Regra prática para a 0021

Se uma informação é:

- narrativa, resumo ou priorização humana -> pode viver na visão Markdown;
- status canônico, vínculo, ID, tipo ou relacionamento -> deve viver no registro estruturado.

## 8. Estrutura de diretórios: decisão ainda em aberto, mas com limites

A 0021 ainda pode escolher o path final do registry, mas **não** deve escolher algo que:

- fique fora do repositório;
- misture estado canônico com docs livres sem fronteira;
- exija banco para existir.

Direções aceitáveis para análise:

- `.specify/registry/`
- `.specify/state/`
- outro diretório equivalente **dentro do repo**

Direções não aceitáveis:

- banco local como storage único;
- serviço externo como storage único;
- manter tudo apenas em `backlog.md`/`historico.md`.

## 9. Fases de adoção

### Fase 1 — contrato canônico

Definir:

- taxonomia de artefatos;
- relações;
- campos mínimos;
- diferença entre `sdd_dir` e eventual `spec_workspace_dir`;
- o que continua manual vs o que passa a ser derivado.

**Entrega mínima esperada da Fase 1:**

- taxonomia cravada;
- relações mínimas cravadas;
- campos obrigatórios e opcionais separados;
- decisão explícita sobre fonte primária;
- decisão explícita sobre o papel do Markdown;
- decisão explícita sobre o path canônico do registry.

### Fase 2 — registro estruturado no repo

Introduzir diretório(s) estruturados versionados, por exemplo:

- `.specify/registry/`
- ou equivalente decidido na Spec 0021.

Ainda não há banco local. Só arquivos estruturados canônicos.

**Entrega mínima esperada da Fase 2:**

- registry introduzido no repo;
- pelo menos um subconjunto real migrado para provar o modelo;
- política de IDs estáveis documentada;
- relação entre artefatos de origem e specs/deliveries comprovada com dados reais.

### Fase 3 — visões derivadas mínimas

Gerar a partir do registro estruturado:

- `backlog.md`
- `historico.md`
- `status.json`

Isso mantém a experiência humana/IA simples, mas com base estrutural estável.

**Entrega mínima esperada da Fase 3:**

- `backlog.md` derivado do registry;
- `historico.md` derivado do registry;
- `status.json` avaliado como opcional, mas preferível se o custo for baixo;
- regra clara sobre quais campos aparecem na visão resumida vs completa.

### Fase 4 — projeção local para consulta

Introduzir **SQLite local-first** como projeção derivada:

- queries rápidas;
- dashboards;
- filtros avançados;
- suporte ao comando `status`.

### Fase 5 — superfície de produto

Possíveis evoluções:

- dashboard web;
- backend local/hosted;
- observabilidade e analytics;
- integração com sistemas corporativos.

## 10. Sequência de migração recomendada

Para evitar que uma LLM futura tente um big-bang desnecessário:

1. definir schema e regras;
2. criar registry canônico vazio;
3. migrar primeiro um conjunto pequeno e representativo;
4. derivar `backlog.md` e `historico.md`;
5. só depois avaliar retro-migração adicional.

### 10.1 Conjunto mínimo recomendado para prova inicial

O primeiro lote de migração deveria cobrir pelo menos:

- uma candidata de spec;
- um incidente/fricção real;
- uma entrega `no-spec` ou docs-only;
- uma spec concluída;
- uma relação de promoção ou vínculo cruzado.

Isso força o modelo a provar que não está centrado apenas em specs.

## 11. Consequências para a Spec 0021

A 0021 é o lugar correto para atacar **Fases 1, 2 e 3** e apenas **mapear Fases 4 e 5**.

Ela não deve, no mesmo movimento:

- implementar `config`, `spec init`, `intake`, `status` como produto final;
- introduzir banco como verdade primária;
- migrar todo o passado do repositório para um esquema completo de uma vez.

O papel da 0021 é definir e provar o modelo híbrido com migração inicial controlada.

### 11.1 Escopo que deve ficar para specs posteriores

Mesmo que a estrutura de dados da 0021 habilite esses passos, a implementação final deve ficar para outras specs:

- `ai-guidelines config`
- `ai-guidelines intake`
- `ai-guidelines spec init`
- `ai-guidelines status` como produto completo
- SQLite local-first
- dashboard/web/backend

## 12. Modos de falha a evitar

Uma implementação futura da 0021 estará errada se cair em qualquer um destes modos:

1. **Big-bang histórico** — tentar estruturar todo o passado antes de provar o presente.
2. **DB-first** — criar SQLite como storage canônico.
3. **Markdown-first sem mudança real** — apenas reformatar `backlog.md`/`historico.md` sem registry.
4. **Schema maximalista** — inventar dezenas de campos antes de validar os mínimos.
5. **Spec-centrismo mantido** — modelar só `spec` e deixar `incident`/`delivery no-spec` como segunda classe.

## 13. Critério de sucesso arquitetural

Ao final da 0021, o framework deve ser capaz de afirmar:

1. qual é a **fonte primária de verdade** do estado;
2. como artefatos sem spec entram no fluxo de valor;
3. como `backlog.md` e `historico.md` são derivados e permanecem úteis para IA;
4. como futuras automações da CLI e futuras projeções (SQLite/dashboard) se acoplam sem reabrir a arquitetura.

### 13.1 Pergunta de validação final

Se uma pessoa ou LLM abrir o repositório após a 0021 e perguntar:

> "Onde está o estado canônico de PRDs, incidentes, specs e entregas, e como isso vira backlog e histórico?"

...a resposta deve ser objetiva, curta e única.

Se ainda depender de explicação oral longa, a 0021 não fechou a arquitetura.
