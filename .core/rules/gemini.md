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
