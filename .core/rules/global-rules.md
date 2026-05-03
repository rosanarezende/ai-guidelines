### Regras Globais

> Fonte de verdade: bloco `<AI_GUIDELINES>` compilado no `AGENTS.md`.
> Este arquivo define **princípios de engenharia** aplicáveis a qualquer projeto.
> Para workflow operacional (git, branch, CI, PRs), consulte o `AGENTS.md` do repositório.

---

#### Princípios de Engenharia

1. **Acesso Seguro:** chaves de API jamais podem transitar por arquivos do frontend de forma acidental; garanta rigor com arquivos ignorados no `.gitignore`.
2. **Tipagem Estrita (Anti-Hacks):** Nunca ignore o sistema de tipos para acelerar a entrega. O uso de `any`, `as unknown`, manipulação de prototype ou coerções inseguras é proibido. Utilize type-guards, assertions seguras ou genéricos explícitos.
3. **Estado e Mutabilidade:** Prefira sempre estruturas de dados imutáveis e composição de funções (ex: spread operator, métodos de array puros). Evite mutar estado compartilhado globalmente.
4. **Tratamento de Erros (Fail-Fast):** Abrace a falha rápida. Erros devem ser capturados e propagados explicitamente (ou tipados como retorno). É terminantemente proibido o uso de blocos `try-catch` vazios ou que apenas loguem no console sem propagar a falha ou recuperar o estado.
5. **Concorrência e Assincronicidade:** Ao gerenciar promessas ou threads, declare explicitamente a intenção (ex: `Promise.all` para execução paralela de tarefas independentes; `for...of` com `await` para dependentes). Evite fire-and-forget em funções assíncronas críticas sem tratamento de erro acoplado.

#### Workflow com IA

1. **Tipo de spec é declarado no header (`evidence-driven`, `deterministic`, `mixed`).** Specs `evidence-driven` ou `mixed` exigem um gate humano via `decision-brief.md` antes da implementação — o teste é: _"o design depende de evidência técnica/pesquisa ainda não coletada?"_. Detalhes em `.core/process/spec-foundation.md`.

---

#### Convenções do Owner

> Regras pragmáticas mantidas por decisão do mantenedor do `ai-guidelines`. **Não têm source canônica externa** (CWE/CERT/Sonar/OWASP/paper) — vivem aqui por dor real e aprendizado prático, podendo não generalizar para todo repositório. Categoria editorialmente segregada do núcleo evidence-driven acima. Reorganização definitiva (opt-in module dedicado vs. seção segregada permanente) fica para Spec 0018 sub-bloco B.4.

1. **Idioma do repositório:** responda no idioma padrão do projeto (neste repo: **PT-BR**).
2. **Redução de Ruído:** utilize arquivos de ignore (`.geminiignore`, `.gitignore`, `.claudeignore`) para remover arquivos desnecessários (logs, builds, `node_modules`) do contexto da IA. Candidata a virar automação na spec futura "Scaffolding Inteligente de Provedores".
3. **PR description colaborativo (3 etapas):** ao escrever ou editar PR description, (1) liste os tópicos relevantes para validação humana antes do texto final; (2) só escreva o texto após o humano editar/aprovar a lista; (3) submeta o texto final para um último check humano antes de criar/editar o PR.
