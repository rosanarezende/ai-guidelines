# Plan — Spec 0016 Adapters Opt-in (Trackers)

> Spec: [`./spec.md`](./spec.md)
> Status: Draft <!-- Draft | Active | Done -->

> **Vive durante a execução.** Diferente da `spec.md` (imutável após In Review),
> este arquivo é atualizado conforme o entendimento técnico evolui. Decisões
> revisitadas devem registrar a anterior em nota, não apagar o histórico.

---

## 🏗️ Design e Arquitetura

### Princípio guia

Extender a fundação das features opt-in criada na Spec 0005/0008 para suportar "Trackers". Cada tracker será uma feature modular do CLI, fornecendo arquivos markdown de regras específicas para ensinar agentes a interagir com as plataformas externas e manter o estado da Spec sincronizado.

### Componentes ou Sub-blocos

#### [A | Módulos CLI de Trackers]

**Estado atual**:
Hoje o CLI sincroniza regras universais e algumas de processo (`quality-gates`, `tdd`, `bdd`). Não há suporte a adaptação para tracking system externo.

**Decisão**:
Criaremos os arquivos para cada feature opt-in correspondente aos trackers:

- `tracker-github`
- `tracker-jira`
- `tracker-linear`

Cada feature será integrada em `cli/core/cli-input.mjs` no wizard e instanciada pela Engine (`cli/core/engine.mjs`).

**Mudanças em arquivos**:

- `cli/features/opt-in/tracker-github.mjs` — lógica da feature.
- `cli/features/opt-in/tracker-jira.mjs` — lógica da feature.
- `cli/features/opt-in/tracker-linear.mjs` — lógica da feature.
- `cli/core/cli-input.mjs` — adicionar as novas features no `FEATURE_OPTIONS` prompt.

#### [B | Regras Markdowns Opt-in]

**Estado atual**:
Regras universais estão no baseline. Opt-ins estão em `.core/rules/opt-in/`.

**Decisão**:
Adicionar guidelines de como agentes interagem com ferramentas externas e mapeiam Specs SDD para Epics/Issues usando MCP (Model Context Protocol) Servers.

**Mudanças em arquivos**:

- `.core/rules/opt-in/tracker-github.md` — instruções base para uso do Github MCP ou `gh cli`.
- `.core/rules/opt-in/tracker-jira.md` — instruções base para uso do Jira.
- `.core/rules/opt-in/tracker-linear.md` — instruções base para uso do Linear.

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

### Componente [A]

- [ ] Implementação de `tracker-github.mjs`.
- [ ] Implementação de `tracker-jira.mjs`.
- [ ] Implementação de `tracker-linear.mjs`.
- [ ] Wizard do CLI (`cli-input.mjs`) expõe trackers de forma harmoniosa com opções já existentes.

### Componente [B]

- [ ] Arquivos markdown definem claramente a necessidade de MCP servers ou uso de CLI da ferramenta para manter o tracker atualizado com o `tasks.md` / `spec.md`.

### Globais (toda a spec)

- [ ] `yarn check` verde.
- [ ] `yarn test` verde com novos testes unitários para as features opt-in adicionadas.
- [ ] Teste de injeção (`node cli/ai-guidelines-cli.mjs adopt --target ../consumidor`) não quebra repositórios atuais e propõe corretamente os trackers.

---

## 🧪 Estratégia de Testes

- **Unit/BDD**: Novos arquivos `cli/features/opt-in/tracker-*.test.mjs` garantindo que instanciam corretamente sem injetar resíduos caso optados para fora.
- **Manual**: Usar `adopt` em snapshot repo ou pasta limpa selecionando apenas um tracker e garantindo que apenas a rule especificada venha ao ar.

---

## 🛠️ Arquivos modificados (esperado)

- `.core/rules/opt-in/tracker-github.md` — nova regra
- `.core/rules/opt-in/tracker-jira.md` — nova regra
- `.core/rules/opt-in/tracker-linear.md` — nova regra
- `cli/features/opt-in/tracker-github.mjs` — implementação da feature opt-in
- `cli/features/opt-in/tracker-jira.mjs` — implementação da feature opt-in
- `cli/features/opt-in/tracker-linear.mjs` — implementação da feature opt-in
- `cli/features/opt-in/tracker-github.test.mjs` — testes unitários
- `cli/features/opt-in/tracker-jira.test.mjs` — testes unitários
- `cli/features/opt-in/tracker-linear.test.mjs` — testes unitários
- `cli/core/cli-input.mjs` — atualização do prompt wizard

---

## ⚠️ Riscos técnicos (concretos)

| Risco                                                                   | Mitigação                                                                                                                                 |
| :---------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| Excesso de opções no Wizard                                             | Agrupar features de "Trackers" separadamente no Inquirer ou mantê-los organizados no array de escolhas para não poluir visualmente.       |
| Regras enviesadas para o workflow original de uma ferramenta específica | As guidelines opt-in vão focar no conceito de 'mapear' nosso SDD ao invés de usar o lifecycle completo da ferramenta. Um Epic = Uma Spec. |
