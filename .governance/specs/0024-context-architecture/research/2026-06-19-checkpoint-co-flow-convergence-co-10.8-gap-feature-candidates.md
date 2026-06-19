# CO-10.8 — Gaps e features candidatos encontrados na pesquisa estrutural

> Spec: 0024-context-architecture  
> Nó: `co-flow-convergence`  
> Sub-checkpoint planejado: CO-10.8  
> Data: 2026-06-19  
> Status: candidatos; **não** são escopo aprovado automaticamente.

## Regra deste artefato

Este arquivo existe para não contaminar o refactor estrutural com features novas. Durante o inventário de organização interna e BDD humano, qualquer oportunidade relevante deve ser registrada aqui e decidida ao final da entrega.

Critério:

- se for necessário para mover/splitar arquivos sem mudar comportamento, pode entrar no CO-10.8;
- se muda produto, UX, política, validação, site público ou comandos, fica como candidato;
- se exige julgamento humano, vira decisão ou novo sub-checkpoint somente depois.

## Candidatos iniciais

### INTORG-001 — Página de mantenedores com BDD navegável

**Problema:** Rosana entende melhor fluxos complexos quando consegue navegar visualmente por cenários. O site público agora ajuda usuários, mas mantenedores ainda precisam ler testes/código para entender cobertura.

**Possível feature:** criar uma área de mantenedores que projeta cenários BDD reais, com jornada, estado inicial, ação, resultado esperado, teste que protege e artefatos tocados.

**Risco:** virar documentação manual paralela se não for gerada a partir de metadados/testes.

**Decisão futura:** decidir se esta página fica no mesmo site, em rota interna, ou como artefato local separado.

### INTORG-002 — Metadados BDD padronizados para testes de fluxo

**Problema:** muitos testes já validam jornadas, mas a intenção humana fica escondida em nomes e asserts.

**Possível feature:** definir `*.scenario.yml` ou estrutura TypeScript tipada para anexar Given/When/Then, persona, autoridade, comandos e artefatos a testes reais.

**Risco:** excesso de metadado burocrático.

**Decisão futura:** começar só nos cenários críticos de `co-flow-convergence` e medir valor antes de expandir.

### INTORG-003 — Guard de tamanho/responsabilidade de arquivos

**Problema:** arquivos gigantes voltam a crescer sem sinal precoce.

**Possível feature:** check advisory ou required que alerta quando arquivo passa limite definido ou mistura responsabilidades proibidas.

**Risco:** limite mecânico pode incentivar splits artificiais.

**Decisão futura:** preferir guard por responsabilidade/import boundary antes de limite bruto de linhas.

### INTORG-004 — Guard arquitetural de imports por camada

**Problema:** a intenção hexagonal existe, mas nem todo limite é mecanicamente protegido.

**Possível feature:** check que valida:

- `domain` não importa `app`, `cli` ou `infrastructure`;
- `app` não importa adapters concretos;
- `cli` não contém regra de negócio;
- `infrastructure` não decide política.

**Risco:** pode exigir exceções para código legado ainda não reorganizado.

**Decisão futura:** introduzir como advisory primeiro se houver muitas violações históricas.

### INTORG-005 — Mapa de ownership/rotas de manutenção

**Problema:** mesmo com pastas melhores, uma pessoa nova pode não saber onde mexer para wizard, review, readiness, site projection ou consumidor.

**Possível feature:** gerar `MAINTAINERS-FLOW.md` ou página visual com "quero mudar X → arquivos e testes relevantes".

**Risco:** documento manual pode ficar stale.

**Decisão futura:** derivar de catálogo de módulos/testes, não escrever à mão.

### INTORG-006 — Fixtures reais para promover transcripts guiados a transcripts executados

**Problema:** parte dos transcripts do site ainda é guiada porque depende de estado `.governance`, git ou GitHub.

**Possível feature:** fixtures governadas de repo/spec/PR para executar `work`, `handoff`, `decide`, `specs` e `peer-review` sem rede.

**Risco:** fixtures podem virar uma segunda realidade se não forem pequenas e auditáveis.

**Decisão futura:** pode entrar na falsificação ampla se necessário para provar site/CLI sem simulação.

### INTORG-007 — Visualização de cobertura BDD antes do Human Gate

**Problema:** antes de Ready/Human Gate, Rosana precisa entender rapidamente o que foi falsificado e o que não foi.

**Possível feature:** relatório visual de cobertura por jornada e risco, gerado dos cenários BDD.

**Risco:** parecer "dashboard verde" e mascarar gaps qualitativos.

**Decisão futura:** se criado, deve mostrar lacunas explicitamente, não só passes.

### INTORG-008 — Comando de inspeção da arquitetura interna

**Problema:** a pessoa mantenedora pode precisar saber se a árvore ainda respeita DDD sem ler imports.

**Possível feature:** `npx ai-guidelines inspect architecture` ou comando interno equivalente para listar camadas, violações e hotspots.

**Risco:** criar mais uma superfície de comando antes de consolidar a arquitetura.

**Decisão futura:** só considerar depois de um guard arquitetural real existir.

## Itens explicitamente fora de escopo do CO-10.8

- mudar a UX pública da CLI;
- alterar copy do site público;
- criar novo fluxo de Ready/Human Gate;
- criar novo PR/nó da Spec 0024;
- transformar todos os testes existentes em BDD;
- bloquear merge por métrica nova sem dogfood;
- criar site de mantenedores sem lastro em testes reais.
