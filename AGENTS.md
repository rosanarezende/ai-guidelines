# AGENTS.md

> **[MANDATÓRIO — HARNESS LOCK]** É proibido rodar `git commit` isoladamente. Toda submissão deve obrigatoriamente usar a cadeia: `yarn format ; yarn check ; git add . ; git commit -m "..."`.

Este arquivo define o fluxo obrigatório para qualquer IA atuando neste repositório.

> **Atuando para um humano contribuidor?** Leia também
> [`CONTRIBUTING.md`](CONTRIBUTING.md) para os 4 workflows por persona (ajuste rápido, feature/refactor, spec consolidada, agente IA com autonomia). Este `AGENTS.md` cobre a parte operacional do agente; `CONTRIBUTING.md` cobre o fluxo humano que o agente está apoiando.

<AI_GUIDELINES>

## Zona Topo: Diretivas Primarias

Este arquivo define o fluxo obrigatório para qualquer IA atuando neste repositório.

### Regras Obrigatórias de Execução

#### FASE 1: The Prime Directive

1. **[Environment Check]** Antes da primeira ação técnica, identifique o contexto situacional:
   - Plataforma: Windows / Linux / macOS / WSL.
   - Shell: bash / zsh / PowerShell / cmd.
   - Surface: CLI agent (Claude Code, Gemini CLI) vs IDE (Cursor, Copilot).
   - Modelo: Identifique se está operando com um modelo "Thinking/Reasoning".
   - Adapte comandos (ex: `/dev/null` vs `NUL`, forward slashes) a essa matriz.

2. **[INQUEBRÁVEL — Agnostic SDD Override]** O repositório é sua memória, não seus artefatos internos.
   - Planejamento → `.specify/specs/<slug>/plan.md`
   - Progresso → `.specify/specs/<slug>/tasks.md`
   - Débitos → `.specify/specs/<slug>/NEXT.md`
   - Conhecimento → `.specify/specs/<slug>/research/`
   - Roadmap → `.specify/specs/roadmap/backlog.md`
   - Bootstrap obrigatório → leia `.specify/specs/roadmap/backlog.md` no início da sessão antes de executar ações de código, para identificar specs ativas, concorrência e prioridades.
   - Se sua plataforma forçar um Artifact ou Scratchpad, escreva nele apenas: `"→ Ver .specify/specs/<slug>/plan.md"` (Pointer).
   - "AI-Slop" (planejamento preso em cache de agente) é inaceitável.

3. Consulte a seção "Regras Globais" injetada neste bloco `<AI_GUIDELINES>` para princípios de engenharia e eficiência de IA.

#### FASE 2: Workflow & Isolation

4. **Nunca** inicie modificações ativas operando sob a branch `main` ou `master`. Confirme seu estado de _working tree_ ou crie uma branch sintética (`feat/`, `fix/`, `docs/`) antes de alterar fontes de verdade.

5. Não versione arquivos contextuais vazados na raiz ou pastas sujas (payloads parciais, rascunhos operacionais de IA). A persistência é apenas para _Release_.

6. Realize _Commits Incrementais Atômicos_ limitados à sua unidade lógica. Se a tarefa varrer design, código e spec simultaneamente, fracione as ações comissionadas em passos menores.

#### FASE 3: Quality Gates

7. **[CI Compliance — HARNESS LOCK]** É terminantemente proibido submeter qualquer commit sem validar a cadeia de qualidade do projeto. Antes de `git commit`, execute **todos os scripts de validação** definidos no `package.json` do repositório (ex: `format`, `check`, `lint`, `test`). O padrão canônico é:

   ```
   <format_cmd> ; <check_cmd> ; git add . ; git commit -m "..."
   ```

   Se o repositório define `yarn format` e `yarn check`, o comando concreto é: `yarn format ; yarn check ; git add . ; git commit -m "..."`. Adapte aos scripts do projeto — a regra é a **cadeia**, não o gerenciador.

8. A submissão de Pull Requests obrigatoriamente se inaugura no modo `Draft`, utilizando integralmente a matriz `.github/pull_request_template.md`.

9. Converta a operação de `Draft` para `Ready` apenas através da revalidação afirmativa Humana.

#### FASE 4: Communication & Agility

10. **Aja apenas mediante Plano Formado.** Antes de executar qualquer código, escolha a granularidade:

    | Critério      | Use `spec-foundation`                 | Use `plano leve`                          |
    | ------------- | ------------------------------------- | ----------------------------------------- |
    | Duração       | > 1 sessão                            | 1 sessão                                  |
    | Escopo        | > 1 arquivo fora de feature isolada   | Ajuste pontual, local                     |
    | Sobrevivência | Precisa sobreviver troca de IA/sessão | Descartável                               |
    | Onde vive     | `.specify/specs/<slug>/` (versionado) | Scratchpad da ferramenta (não versionado) |

11. **Checkpoints antes de ação.** Após absorver contexto extenso (múltiplos arquivos, specs, pesquisas), retorne um Checkpoint resumido e peça aprovação humana **antes** de executar Code Actions.

12. **Artefatos vivos.** Mantenha atualizados os artefatos SDD durante o trabalho:
    - `tasks.md` → marque cada item como `[/]` (em progresso) ou `[x]` (concluído) a cada passo.
    - `NEXT.md` → registre débitos, bugs ou insights sem prioridade imediata.
    - **Nunca crie arquivos paralelos de roteirização.** Planos leves vivem na ferramenta, não no repositório.

### Regras Globais

> Fonte de verdade: bloco `<AI_GUIDELINES>` compilado no `AGENTS.md`.
> Este arquivo define **princípios de engenharia** aplicáveis a qualquer projeto.
> Para workflow operacional (git, branch, CI, PRs), consulte o `AGENTS.md` do repositório.

---

#### Princípios de Engenharia

1. Sempre responda em **Português do Brasil (PT-BR)**.
2. Não modifique arquivos essenciais ou pontos cegos de arquitetura (ex.: `.env`, dependências fundamentais) sem antes solicitar confirmação.
3. **Acesso Seguro:** chaves de API jamais podem transitar por arquivos do frontend de forma acidental; garanta rigor com arquivos ignorados no `.gitignore`.

#### Eficiência de IA

4. **Model Routing Inteligente:** Use modelos rápidos (ex: Flash, Haiku) para tarefas scoped e repetitivas. Reserve modelos avançados (ex: Pro, Opus) para planejamento arquitetural e decisões complexas.
5. **Feedback Cirúrgico:** Ao iterar sobre código ou artefatos, forneça feedback diretamente no artefato com comentários cirúrgicos. Evite reenviar prompts extensos do zero.
6. **Modularidade (Regra de Ouro):** Divida tarefas complexas em blocos atômicos. Se uma solicitação afetar > 3 arquivos, sugira a quebra em sub-tarefas para preservar contexto e precisão.
7. **Redução de Ruído:** Utilize arquivos de ignore (`.geminiignore`, `.gitignore`, `.claudeignore`) para remover arquivos desnecessários (logs, builds, node_modules) do contexto da IA.
8. **Check de Contexto:** Monitore periodicamente o que a IA está "vendo" (ex: logs de tokens) para evitar deriva de contexto.

#### Governança de Agentes

9. **Diretriz Primária — Git Push:** Nunca execute `git push` de forma autônoma. Todo envio de código ao repositório remoto **exige aprovação humana explícita do mantenedor** antes de ser iniciado. Aplica-se a qualquer agente de IA, script automatizado ou hook que não seja o pipeline oficial do repositório.

#### Workflow com IA

10. **Plan mode antes de agent mode:** antes de qualquer ação executiva (edição de arquivo, comando destrutivo, escrita), reserve pelo menos um ciclo de planejamento explícito. Reforça o ciclo RPI (Research → Plan → Implement).
11. **Referencie um padrão existente ao gerar código novo:** localize um exemplo semelhante no repositório antes de criar do zero. Reduz alucinação e preserva consistência estilística.
12. **PR description colaborativo (3 etapas):** ao escrever ou editar PR description, (1) liste os tópicos relevantes para validação humana antes do texto final; (2) só escreva o texto após o humano editar/aprovar a lista; (3) submeta o texto final para um último check humano antes de criar/editar o PR.
13. **Patterns agnósticos ao LLM:** não codifique expectativas específicas de um modelo ou plataforma; o mesmo baseline deve funcionar em qualquer agente (Claude, Gemini, Codex, equivalentes).
14. **Padrões, não paths:** em regras novas, prefira descrever o padrão ("consulte o baseline de regras injetado") em vez do caminho literal. Paths tendem a quebrar em migrações; padrões sobrevivem. Paths convencionais (`.env`, `.gitignore`) são exceção aceitável.
15. **RPI obrigatório:** antes de implementar, pesquise o estado atual, consolide o plano aprovado e só então execute. O repositório deve preservar specs, planos, tasks e pesquisas quando a iniciativa precisar sobreviver a troca de agente ou sessão.
16. **Contexto enxuto e estável:** mantenha regras e contexto estático no baseline de governança, use o prompt imediato apenas para intenção tática, e evite inserir logs, builds, dependências ou arquivos gerados no contexto da IA.
17. **Routing de esforço:** use modelos rápidos para tarefas locais e repetitivas; reserve modelos avançados ou reasoning para arquitetura, migrações, debugging complexo e decisões de alto impacto.

### Adaptador: Claude (Anthropic)

> Diretrizes complementares para agentes baseados em modelos Anthropic Claude.
> Estas regras **complementam** (não substituem) o `global-rules.md`.

---

#### Model Routing

- **Haiku / Sonnet leve:** tarefas atômicas de codificação, formatação, refatoração scoped.
- **Sonnet / Opus:** planejamento arquitetural, análise de múltiplos arquivos, decisões de design complexas.

#### Contexto e Ignore

- Utilize `.claudeignore` na raiz do repositório para controlar quais arquivos a IA carrega no contexto.
- O formato segue o padrão `.gitignore`.
- Claude carrega automaticamente o `AGENTS.md` da raiz — garanta que o bloco `<AI_GUIDELINES>` esteja presente.

#### Comportamento Observado

- Claude tende a ser verboso por padrão. As Global Rules já instruem respostas sucintas — reforce se necessário com "seja conciso" no prompt.
- Em sessões longas, Claude pode perder contexto de arquivos lidos no início. Use `/clear` ou reinicie a sessão quando perceber repetição de erros.
- Claude Code respeita `CLAUDE.md` na raiz — este arquivo pode conter instruções específicas do projeto que complementam o baseline injetado.

### Adaptador: Codex / Copilot (OpenAI)

> Diretrizes complementares para agentes baseados em modelos OpenAI (Codex, GPT-4o) e integrações via GitHub Copilot.
> Estas regras **complementam** (não substituem) o `global-rules.md`.

---

#### Integração com IDE

- Copilot lê automaticamente o `AGENTS.md` da raiz do repositório.
- Para instruções específicas do projeto no Copilot Chat, utilize `.github/copilot-instructions.md` — este arquivo é carregado como contexto adicional pelo Copilot.
- Utilize comentários estruturados e JSDoc para auxiliar a conclusão de código em tempo real.

#### Contexto e Ignore

- Copilot respeita o `.gitignore` do repositório por padrão.
- Para refinamentos de contexto no Copilot Chat, utilize referências diretas a arquivos via `#file`.
- Codex CLI respeita `AGENTS.md` e `.codex/instructions.md` — garanta que o bloco `<AI_GUIDELINES>` esteja presente.

#### Comportamento Observado

- Copilot inline tende a completar código baseado no contexto imediato (arquivo aberto + imports). Mantenha arquivos focados e com imports explícitos para melhores sugestões.
- Codex em modo autônomo segue instruções de `AGENTS.md` rigorosamente — garanta que as regras de governança (ex: não fazer push) estejam claras.

### Adaptador: Gemini (Google)

> Diretrizes complementares para agentes baseados em modelos Google Gemini e a CLI Gemini.
> Estas regras **complementam** (não substituem) o `global-rules.md`.

---

#### Integração com CLI

- Gemini CLI carrega automaticamente `GEMINI.md` na raiz e `~/.gemini/GEMINI.md` como config global.
- Para instruções específicas do projeto, utilize `GEMINI.md` na raiz do repositório.
- O `AGENTS.md` da raiz também é carregado — garanta que o bloco `<AI_GUIDELINES>` esteja presente.

#### Skills Globais

As skills globais (ferramentas personalizadas) residem em `~/.gemini/skills/`.

> [!TIP]
> Periodicamente, remova scripts que não utiliza ativamente, pois eles são carregados como tokens de "System Prompt" em todas as interações e podem degradar a performance do modelo.

---

#### Estratégia de Ignore

Utilize o arquivo `.geminiignore` na raiz de cada repositório para gerenciar a economia de tokens. Ele evita que arquivos de build, logs e binários poluam o contexto do modelo.

#### Exemplo de `.geminiignore` recomendado:

```gitignore
# Secrets (crítico)
.env
.env.*
!.env.example

# Binários e Media
**/*.png
**/*.jpg
**/*.pdf
**/*.woff
**/*.mp4

# Build, Cache & Lockfiles
.next/
dist/
build/
.cache/
*.tsbuildinfo
yarn.lock
package-lock.json

# Logs
*.log
logs/

# IDE
.vscode/
.idea/
```

---

#### Comportamento Observado

- Em sessões longas, use o conceito de "checkpoints" (salvar progresso em artefatos) para evitar perda de contexto.
- Gemini tende a ser proativo em executar comandos — as Global Rules já restringem git push, mas reforce em tarefas destrutivas.
- Para projetos com muitos arquivos, o `.geminiignore` é crítico — sem ele, o modelo pode gastar tokens lendo `node_modules`, builds e lockfiles.

---

## Zona Centro: Metodologias Opt-in

<FEATURE_QUALITY_GATES>

### Quality Gates: Governança de Código Gerado por IA

> **Aviso:** O "Senior Review" humano permanece obrigatório para decisões arquiteturais, capacidade de carga e tradeoffs de longo prazo. Estes gates automatizam a detecção de bugs locais e estrutura de código.

---

#### Gates de Aceite (Checklist)

1. **Análise Estática:**
   - Complexidade ciclomática mantida sob controle (módulos pequenos e focados).
   - Ausência de dependências circulares.
   - Nomes de variáveis e funções seguem a semântica do projeto (PT-BR ou EN conforme convenção local).

2. **Cobertura e Mutação:**
   - **Cobertura de Testes:** Mínimo recomendado de **85%**.
   - **Mutation Testing:** Mínimo de **60%** de kill rate (garante que os testes realmente validam a lógica).

3. **Bugs Típicos de IA (Sensores):**
   - **Race Conditions:** Verificação de acessos concorrentes em estado compartilhado.
   - **N+1 Queries:** Verificação de eficiência em loops de dados/APIs.
   - **Memory Leaks:** Fechamento correto de recursos, streams e listeners.
   - _Ferramentas recomendadas:_ Property-based testing (ex: fast-check em JS, Hypothesis em Python).

4. **Security & Secrets:**
   - Bloqueio de submissão de chaves, tokens ou credenciais (mesmo em comentários).
   - Validação de inputs contra injeção de código.

---

#### Regras para Agentes de IA

- Ao finalizar uma implementação, execute o checklist acima antes de reportar "done".
- Se algum gate falhar, corrija antes de prosseguir — não delegue ao humano erros detectáveis por automação.
- Em projetos com CI configurado, confirme que o pipeline está verde antes de considerar a tarefa concluída.

</FEATURE_QUALITY_GATES>

<FEATURE_TDD>

### TDD: Desenvolvimento Guiado por Testes (Red-Green-Refactor)

> Esta regra instrui agentes de IA a seguirem o ciclo TDD estrito.
> **Foco:** estrutura de código, ciclo de feedback e cobertura.

---

#### Ciclo Obrigatório (Strict TDD)

Toda nova funcionalidade ou correção de bug DEVE seguir este ciclo:

1. **RED:** Escreva um teste que falhe — defina o comportamento esperado antes de qualquer implementação.
2. **GREEN:** Escreva o código mínimo necessário para fazer o teste passar. Sem otimizações prematuras.
3. **REFACTOR:** Melhore o código (nomes, estrutura, DRY) mantendo todos os testes verdes.

> **Regra:** Nunca pule o passo RED. Código sem teste que falhou primeiro não é TDD.

---

#### Princípios Estruturais

- **Um Teste, Uma Intenção:** Cada caso de teste valida exatamente um comportamento. Evite testes "omni-bus".
- **Isolamento:** Testes unitários não devem depender de serviços externos, rede ou banco de dados. Use mocks/stubs para dependências.
- **Colocation:** Arquivos de teste devem ficar no mesmo diretório que o código testado (ex: `engine.mjs` → `engine.test.mjs`).
- **Cobertura como Gate:** Mínimo recomendado de **85%** de cobertura de linhas. Exceções devem ser documentadas.
- **Rastreabilidade:** Quando uma regra de negócio tiver identificador `[BR-*]`, o teste que a valida deve carregar o mesmo identificador no nome.

---

#### Regras para Agentes de IA

- Ao receber uma tarefa, escreva os testes ANTES da implementação.
- Gere casos de borda (edge cases) baseados na spec antes de implementar a lógica.
- Se um teste existente quebrar durante refatoração, corrija-o antes de prosseguir.
- Nunca delete ou desabilite testes para fazer o build passar.
- Em frameworks com cobertura mandatória, trate queda de coverage como falha de implementação, não como detalhe de CI.

</FEATURE_TDD>

<FEATURE_BDD>

### BDD: Comportamento Guiado por Testes (Dado/Quando/Então)

> Esta regra instrui agentes de IA a estruturarem testes no formato BDD.
> **Foco:** linguagem ubíqua, rastreabilidade e documentação viva.

---

#### Formato Obrigatório

Todos os testes DEVEM usar a estrutura **DADO / QUANDO / ENTÃO** em Português do Brasil:

- **DADO** [cenário inicial / pré-condição / estado do sistema]
- **QUANDO** [ação executada pelo usuário ou sistema]
- **ENTÃO** [resultado esperado / asserção]

#### Exemplo

```javascript
it("DADO usuário sem permissão QUANDO tenta acessar painel ENTÃO retorna erro 403", () => {
  // ...
});
```

---

#### Rastreabilidade (Business Rules)

- Cada regra de negócio documentada DEVE ter um identificador único (ex: `[BR-CLI-SYNC-01]`).
- Os testes que validam essa regra DEVEM incluir o identificador no nome.
- Isso garante que qualquer regressão seja rastreável até a spec original.

```javascript
it("[BR-CLI-SYNC-01] DADO baseline desatualizado QUANDO executado adopt ENTÃO sincroniza apenas arquivos alterados", () => {
  // ...
});
```

---

#### Princípios BDD

- **Linguagem Ubíqua:** Testes devem ser legíveis por humanos não-técnicos. Evite jargão de implementação nos nomes.
- **Documentação Viva:** A suíte de testes serve como documentação executável do sistema. Se o teste não descreve o comportamento com clareza, reescreva-o.
- **Cenários Atômicos:** Cada `it()` descreve exatamente um cenário. Não combine múltiplos fluxos.

---

#### Regras para Agentes de IA

- Ao criar testes, SEMPRE use o formato DADO/QUANDO/ENTÃO no nome do caso de teste.
- Ao receber uma business rule (`[BR-*]`), inclua o ID no teste correspondente.
- Gere cenários para fluxo feliz, fluxo alternativo e casos de erro.
- Priorize legibilidade sobre concisão nos nomes dos testes.
- Mantenha cada cenário atômico: um `it()` deve expressar uma intenção de negócio observável.

</FEATURE_BDD>

---

## Zona Base: Contexto Tatico

> [!IMPORTANT]
> Este projeto utiliza o framework **ai-guidelines** para governança de IA.
> As diretrizes operacionais e regras de engenharia ficam compiladas no bloco `<AI_GUIDELINES>` do `AGENTS.md`.

### 🧠 Governança Centralizada

O `AGENTS.md` da raiz é o artefato runtime. Conteúdo próprio do projeto deve ficar fora de `<AI_GUIDELINES>`.

</AI_GUIDELINES>
