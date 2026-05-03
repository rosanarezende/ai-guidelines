### Regras Globais

> Fonte de verdade: bloco `<AI_GUIDELINES>` compilado no `AGENTS.md`.
> Este arquivo define **princípios de engenharia** aplicáveis a qualquer projeto.
> Para workflow operacional (git, branch, CI, PRs), consulte o `AGENTS.md` do repositório.

---

#### Princípios de Engenharia

1. Sempre responda em **Português do Brasil (PT-BR)**.
2. Não modifique arquivos essenciais ou pontos cegos de arquitetura (ex.: `.env`, dependências fundamentais) sem antes solicitar confirmação.
3. **Acesso Seguro:** chaves de API jamais podem transitar por arquivos do frontend de forma acidental; garanta rigor com arquivos ignorados no `.gitignore`.
4. **Tipagem Estrita (Anti-Hacks):** Nunca ignore o sistema de tipos para acelerar a entrega. O uso de `any`, `as unknown`, manipulação de prototype ou coerções inseguras é proibido. Utilize type-guards, assertions seguras ou genéricos explícitos.
5. **Estado e Mutabilidade:** Prefira sempre estruturas de dados imutáveis e composição de funções (ex: spread operator, métodos de array puros). Evite mutar estado compartilhado globalmente.
6. **Tratamento de Erros (Fail-Fast):** Abrace a falha rápida. Erros devem ser capturados e propagados explicitamente (ou tipados como retorno). É terminantemente proibido o uso de blocos `try-catch` vazios ou que apenas loguem no console sem propagar a falha ou recuperar o estado.
7. **Concorrência e Assincronicidade:** Ao gerenciar promessas ou threads, declare explicitamente a intenção (ex: `Promise.all` para execução paralela de tarefas independentes; `for...of` com `await` para dependentes). Evite fire-and-forget em funções assíncronas críticas sem tratamento de erro acoplado.

#### Eficiência de IA

1. **Model Routing Inteligente:** Use modelos rápidos (ex: Flash, Haiku) para tarefas scoped e repetitivas. Reserve modelos avançados (ex: Pro, Opus) para planejamento arquitetural e decisões complexas.
2. **Feedback Cirúrgico:** Ao iterar sobre código ou artefatos, forneça feedback diretamente no artefato com comentários cirúrgicos. Evite reenviar prompts extensos do zero.
3. **Modularidade (Regra de Ouro):** Divida tarefas complexas em blocos atômicos. Se uma solicitação afetar > 3 arquivos, sugira a quebra em sub-tarefas para preservar contexto e precisão.
4. **Redução de Ruído:** Utilize arquivos de ignore (`.geminiignore`, `.gitignore`, `.claudeignore`) para remover arquivos desnecessários (logs, builds, node_modules) do contexto da IA.
5. **Check de Contexto:** Monitore periodicamente o que a IA está "vendo" (ex: logs de tokens) para evitar deriva de contexto.

#### Workflow com IA

1. **Plan mode antes de agent mode:** antes de qualquer ação executiva (edição de arquivo, comando destrutivo, escrita), reserve pelo menos um ciclo de planejamento explícito. Reforça o ciclo RPI (Research → Plan → Implement).
2. **Referencie um padrão existente ao gerar código novo:** localize um exemplo semelhante no repositório antes de criar do zero. Reduz alucinação e preserva consistência estilística.
3. **PR description colaborativo (3 etapas):** ao escrever ou editar PR description, (1) liste os tópicos relevantes para validação humana antes do texto final; (2) só escreva o texto após o humano editar/aprovar a lista; (3) submeta o texto final para um último check humano antes de criar/editar o PR.
4. **Patterns agnósticos ao LLM:** não codifique expectativas específicas de um modelo ou plataforma; o mesmo baseline deve funcionar em qualquer agente (Claude, Gemini, Codex, equivalentes).
5. **Padrões, não paths:** em regras novas, prefira descrever o padrão ("consulte o baseline de regras injetado") em vez do caminho literal. Paths tendem a quebrar em migrações; padrões sobrevivem. Paths convencionais (`.env`, `.gitignore`) são exceção aceitável.
6. **RPI obrigatório:** antes de implementar, pesquise o estado atual, consolide o plano aprovado e só então execute. O repositório deve preservar specs, planos, tasks e pesquisas quando a iniciativa precisar sobreviver a troca de agente ou sessão.
7. **Tipo de spec é declarado no header (`evidence-driven`, `deterministic`, `mixed`).** Specs `evidence-driven` ou `mixed` exigem um gate humano via `decision-brief.md` antes da implementação — o teste é: _"o design depende de evidência técnica/pesquisa ainda não coletada?"_. Detalhes em `.core/process/spec-foundation.md`.
8. **Contexto enxuto e estável:** mantenha regras e contexto estático no baseline de governança, use o prompt imediato apenas para intenção tática, e evite inserir logs, builds, dependências ou arquivos gerados no contexto da IA.
9. **Routing de esforço:** use modelos rápidos para tarefas locais e repetitivas; reserve modelos avançados ou reasoning para arquitetura, migrações, debugging complexo e decisões de alto impacto.
