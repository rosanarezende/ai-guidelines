# Guia de Setup Gemini (Antigravity)

Este adaptador contém configurações específicas para o modelo Gemini 1.5 Pro/Flash e a CLI Antigravity.

## Comandos Úteis

- `/memory show`: Inspeciona o contexto de memória ativa.
- `/clear`: Limpa a memória de curto prazo para evitar "podridão de contexto" em sessões longas.

---

## Skills Globais

As skills globais (ferramentas personalizadas) residem em `~/.gemini/skills/`.

> [!TIP]
> Periodicamente, remova scripts que não utiliza ativamente, pois eles são carregados como tokens de "System Prompt" em todas as interações e podem degradar a performance do modelo.

---

## Estratégia de Ignore

Utilize o arquivo `.geminiignore` na raiz de cada repositório para gerenciar a economia de tokens. Ele evita que arquivos de build, logs e binários poluam o contexto do modelo.

### Exemplo de `.geminiignore` recomendado:

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

## Contexto de Projetos

Mantenha o mapeamento de seus projetos ativos em `~/.gemini/projects.md` (não versionado).
Para estruturar seu índice local, consulte o template `project-config-boilerplate.md` no repositório fonte do `ai-guidelines` (em `.specify/templates/`).
