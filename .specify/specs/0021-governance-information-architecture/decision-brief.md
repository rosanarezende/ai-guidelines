<!-- ai-guidelines-template: decision-brief-boilerplate v=1 -->

# Decision Brief — Spec 0021 Governance Information Architecture

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Tasks: [`./tasks.md`](./tasks.md)
> Status agregado: **Pendente**
> Última atualização: 2026-05-08 — brief inicial populada a partir do backlog da candidata, do débito herdado da Spec 0018 e dos researches de arquitetura de 2026-05-08.

> **Artefato canônico do gate humano entre Stage 1 (research) e Stage 2 (design + implementação)** para specs `evidence-driven` ou `mixed`.

---

## Blocos da brief

## Bloco A — Estado canônico e artefatos de valor

### [DEC-0021-A01] Fonte primária do estado do framework

**Pergunta:** qual é a fonte primária canônica do estado de PRDs, incidentes, frictions, specs, ADRs e entregas do framework?

**Contexto (research):**

- [`.specify/specs/researchs/architecture/2026-05-08-repo-first-structured-registry.md`](../researchs/architecture/2026-05-08-repo-first-structured-registry.md) § 0–5 recomenda explicitamente um modelo **repo-first híbrido**: registro estruturado versionado no repositório + Markdown derivado + projeções futuras como derivados.
- O mesmo research crava anti-objetivos explícitos: não trocar Git por banco como truth source, não manter `backlog.md`/`historico.md` como único storage manual e não atacar SQLite/dashboard agora.
- `backlog.md` da candidata 0021 já explicita a direção preferencial "repo-first híbrido" e a divisão Fases 1–3 agora, 4–5 depois.

**Opções:**

| Opção | Descrição                                                                                                             | Pró                                                                                            | Contra                                                                                     |
| :---- | :-------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| A     | **Markdown narrativo como fonte primária permanente** (`backlog.md`/`historico.md` continuam sendo o estado canônico) | Legibilidade humana máxima; zero storage novo                                                  | Relacionamentos e métricas dependem de parsing frágil; mantém o problema-raiz da 0021      |
| B     | **Registro estruturado versionado no repo como fonte primária + Markdown derivado**                                   | Preserva auditabilidade por PR/Git, habilita queries e mantém fallback legível para IA/humanos | Exige introduzir schema, diretório canônico e rotina de derivação                          |
| C     | **Banco local ou serviço externo como fonte primária**                                                                | Queries e dashboards nascem fáceis                                                             | Rompe o princípio repo-first, piora revisão por PR e aumenta custo operacional cedo demais |

**Recomendação inicial (a confirmar pós-gate):** **B**. É a única opção compatível com os invariantes explícitos do research de 2026-05-08 e com o objetivo de manter o repositório como memória canônica sem sacrificar derivação futura.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [x] B
  - [ ] C
- **Justificativa / Ressalvas:** > O YAML atua perfeitamente na fronteira da Human-AI Co-creation. Ele é legível para Code Reviews humanos, suporta comentários embutidos (vital para governança técnica) e lida bem com blocos de texto multilinhas (como descrições de incidentes ou resumos de specs). Ao mesmo tempo, fornece o schema rígido (campos tipados) que a CLI precisa para gerar views em Markdown automaticamente (backlog.md gerado, não mantido à mão). O JSONL é descartado aqui por ser otimizado para machine streaming/append logs, sendo péssimo para revisão humana em repositórios.
  Nota sobre extensibilidade: O formato YAML é trivialmente convertido para JSON via scripts simples na CLI Node.js, o que pavimenta o caminho sem fricção para consumo futuro em dashboards e agregadores de métricas (candidatas no backlog)
- **Data / Owner:** 2026-05-09 / @rosanarezende

### [DEC-0021-A02] Artefatos não-spec como origem de valor

**Pergunta:** como artefatos não-spec entram no fluxo de valor do framework sem virar conhecimento solto nem depender de uma spec para existir?

**Contexto (research):**

- O research de registro estruturado § 6 propõe explicitamente classes como `prd`, `incident`, `friction`, `note`, `spec`, `delivery`, `adr`, com relações e regras de promoção/resolução.
- O backlog da 0021 reforça a necessidade de referenciar PRDs, incidentes, friction reports e entregas `no-spec` sem tirá-los do fluxo de valor.
- A seção "Anti-objetivos" do research rejeita manter o modelo espec-cêntrico atual.

**Opções:**

| Opção | Descrição                                                                                                                                           | Pró                                                                           | Contra                                                                              |
| :---- | :-------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| A     | **Spec-centrismo mantido**: só specs formais entram no estado canônico; o resto continua como nota/contexto auxiliar                                | Menor esforço inicial; pouca mudança conceitual                               | Não resolve a origem de valor fora de specs; reabre a discussão em toda spec futura |
| B     | **Taxonomia mínima de artefatos de valor** (`prd`, `incident`, `friction`, `note`, `spec`, `delivery`, `adr`) com IDs, relações e modo de resolução | Prova o modelo híbrido sem maximalismo; dá primeira classe a origens não-spec | Exige decidir campos mínimos e regras de promoção com cuidado                       |
| C     | **Taxonomia expandida desde já** com dezenas de subtipos por domínio                                                                                | Alta expressividade futura                                                    | Congela cedo demais; forte risco de schema maximalista                              |

**Recomendação inicial (a confirmar pós-gate):** **B**. O research já oferece uma base suficiente para uma taxonomia mínima e explicitamente alerta contra maximalismo prematuro.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [x] B
  - [ ] C
- **Justificativa / Ressalvas:** > Avaliamos e escolhemos a expansão mínima (Opção B), mas com uma forte ressalva taxonômica alinhada ao mercado AI-First e à rotina real de engenharia de Growth. Em vez da lista extensa sugerida pelo research (prd, note, delivery, etc.), consolidaremos o registry em 6 pilares MECE (mutuamente exclusivos e coletivamente exaustivos) focados na intenção de saída e na carga operacional do ciclo de vida:

1. spec: Entrega estruturada (Feature nova, mudança arquitetural). Exige e passa por todo o ciclo RPI do ai-guidelines.
2. exploration: Provas de Conceito (PoCs), Spikes e estudos técnicos práticos. O entregável foca no aprendizado e no arquivamento seguro (gerando uma PR em formato Draft ou branch salva). Garante que o protótipo sujo permaneça referenciável no futuro sem poluir a branch principal ou sofrer PR rot.
3. fix: Correção de um comportamento funcional que falhou. Exige uma documentação mínima (plan + tasks), fornecendo rastreio sem a burocracia de uma spec completa.
4. patch: Manutenção invisível ao usuário final (update de bibliotecas, linting, chore, refactor técnico transparente). Pula completamente a esteira documental pesada.
5. incident: Fricção grave, downtime de infraestrutura ou quebra crítica de CI. Diferencia-se do fix por possuir severidade atribuída, impactar métricas de negócio e agir como alerta máximo.
6. proposal: Sementes de backlog. Ideias soltas, melhorias pontuais de UI/UX ou features sugeridas que constam no registro (YAML) sem exigir a criação física de pastas ou ciclos, prontas para serem promovidas a specs quando o time tiver apetite.
7. experiment: Mudanças baseadas em hipóteses (Growth/Testes A-B). Equilibra a velocidade necessária para validar métricas com o rigor de segurança para não quebrar a produção. Exige definição clara de hipótese, variantes e métricas de sucesso, ocupando o espaço entre o `patch` (rápido mas arriscado) e a `spec` (segura mas lenta).

- **Data / Owner:** 2026-05-09 / @rosanarezende

> **Ressalva 2026-05-10 (drift textual, sem reabrir gate):** a frase introdutória da justificativa fala em "6 pilares MECE" e logo enumera 7 — o 7º (`experiment`) foi acrescentado na mesma sessão por princípios de Growth Engineering e a lista já fica correta. A contagem em texto livre permanece como evidência histórica da expansão; o domínio (`WORK_ITEM_KINDS`) e o `plan.md` já refletem **7 pilares**. Patch documental aplicado em `[2.C-sanitize]` — ver [`./audit-2026-05-10-pre-2d-sanitization.md`](./audit-2026-05-10-pre-2d-sanitization.md).

> **Ressalva 2026-05-11 (renomeação `exploration` → `spike`, sem reabrir gate):** auditoria MECE pré-PR3 detectou colisão do nome `exploration` com vocabulário Product Discovery AI-first 2026 ("exploration" como fase divergente do discovery de produto, em Productboard/Thoughtbot/McKinsey). A semântica do pilar — "Provas de Conceito (PoCs), Spikes e estudos técnicos práticos com foco em aprendizado e arquivamento seguro" — permanece intacta; apenas o rótulo muda para `spike`, canônico em XP/Scrum desde 1999 e adotado em JIRA/Linear/GitLab/GitHub Issues como issue type/label. A lista numerada acima preserva "exploration" como evidência histórica da decisão de 2026-05-09; código, testes, schema e docs canônicas foram atualizados em `[3.0.A]`. Decisão de naming consolidada em ADR `.core/governance/adrs/0001-taxonomy-mece-pillars.md`. Pesquisa de suporte: [`../researchs/governance/2026-05-11-mece-taxonomy-and-adr-audit.md`](../researchs/governance/2026-05-11-mece-taxonomy-and-adr-audit.md).

### [DEC-0021-A03] Fronteira entre `sdd_dir`, `spec_workspace_dir` e o lar físico do estado

**Pergunta:** como separar formalmente `sdd_dir`, eventual `spec_workspace_dir` e o path físico do estado estruturado sem cristalizar UX errada no consumidor?

**Contexto (research):**

- [`.specify/specs/researchs/architecture/2026-05-08-consumer-bootstrap-frictions.md`](../researchs/architecture/2026-05-08-consumer-bootstrap-frictions.md) § 3–4 divide claramente o problema entre contrato de informação/placement (0021) e implementação de UX/CLI (spec posterior).
- O backlog da 0021 carrega como insumo real a fricção do consumidor `site` e pede decidir se existe `spec_workspace_dir`, qual seu default e a separação formal entre ele e `sdd_dir`.
- A própria 0020 migrou `.specify/templates` para o tarball por necessidade tática, deixando a reorganização semântica/física para a 0021.

**Eixos a decidir:**

1. **Existe `spec_workspace_dir` como conceito formal?**
2. **Qual é o default canônico desse workspace?**
3. **Onde o registro estruturado mora em relação a esse contrato?**

#### Sub-eixo 1 — Existência do `spec_workspace_dir`

| Opção | Descrição                                                                           | Pró                                                                                     | Contra                                                                                         |
| :---- | :---------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| A     | **Não introduzir `spec_workspace_dir`**; manter tudo implícito em `.specify/specs/` | Menos mudança de contrato                                                               | Mantém a ambiguidade de onboarding e impede separar memória operacional do payload distribuído |
| B     | **Introduzir `spec_workspace_dir` como conceito formal**, separado de `sdd_dir`     | Responde diretamente à fricção do consumidor e prepara `config/spec init/intake/status` | Exige decidir defaults e naming agora                                                          |

#### Sub-eixo 2 — Default do `spec_workspace_dir`

| Opção | Descrição                                                                | Pró                                                            | Contra                                                                                              |
| :---- | :----------------------------------------------------------------------- | :------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| A     | **`.specify/specs`** como default canônico                               | Preserva o layout já adotado pelo repositório e minimiza churn | O nome carrega o legado de "specs" mesmo quando o workspace passar a conter outras origens de valor |
| B     | **Novo root mais amplo** (ex.: `.specify/state` ou `.specify/workspace`) | Nome semanticamente mais alinhado ao estado ampliado           | Aumenta churn físico e editorial já no primeiro movimento                                           |
| C     | **Workspace configurável sem default forte**                             | Flexível para consumidores                                     | Perde a resposta curta/canônica que a 0021 precisa produzir                                         |

#### Sub-eixo 3 — Lar do registro estruturado

| Opção | Descrição                                                                                 | Pró                                                    | Contra                                                                                 |
| :---- | :---------------------------------------------------------------------------------------- | :----------------------------------------------------- | :------------------------------------------------------------------------------------- |
| A     | Registro estruturado mora **dentro** do `spec_workspace_dir`                              | Mantém o estado operacional colocalizado               | Pode misturar gêneros humanos/estruturados sem fronteira clara se o naming não for bom |
| B     | Registro estruturado mora em path irmão dentro de `.specify/` (ex.: `.specify/registry/`) | Separa melhor state canônico de specs/research/roadmap | Introduz mais um diretório conceitual para explicar                                    |
| C     | Registro estruturado mora em `.core/`                                                     | Aproxima do framework distribuído                      | Confunde estado operacional do consumidor com baseline/runtime do framework            |

**Recomendação inicial (a confirmar pós-gate):** **B / A / B**: introduzir `spec_workspace_dir` como conceito formal, preservar `.specify/specs` como default inicial para reduzir churn e posicionar o registro estruturado em um path irmão dentro de `.specify/` para manter fronteira explícita entre workspace humano e state canônico.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Sub-eixo 1 — Existência do `spec_workspace_dir` (marque com `x`):**
  - [ ] A
  - [x] B
- **Sub-eixo 2 — Default do `spec_workspace_dir` (marque com `x`):**
  - [ ] A
  - [x] B
  - [ ] C
- **Sub-eixo 3 — Lar do registro estruturado (marque com `x`):**
  - [x] A
  - [ ] B
  - [ ] C
- **Justificativa / Ressalvas:** >
  Sub-eixo 1 (Contrato): A introdução formal do spec_workspace_dir oficializa a separação entre os artefatos internos da ferramenta e a memória operacional de engenharia do time.
  Sub-eixo 2 (Caminho): Adotaremos .governance/ como o novo root unificado. A análise do código demonstrou que o cliente hoje sofre com fragmentação (templates e config em .ai-guidelines/ e o workspace manual em .specify/). O novo root consolida tudo isso. Visão de Growth/PLG: O nome .governance/ é agnóstico e profissional, reduzindo a barreira psicológica de entrada (vendor lock-in).
  Sub-eixo 3 (Estado): O registry.yml deve morar aberto na raiz do workspace (.governance/registry.yml). Visão de Ownership: O estado canônico não é "cache" temporário da CLI, é patrimônio intelectual do repositório do cliente. Mantê-lo visível e versionado garante transparência, governança descentralizada e portabilidade.
- **Data / Owner:** 2026-05-09 / @rosanarezende

## Bloco B — Escopo da 0021 e placement canônico

### [DEC-0021-B01] Envelope de entrega: Fases 1–3 agora, 4–5 depois

**Pergunta:** qual é o corte exato da própria 0021 entre o que deve ser entregue agora e o que apenas fica mapeado como evolução?

**Contexto (research):**

- O research de registro estruturado § 9–11 recomenda explicitamente que a 0021 ataque **Fases 1, 2 e 3** agora e deixe **Fases 4 e 5** apenas mapeadas.
- O backlog da 0021 já traz a decomposição das fases e usa esse recorte como direção preferencial.
- Os anti-objetivos do research rejeitam banco primário, big-bang histórico e implementação simultânea de todos os comandos de produto.

**Opções:**

| Opção | Descrição                                                                              | Pró                                                        | Contra                                                                     |
| :---- | :------------------------------------------------------------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------------------------- |
| A     | **Só Fase 1**: contrato arquitetural agora; registro estruturado e derivação depois    | Menor risco imediato                                       | Pode deixar a spec sem prova prática do modelo                             |
| B     | **Fases 1, 2 e 3**: contrato + registro estruturado no repo + visões derivadas mínimas | Fecha a arquitetura e prova o modelo com escopo controlado | Exige tocar storage, visões e possivelmente migração inicial já nesta spec |
| C     | **Fases 1 a 5**: incluir SQLite/dashboard/superfície de produto na mesma spec          | Evita specs futuras para continuidade                      | Escopo explode, viola anti-objetivos e aumenta risco de overbuilding       |

**Recomendação inicial (a confirmar pós-gate):** **B**. É a própria tese do research e do backlog: fechar arquitetura e prova mínima agora, sem antecipar projeções e produto final.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [x] B
  - [ ] C
- **Justificativa / Ressalvas:** > Implementar as Fases 1, 2 e 3 garante a validação prática da nova arquitetura (o YAML como registro estruturado primário e a CLI gerando as visões Markdown derivadas mínimas) e entrega valor imediato de governança ao consumidor sem risco de over-engineering. Adiar uma camada de banco de dados e interfaces visuais complexas (Fases 4 e 5) protege o orçamento de tokens da IA durante este ciclo de desenvolvimento e foca puramente na resolução da dor raiz identificada na arquitetura atual.
- **Data / Owner:** 2026-05-09 / @rosanarezende

### [DEC-0021-B02] Política de placement documental e lar de gêneros futuros

**Pergunta:** como a 0021 resolve a arquitetura de informação do meta-framework sem implementar todos os gêneros agora, mas também sem deixar "onde isso mora?" em aberto para specs futuras?

**Contexto (research):**

- O backlog da 0021 identifica mistura atual entre constituição operacional (`.core/process/spec-foundation.md`), ADRs, runtime rules, docs descritivos, referências e pesquisa.
- O mesmo backlog aprova explicitamente um sub-bloco antecipatório para reservar lar canônico de PRD/intake, handoff/decision logs e telemetria.
- A 0020 deixou como insumo herdado a necessidade de tratar o placement canônico de `.specify/templates/`.

**Opções:**

| Opção | Descrição                                                                                                                     | Pró                                                               | Contra                                                                                      |
| :---- | :---------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------ |
| A     | **Só catálogo documental**: classificar gêneros e paths, sem reservar lar para gêneros ausentes/futuros                       | Entrega mínima de organização                                     | Não resolve o principal anti-retrabalho da 0021; specs futuras reabrem a discussão          |
| B     | **Catálogo + reserva explícita de lar canônico** para PRD/intake, handoff, telemetria e artefatos distribuídos como templates | Fecha a pergunta de placement sem implementar os fluxos completos | Exige tomar algumas decisões com base em necessidade futura, não em implementação já pronta |
| C     | **Implementar já todos os gêneros e mover fisicamente tudo de uma vez**                                                       | Fecha tudo num único ciclo                                        | Escopo excessivo, diff amplo e alto risco de churn/erro                                     |

**Recomendação inicial (a confirmar pós-gate):** **B**. A reserva explícita de lar canônico é justamente o mecanismo para evitar reabertura da discussão em `stakeholder-intake-pipeline`, `handoff-contracts-formalization`, `framework-observability-dashboard` e no débito de `.specify/templates/`.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [x] B
  - [ ] C
- **Justificativa / Ressalvas:** > A reserva explícita de lar canônico atua como um plano diretor para a arquitetura de informação. Ao estabelecermos agora onde residirão os artefactos futuros (PRD/intake, telemetria, handoffs) no interior de .governance/, ancoramos a arquitetura no longo prazo sem estourar o limite de tokens implementando fluxos que não são o foco atual. Isto fecha em definitivo a dívida da Spec 0020 e previne reaberturas dispendiosas deste tópico em ciclos posteriores de planeamento.
- **Data / Owner:** 2026-05-09 / @rosanarezende

---

### [DEC-0021-B03] Carrier da política de arquitetura de informação

**Pergunta:** qual artefato ou combinação de artefatos carrega a política canônica de arquitetura de informação do framework?

**Contexto (research):**

- O backlog original da candidata 0021 já colocava explicitamente a alternativa entre catálogo central (`INFORMATION-CATALOG.md`), reorganização física (`.specify/foundation/` ou equivalente) e híbrido.
- A própria abertura atual da 0021 absorveu o problema de placement, mas ainda não cravou onde a política ficará legível e auditável para um agente novo.
- A experiência do repositório mostra que depender só de reorganização física ou só de texto narrativo tende a perder clareza em algum eixo.

**Opções:**

| Opção | Descrição                                                                                                                       | Pró                                                | Contra                                                                                 |
| :---- | :------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------- | :------------------------------------------------------------------------------------- |
| A     | **Catálogo central apenas**: um arquivo canônico lista classes, destinos e regras de lookup, sem reorganização física relevante | Alta legibilidade e rastreabilidade textual        | Pode virar mapa que descreve uma topologia que o repo real não expressa                |
| B     | **Reorganização física apenas**: a arquitetura é comunicada principalmente pelos próprios paths finais                          | O repo “fala por si”                               | Sem catálogo explícito, agentes e humanos ainda precisam inferir princípios e exceções |
| C     | **Modelo híbrido**: catálogo curto e canônico + reorganização física direcionada onde o ganho justificar                        | Combina explicabilidade com topologia real do repo | Exige disciplina para manter catálogo e repo sincronizados                             |

**Recomendação inicial (a confirmar pós-gate):** **C**. A 0021 trata um problema de semântica e de placement; depender só de um dos dois meios tende a deixar metade do problema aberta.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [ ] B
  - [x] C
- **Justificativa / Ressalvas:** > A adoção de um modelo híbrido garante que a arquitetura seja autoexplicativa pela própria topologia das pastas (ex: .governance/specs, .governance/incidents), mas com o apoio de um catálogo central escrito que rege o ciclo de vida e resolve ambiguidades.
  Ressalva Crítica: Conforme apontado no gate, o arquivo .core/process/spec-foundation.md atual carrega um nome obsoleto. Visto que o framework aprovou o modelo de 6 pilares de valor (onde spec é apenas um deles), o termo "spec-foundation" gera dissonância cognitiva. A implementação desta spec exigirá renomear e refatorar este arquivo para refletir a governança como um todo (ex.: governance-foundation.md, workflow-foundation.md, state-lifecycle.md ou information-architecture.md), alinhando o título à sua real responsabilidade arquitetural. Esta mudança é crucial para evitar confusão futura sobre o papel do arquivo e para comunicar claramente que ele é a base de toda a governança, não apenas das specs.
- **Data / Owner:** 2026-05-09 / @rosanarezende

### [DEC-0021-B04] Fronteira entre `spec-foundation.md` e ADRs

**Pergunta:** decisões atômicas hoje embutidas em `.core/process/spec-foundation.md` devem permanecer como constituição/processo vivo, migrar para ADRs formais ou seguir uma fronteira híbrida explícita?

**Contexto (research):**

- `[DEC-0018-A06]` capturou o débito tático sobre "onde fica a seção Tipos de spec", mas a raiz do problema é maior: `spec-foundation.md` concentra processo vivo e também decisões arquiteturais que podem merecer outro gênero documental.
- O backlog original da 0021 já levantava explicitamente a pergunta sobre ADRs absorverem decisões atômicas hoje embutidas em `spec-foundation.md`.
- A própria `spec-foundation.md` já se autoidentifica como carregando migração arquitetural pendente, o que indica fronteira ainda não resolvida.

**Opções:**

| Opção | Descrição                                                                                                                                                                           | Pró                                                                                        | Contra                                                                             |
| :---- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| A     | **Manter tudo em `spec-foundation.md`**; ADR fica só para decisões maiores não ligadas ao processo                                                                                  | Menor churn e menos dispersão                                                              | Mantém mistura entre constituição viva e decisões arquiteturais específicas        |
| B     | **Migrar o máximo possível para ADRs**; `spec-foundation.md` vira só manual/processo                                                                                                | ADRs ficam mais completos e rastreáveis                                                    | Pode fragmentar demais a leitura do processo e transformar o fluxo em caça a links |
| C     | **Fronteira híbrida explícita**: processo vivo e constituição operacional ficam em `spec-foundation.md`; decisões arquiteturais cross-spec, estáveis e justificadas migram para ADR | Mantém leitura operacional curta e dá lar adequado ao que realmente é decisão arquitetural | Exige critério claro para evitar ambiguidade futura                                |

**Recomendação inicial (a confirmar pós-gate):** **C**. O débito de `[DEC-0018-A06]` parece ser justamente de fronteira, não de “mover tudo” para um lado só.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [ ] B
  - [x] C
- **Justificativa / Ressalvas:** > A adoção de uma fronteira híbrida explícita (Opção C) resolve a sobrecarga cognitiva do atual spec-foundation.md. O documento central (que será renomeado, ex: governance-foundation.md) passa a focar estritamente no "processo vivo", manual de uso e constituição do ciclo de vida (como os 6 novos pilares de entrega definidos no DEC-0021-A02). Decisões técnicas irreversíveis, justificativas de arquitetura ou escolhas de ferramentas estruturais que atualmente poluem o documento devem ser expurgadas e formalizadas como ADRs (Architecture Decision Records). Isto garante uma leitura operacional rápida para o dia a dia e um arquivo histórico adequado para justificativas técnicas.
- **Data / Owner:** 2026-05-09 / @rosanarezende

### [DEC-0021-B05] Placement interno de `.core/rules/` no repositório

**Pergunta:** a 0021 deve reorganizar fisicamente o próprio `.core/rules/` no repo para refletir melhor a taxonomia canônica do framework?

**Contexto (research):**

- O backlog original da candidata 0021 citava explicitamente a reorganização física do `.core/rules/` no repo como parte do escopo potencial, deixando claro que isso **não** é o mesmo trabalho da Spec 0011.
- A abertura atual da 0021 fala em placement documental amplo, mas ainda não força uma decisão específica sobre o layout interno de `.core/rules/`.
- O runtime já usa categorias como top/center/base e universal/opt-in; o repo-fonte pode ou não querer espelhar melhor essa taxonomia no layout físico.

**Opções:**

| Opção | Descrição                                                                                                                                                 | Pró                                            | Contra                                                                                  |
| :---- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------- | :-------------------------------------------------------------------------------------- |
| A     | **Sem reorganização física agora**; documentar a taxonomia mantendo `.core/rules/` como está                                                              | Menor churn                                    | Pode preservar uma topologia de origem menos clara do que a taxonomia final             |
| B     | **Reorganização física interna direcionada** em `.core/rules/`, alinhada à taxonomia canônica aprovada, com redirects/ajustes de referência se necessário | Aproxima repo-fonte, taxonomia e runtime       | Gera diff amplo e precisa de coordenação com código/documentação                        |
| C     | **Mover `.core/rules/` para outra família de paths mais ampla já nesta spec**                                                                             | Pode produzir arquitetura ainda mais semântica | Risco alto de over-move e de misturar este trabalho com outras migrações ao mesmo tempo |

**Recomendação inicial (a confirmar pós-gate):** **B** ou **A**, dependendo do custo real de migração após o gate. A pergunta precisa ser resolvida explicitamente; deixá-la implícita reabriria o tema depois.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [x] B
  - [ ] C
- **Justificativa / Ressalvas:** > A reorganização física alinha o repositório-fonte à nova taxonomia canónica estabelecida, eliminando dívida técnica e facilitando a navegação de agentes de IA e humanos pelo próprio código do framework. Embora introduza algum churn inicial devido à necessidade de atualizar caminhos e referências nos scripts de build da CLI, o ganho de coerência a longo prazo justifica o esforço (Option B).
- **Data / Owner:** 2026-05-09 / @rosanarezende

## Bloco C — Saúde Técnica e Dívidas Associadas

> **Bloco Mandatório.** O objetivo é forçar a análise sobre a saúde da base de código que implementará a spec, prevenindo que dívidas técnicas não-mapeadas comprometam a entrega.

### [DEC-0021-C01] Saúde arquitetural e dívidas técnicas

**Pergunta:** Qual é o estado de saúde do componente que implementará esta spec, e quais dívidas técnicas existentes podem impactar o escopo?

**Contexto (research):**

- A análise de saúde técnica é um pré-requisito para um planejamento de implementação realista.
- Identificar dívidas técnicas relevantes no Stage 1 permite que o escopo da spec seja ajustado (se necessário) para pagá-las, em vez de acumular mais complexidade sobre uma base frágil.

**Eixos a decidir:**

1. **Saúde Arquitetural:** Qual é o diagnóstico do componente principal afetado?
2. **Dívidas Técnicas:** Existem dívidas pré-existentes que a spec irá exacerbar?
3. **Metodologia de Design e Implementação:** Qual metodologia guiará a re-arquitetura da CLI para garantir uma solução robusta e de alta qualidade?

#### Sub-eixo 1 — Saúde Arquitetural

| Opção | Descrição                                                                                                                                                                                                   |
| :---- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | **Saudável:** A arquitetura do componente é clara, coesa e pronta para absorver as novas funcionalidades sem atritos significativos.                                                                        |
| B     | **Requer Refatoração:** O componente funciona, mas sua estrutura interna é confusa, acoplada ou carece de padrões claros. A implementação exigirá uma refatoração tática.                                   |
| C     | **Requer Re-arquitetura:** A fundação do componente é fundamentalmente falha ou inadequada para os novos requisitos. A implementação segura exige um redesenho completo antes da entrega de novas features. |

#### Sub-eixo 2 — Dívidas Técnicas

| Opção | Descrição                                                                                                                                                                                          |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | **Nenhuma Dívida Relevante:** Nenhuma dívida técnica existente impacta diretamente o escopo desta spec.                                                                                            |
| B     | **Dívidas Contidas:** Existem dívidas, mas elas podem ser isoladas ou contornadas. O plano de implementação deve registrá-las.                                                                     |
| C     | **Dívidas Bloqueadoras:** Dívidas existentes (ex: dependências obsoletas, falta de testes) tornam a implementação insegura ou impraticável. O escopo da spec **deve ser expandido** para pagá-las. |

#### Sub-eixo 3 — Metodologia de Design e Implementação

| Opção | Descrição                                                                                                                                                                                                                                                                                                       |
| :---- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | **Refatoração Reativa:** Manter a estrutura da CLI atual, aplicando apenas as modificações necessárias para suportar `.governance/`. A qualidade seria garantida por testes de regressão.                                                                                                                       |
| B     | **TDD/BDD Estrito:** Adotar um processo formal de Test-Driven Development. Escrever uma suíte de testes completa para a nova CLI (que falhará inicialmente) e então escrever o código de implementação para fazê-la passar.                                                                                     |
| C     | **DDD + TDD/BDD:** A abordagem mais profunda. Primeiro, aplicar os princípios de Domain-Driven Design para modelar o domínio da CLI (ex: `Registry`, `GovernanceWorkspace`, `CommandBus`), estabelecendo uma linguagem ubíqua e limites de contexto claros. Em seguida, implementar este modelo usando TDD/BDD. |

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Sub-eixo 1 — Saúde Arquitetural (marque com `x`):**
  - [ ] A
  - [ ] B
  - [x] C
- **Sub-eixo 2 — Dívidas Técnicas (marque com `x`):**
  - [ ] A
  - [ ] B
  - [x] C
- **Sub-eixo 3 — Metodologia de Design e Implementação (marque com `x`):**
  - [ ] A
  - [ ] B
  - [x] C
- **Justificativa / Ressalvas:** > A decisão de exigir uma re-arquitetura total baseada em DDD + TDD/BDD fundamenta-se na necessidade crítica de erradicar o código frágil da CLI legada e implementar o paradigma de "Documentação Viva" (Living Documentation).
  O modelo manual anterior de regras de negócio (docs/cli/ai-guidelines-cli.md) falhou devido ao 'drift' (defasagem) inevitável entre o código executado e o texto escrito. Para suportar a complexidade do novo ecossistema estruturado (o novo root .governance/ e o registry.yml), é absolutamente mandatório aplicar primeiro o Domain-Driven Design (DDD), isolando e modelando os domínios da aplicação de forma limpa, com linguagem ubíqua e limites de contexto claros (ex: criando entidades/agregados explícitos como Registry, GovernanceWorkspace, RuleExtractor).
  Em cima desse modelo de domínio robusto, aplicaremos TDD/BDD estrito para inverter a Fonte da Verdade (SSOT): os próprios blocos de teste da aplicação (it/test), estritamente mapeados com identificadores de regras de negócio (ex: [BR-CLI-*]), passarão a ser a Única Fonte da Verdade. Criaremos um mecanismo de extração automática (seja via script AST estático ou um Custom Reporter rodando sobre os testes nativos) que varrerá essa suíte de testes madura e exportará um artefato estruturado (JSON ou YAML) diretamente para a pasta .governance/. Esse artefato servirá como uma API declarativa e viva para futuros dashboards executivos, garantindo visibilidade 100% real do que está rodando em produção para a liderança e stakeholders, além de criar um forte incentivo cultural (gamification e visibilidade) para que a equipe de engenharia escreva testes com altíssima qualidade e precisão descritiva.
- **Data / Owner:** 2026-05-09 / @rosanarezende

## Bloco D — Engine de Templates e Composição Modular

### [DEC-0021-D01] Arquitetura de Templates: Composição vs. Espelhamento

**Pergunta:** Como o framework deve gerenciar a criação de novos artefatos (tasks, plans, specs) no novo paradigma "Governance-Driven", evitando redundância e facilitando a manutenção dos boilerplates?

**Opções:**
| Opção | Descrição | Pró | Contra |
| :---- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| A | **Mirroring (Status Quo):** A CLI copia arquivos inteiros de `.governance/templates/` para a pasta da spec. | Simplicidade inicial e fácil entendimento do processo de geração. | Alta redundância (ex: 4 arquivos de tasks quase idênticos), difícil manutenção e evolução dos templates. |
| B | **Templates com Lógica Interna:** Um único arquivo com condicionais pesadas (ex: Handlebars/Mustache) processadas pela CLI. | Reduz a redundância física, mantendo um único template para cada tipo de artefato. | A complexidade das condicionais torna o template difícil de ler, editar e manter, especialmente para usuários não técnicos. |
| C | **Composição Atômica:** A CLI monta o arquivo final combinando "partes" atômicas (partials). O tipo da spec no `registry.yml` dita a "receita" de montagem (Ex: Spec mixed = Partes A+B+C; evidence-driven = A+B+D). | Elimina redundância, facilita manutenção e evolução dos templates. Permite flexibilidade máxima na composição de artefatos. | Requer implementação mais complexa na CLI e uma estrutura clara de partials para evitar confusão. Necessita de documentação clara para os consumidores entenderem como as partes se combinam. |

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [ ] B
  - [x] C
- **Justificativa / Ressalvas:** > A adoção da Composição Atômica (Opção C) reflete a maturidade do framework, que evoluiu de um mero "gerador de specs" (Spec-Driven) para um motor completo (Governance-Driven). O espelhamento simples gera arquivos redundantes e difíceis de evoluir. Ao utilizarmos partials atômicas (ex: setup.md, research.md, implementation.md isolados em .governance/templates/partials/), aplicamos o princípio DRY (Don't Repeat Yourself). Qualquer melhoria em uma etapa metodológica (ex: como fazer Análise de Gaps) é alterada em um único lugar e propagada automaticamente para todas as "receitas" de entregas que utilizam aquela parte. Essa engine de composição será orquestrada pela nova CLI re-arquitetada em DDD, onde a TemplateEngine ditará a montagem com base na tipagem definida no registry.yml.
- **Data / Owner:** 2026-05-09 / @rosanarezende

---

## Resumo de status

| ID               | Bloco | Status    |
| :--------------- | :---- | :-------- |
| `[DEC-0021-A01]` | A     | Resolvido |
| `[DEC-0021-A02]` | A     | Resolvido |
| `[DEC-0021-A03]` | A     | Resolvido |
| `[DEC-0021-B01]` | B     | Resolvido |
| `[DEC-0021-B02]` | B     | Resolvido |
| `[DEC-0021-B03]` | B     | Resolvido |
| `[DEC-0021-B04]` | B     | Resolvido |
| `[DEC-0021-B05]` | B     | Resolvido |
| `[DEC-0021-C01]` | C     | Resolvido |
| `[DEC-0021-D01]` | D     | Resolvido |

**Status agregado:** `Resolvido`

---

## ✅ Gate fechado

- **Data:** 2026-05-09
- **Owner:** @rosanarezende
- **Pontos resolvidos:**
  - [x] `[DEC-0021-A01]`
  - [x] `[DEC-0021-A02]`
  - [x] `[DEC-0021-A03]`
  - [x] `[DEC-0021-B01]`
  - [x] `[DEC-0021-B02]`
  - [x] `[DEC-0021-B03]`
  - [x] `[DEC-0021-B04]`
  - [x] `[DEC-0021-B05]`
  - [x] `[DEC-0021-C01]`
  - [x] `[DEC-0021-D01]`
