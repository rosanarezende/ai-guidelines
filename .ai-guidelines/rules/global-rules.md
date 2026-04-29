# Regras Globais

> Fonte de verdade: `.ai-guidelines/rules/global-rules.md`
> Este arquivo define **princípios de engenharia** aplicáveis a qualquer projeto.
> Para workflow operacional (git, branch, CI, PRs), consulte o `AGENTS.md` do repositório.

---

## Princípios de Engenharia

1. Sempre responda em **Português do Brasil (PT-BR)**.
2. Não modifique arquivos essenciais ou pontos cegos de arquitetura (ex.: `.env`, dependências fundamentais) sem antes solicitar confirmação.
3. **Acesso Seguro:** chaves de API jamais podem transitar por arquivos do frontend de forma acidental; garanta rigor com arquivos ignorados no `.gitignore`.

## Eficiência de IA

4. **Model Routing Inteligente:** Use modelos rápidos (ex: Flash, Haiku) para tarefas scoped e repetitivas. Reserve modelos avançados (ex: Pro, Opus) para planejamento arquitetural e decisões complexas.
5. **Feedback Cirúrgico:** Ao iterar sobre código ou artefatos, forneça feedback diretamente no artefato com comentários cirúrgicos. Evite reenviar prompts extensos do zero.
6. **Modularidade (Regra de Ouro):** Divida tarefas complexas em blocos atômicos. Se uma solicitação afetar > 3 arquivos, sugira a quebra em sub-tarefas para preservar contexto e precisão.
7. **Redução de Ruído:** Utilize arquivos de ignore (`.geminiignore`, `.gitignore`, `.claudeignore`) para remover arquivos desnecessários (logs, builds, node_modules) do contexto da IA.
8. **Check de Contexto:** Monitore periodicamente o que a IA está "vendo" (ex: logs de tokens) para evitar deriva de contexto.

## Governança de Agentes

9. **Diretriz Primária — Git Push:** Nunca execute `git push` de forma autônoma. Todo envio de código ao repositório remoto **exige aprovação humana explícita do mantenedor** antes de ser iniciado. Aplica-se a qualquer agente de IA, script automatizado ou hook que não seja o pipeline oficial do repositório.

## Workflow com IA

10. **Plan mode antes de agent mode:** antes de qualquer ação executiva (edição de arquivo, comando destrutivo, escrita), reserve pelo menos um ciclo de planejamento explícito. Reforça o ciclo RPI (Research → Plan → Implement).
11. **Referencie um padrão existente ao gerar código novo:** localize um exemplo semelhante no repositório antes de criar do zero. Reduz alucinação e preserva consistência estilística.
12. **PR description colaborativo (3 etapas):** ao escrever ou editar PR description, (1) liste os tópicos relevantes para validação humana antes do texto final; (2) só escreva o texto após o humano editar/aprovar a lista; (3) submeta o texto final para um último check humano antes de criar/editar o PR.
13. **Patterns agnósticos ao LLM:** não codifique expectativas específicas de um modelo ou plataforma; o mesmo baseline deve funcionar em qualquer agente (Claude, Gemini, Codex, equivalentes).
14. **Padrões, não paths:** em regras novas, prefira descrever o padrão ("consulte o baseline de regras injetado") em vez do caminho literal. Paths tendem a quebrar em migrações; padrões sobrevivem. Paths convencionais (`.env`, `.gitignore`) são exceção aceitável.
15. **RPI obrigatório:** antes de implementar, pesquise o estado atual, consolide o plano aprovado e só então execute. O repositório deve preservar specs, planos, tasks e pesquisas quando a iniciativa precisar sobreviver a troca de agente ou sessão.
16. **Contexto enxuto e estável:** mantenha regras e contexto estático no baseline de governança, use o prompt imediato apenas para intenção tática, e evite inserir logs, builds, dependências ou arquivos gerados no contexto da IA.
17. **Routing de esforço:** use modelos rápidos para tarefas locais e repetitivas; reserve modelos avançados ou reasoning para arquitetura, migrações, debugging complexo e decisões de alto impacto.
