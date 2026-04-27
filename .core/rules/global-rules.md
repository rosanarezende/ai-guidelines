# Regras Globais

> Fonte de verdade: `ai-guidelines/rules/global-rules.md`
> Este arquivo define **princípios de engenharia** aplicáveis a qualquer projeto.
> Para workflow operacional (git, branch, CI, PRs), consulte o `AGENTS.md` do repositório.

---

## Princípios de Engenharia

1. Sempre responda em **Português do Brasil (PT-BR)**.
2. Não modifique arquivos essenciais ou pontos cegos de arquitetura (ex.: `.env`, dependências fundamentais) sem antes solicitar confirmação.
3. Acesso Seguro: chaves de API jamais podem transitar por arquivos do frontend de forma acidental; garanta rigor com arquivos ignorados no `.gitignore`.

## Design & Frontend

4. Antes de iniciar qualquer layout de Frontend, examine a pasta `/design/inspirations/` (ou equivalente no repositório) para extrair os guias visuais e de design do projeto.
5. Em caso de dúvidas de design, consulte sempre `constraints.md` para saber quais abordagens NUNCA seguir.
6. Para padrões técnicos de UI e IA, consulte os guias correspondentes no repositório fonte do ai-guidelines.

## Eficiência de IA

7. **Model Routing Inteligente:** Use modelos rápidos (ex: Flash, Haiku) para tarefas scoped e repetitivas. Reserve modelos avançados (ex: Pro, Opus, GPT-4o) para planejamento arquitetural e decisões complexas.
8. **Feedback Cirúrgico:** Ao iterar sobre código ou artefatos, forneça feedback diretamente no artefato com comentários cirúrgicos. Evite reenviar prompts extensos do zero.
9. **Modularidade (Regra de Ouro):** Divida tarefas complexas em blocos atômicos. Se uma solicitação afetar > 3 arquivos, sugira a quebra em sub-tarefas para preservar contexto e precisão.
10. **Redução de Ruído:** Utilize arquivos de ignore (`.geminiignore`, `.gitignore`, `.claudeignore`) para remover arquivos desnecessários (logs, builds, node_modules) do contexto da IA.
11. **Check de Contexto:** Monitore periodicamente o que a IA está "vendo" (ex: `/memory show` ou logs de tokens) para evitar deriva de contexto.
12. **Guia Profundo:** Para estratégias avançadas (Prompt Caching, matriz de modelos 2026), consulte o repositório fonte do ai-guidelines.

## Governança de Agentes

13. **Diretriz Primária — Git Push:** Nunca execute `git push` de forma autônoma. Todo envio de código ao repositório remoto **exige aprovação humana explícita do mantenedor** antes de ser iniciado. Aplica-se a qualquer agente de IA, script automatizado ou hook que não seja o pipeline oficial do repositório.

## Workflow com IA

14. **Plan mode antes de agent mode:** antes de qualquer ação executiva (edição de arquivo, comando destrutivo, escrita), reserve pelo menos um ciclo de planejamento explícito. Reforça o ciclo RPI (Research → Plan → Implement).
15. **Referencie um padrão existente ao gerar código novo:** localize um exemplo semelhante no repositório antes de criar do zero. Reduz alucinação e preserva consistência estilística.
16. **PR description colaborativo (3 etapas):** ao escrever ou editar PR description, (1) liste os tópicos relevantes para validação humana antes do texto final; (2) só escreva o texto após o humano editar/aprovar a lista; (3) submeta o texto final para um último check humano antes de criar/editar o PR.
17. **Patterns agnósticos ao LLM:** não codifique expectativas específicas de um modelo ou plataforma; o mesmo baseline deve funcionar em qualquer agente (Claude, Gemini, Codex, equivalentes).
18. **Padrões, não paths:** em regras novas, prefira descrever o padrão ("consulte o baseline de regras injetado") em vez do caminho literal. Paths tendem a quebrar em migrações; padrões sobrevivem. Paths convencionais (`.env`, `.gitignore`) são exceção aceitável.
