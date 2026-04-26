# Pesquisa A.6 — Análise do repositório `multica-ai/multica`

## 1. Resumo

`multica` é uma plataforma AI-native de colaboração com agentes, com narrativa forte de “agentes como teammates”, stack moderna e governança técnica robusta para contribuição. Para `ai-guidelines`, os maiores aprendizados estão em: clareza de posicionamento no README, qualidade de `AGENTS.md/CLAUDE.md` como contratos técnicos e rigor operacional de contribuição. Em contrapartida, a higiene OSS não está completa (ausência visível de `SECURITY.md` e `CODE_OF_CONDUCT.md` no root).

## 2. URLs consultadas (acesso em 2026-04-20)

- https://github.com/multica-ai/multica
- https://github.com/multica-ai/multica/blob/main/README.md
- https://github.com/multica-ai/multica/blob/main/AGENTS.md
- https://github.com/multica-ai/multica/blob/main/CLAUDE.md
- https://github.com/multica-ai/multica/blob/main/CONTRIBUTING.md
- https://github.com/multica-ai/multica/blob/main/LICENSE
- https://github.com/multica-ai/multica/tree/main/.github
- https://github.com/multica-ai/multica/tree/main/docs
- https://github.com/multica-ai/multica/blob/main/.github/workflows/ci.yml

## 3. Estrutura do repo

`README.md` apresenta arquitetura multicamada (Next.js + Go + PostgreSQL + daemon local de agentes), instalação cross-platform e fluxo inicial de uso orientado a execução real de tarefas por agentes (README).  
O repo também inclui:

- `AGENTS.md` curto e objetivo apontando para `CLAUDE.md` como fonte principal.
- `CLAUDE.md` detalhado com regras arquiteturais, boundaries de pacotes, regras de estado e teste.
- `CONTRIBUTING.md` extenso com fluxo de setup, worktrees e operação local/isolada.
- `.github/ISSUE_TEMPLATE/*` e `.github/PULL_REQUEST_TEMPLATE.md`.
- CI com jobs de frontend e backend em `.github/workflows/ci.yml`.

## 4. OSS hygiene

**Pontos fortes**

- Possui LICENSE explícita e CONTRIBUTING estruturado.
- Possui templates de issue e PR no `.github` e pipelines de CI/release (`.github/workflows/ci.yml`, `release.yml`).

**Pontos de atenção**

- O `LICENSE` aplica “Apache-2.0 modificado” com restrições para serviço hospedado/embedded, o que aumenta fricção para adoção em OSS tradicional.
- Não há `SECURITY.md` e `CODE_OF_CONDUCT.md` visíveis no root (checagem direta dos paths e listagem de `.github`).

## 5. AI-first dev patterns

O duo `AGENTS.md` + `CLAUDE.md` é o maior diferencial:

- `AGENTS.md` funciona como ponte curta para documentação canônica.
- `CLAUDE.md` explicita regras difíceis de inferir (ownership de estado entre React Query e Zustand, boundaries de pacotes, restrições de navegação cross-platform, anti-duplicação e procedimentos de teste).

Esse padrão é diretamente adaptável para `ai-guidelines`: um arquivo curto para roteamento + um arquivo denso com regras de execução e arquitetura.

## 6. README narrative

O README de `multica` é exemplar em narrativa pública:

- mensagem central clara (“Your next 10 hires won’t be human”);
- proposta de valor concreta;
- quick install por SO;
- getting started orientado a resultado;
- comparativo competitivo (“Multica vs Paperclip”).

Esse modelo é útil para evoluir o README do `ai-guidelines` de “guia técnico” para “produto OSS com posicionamento”.

## 7. Testing patterns

- CI explícito para frontend e backend com ambientes versionados (`Node 22`, `Go 1.26.1`, `pgvector`).
- Contributing documenta fluxo de checks e testes ponta a ponta.
- `CLAUDE.md` contém regras de “onde testar” por camada, reduzindo teste redundante e erro de boundary.

## 8. Insights aplicáveis ao `ai-guidelines`

1. **Adotar padrão docs em camadas**: `AGENTS.md` enxuto + `CLAUDE.md` detalhado.
2. **Fortalecer narrativa pública do README**: proposta de valor, quick start, arquitetura e comparação de posicionamento.
3. **Formalizar governance de contribuição** com templates + checklist de PR + disclosure de uso de IA.
4. **CI declarativo e previsível** por stack/linguagem com pré-requisitos explícitos.

## 9. O que NÃO vale copiar

- Licença com restrição de hosted/embedded service para o caso do `ai-guidelines` (objetivo da spec 0004 é “public-ready” com adoção ampla).
- Complexidade de operação/worktree além do necessário para um framework de governança/documentação.

## 10. Recomendação consolidada para spec 0004

1. Copiar a arquitetura documental de `multica` (ponte + canon), não a complexidade operacional.
2. Completar baseline de hygiene OSS em `ai-guidelines` com `LICENSE` permissiva, `CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`, templates.
3. Atualizar README para narrativa de produto OSS AI-first, com quick start real e posicionamento explícito.
