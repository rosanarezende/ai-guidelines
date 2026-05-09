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

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [ ] B
  - [ ] C
- **Justificativa / Ressalvas:** >
  [Preencher no gate.]
- **Data / Owner:** [YYYY-MM-DD] / [@owner]

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

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [ ] B
  - [ ] C
- **Justificativa / Ressalvas:** >
  [Preencher no gate.]
- **Data / Owner:** [YYYY-MM-DD] / [@owner]

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

- **Status:** [ ] Pendente | [ ] Resolvido
- **Sub-eixo 1 — Existência do `spec_workspace_dir` (marque com `x`):**
  - [ ] A
  - [ ] B
- **Sub-eixo 2 — Default do `spec_workspace_dir` (marque com `x`):**
  - [ ] A
  - [ ] B
  - [ ] C
- **Sub-eixo 3 — Lar do registro estruturado (marque com `x`):**
  - [ ] A
  - [ ] B
  - [ ] C
- **Justificativa / Ressalvas:** >
  [Preencher no gate.]
- **Data / Owner:** [YYYY-MM-DD] / [@owner]

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

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [ ] B
  - [ ] C
- **Justificativa / Ressalvas:** >
  [Preencher no gate.]
- **Data / Owner:** [YYYY-MM-DD] / [@owner]

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

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [ ] B
  - [ ] C
- **Justificativa / Ressalvas:** >
  [Preencher no gate.]
- **Data / Owner:** [YYYY-MM-DD] / [@owner]

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

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [ ] B
  - [ ] C
- **Justificativa / Ressalvas:** >
  [Preencher no gate.]
- **Data / Owner:** [YYYY-MM-DD] / [@owner]

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

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [ ] B
  - [ ] C
- **Justificativa / Ressalvas:** >
  [Preencher no gate.]
- **Data / Owner:** [YYYY-MM-DD] / [@owner]

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

- **Status:** [ ] Pendente | [ ] Resolvido
- **Escolha (marque com `x`):**
  - [ ] A
  - [ ] B
  - [ ] C
- **Justificativa / Ressalvas:** >
  [Preencher no gate.]
- **Data / Owner:** [YYYY-MM-DD] / [@owner]

## Resumo de status

| ID               | Bloco | Status   |
| :--------------- | :---- | :------- |
| `[DEC-0021-A01]` | A     | Pendente |
| `[DEC-0021-A02]` | A     | Pendente |
| `[DEC-0021-A03]` | A     | Pendente |
| `[DEC-0021-B01]` | B     | Pendente |
| `[DEC-0021-B02]` | B     | Pendente |
| `[DEC-0021-B03]` | B     | Pendente |
| `[DEC-0021-B04]` | B     | Pendente |
| `[DEC-0021-B05]` | B     | Pendente |

**Status agregado:** `Pendente`

---

## ✅ Gate fechado

- **Data:** [YYYY-MM-DD]
- **Owner:** [@owner]
- **Pontos resolvidos:**
  - [ ] `[DEC-0021-A01]`
  - [ ] `[DEC-0021-A02]`
  - [ ] `[DEC-0021-A03]`
  - [ ] `[DEC-0021-B01]`
  - [ ] `[DEC-0021-B02]`
  - [ ] `[DEC-0021-B03]`
  - [ ] `[DEC-0021-B04]`
  - [ ] `[DEC-0021-B05]`
