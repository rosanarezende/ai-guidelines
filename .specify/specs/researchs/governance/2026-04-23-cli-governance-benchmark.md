# Research: Benchmark de Governança e Decisões Técnicas (Spec 0005)

Este documento consolida as pesquisas de mercado e as decisões arquiteturais validadas para a Spec 0005, estabelecendo os fundamentos para a governança de 2026.

## 1. Benchmark de Mercado: Governança de Projetos

Analisamos como grandes players e ferramentas de código aberto lidam com a padronização de repositórios.

### 1.1. Husky v9 (Camada Operacional)

- **O que é**: O padrão de facto para gestão de Git Hooks.
- **Diferencial**: O `ai-guidelines` **gerencia** o Husky. Enquanto o Husky foca na execução técnica, nós garantimos a governança do conteúdo do hook, injetando e sincronizando-os via `adopt`.

### 1.2. Backstage.io (Camada de Inception)

- **O que é**: IDP da Spotify que usa "Software Templates".
- **Diferencial (Arquitetura de Ponteiros)**: O Backstage exige infraestrutura complexa. Nossa solução é **Git-Native**. Através do sistema de ponteiros no `AGENTS.md`, atualizamos a governança sem o overhead de sub-módulos ou portais centralizados. É a "Governança Ágil".

### 1.3. Cursor & GitHub Copilot (Modular Rules)

- **Cursor**: Migrou de `.cursorrules` (root) para `.cursor/rules/*.mdc` (modular).
- **Nossa Decisão**: Adotamos o namespacing `.ai-guidelines/` para isolar o framework e manter a raiz limpa, usando o `AGENTS.md` apenas como ponteiro mandatório.

## 2. Decisões Técnicas de Implementação

### 2.1. Suporte a Monorepos (Cascading)

- **Mecânica**: IAs buscam o `AGENTS.md` mais próximo.
- **Implementação**: Detecção via `package.json#workspaces`. Oferecemos "Root Adopt" (global) ou "Package Adopt" (ponteiro para a raiz + regras locais).

### 2.2. Higiene Cross-Platform (Windows/POSIX)

- **Permissões**: `chmod +x` falha no Windows. Solução: Usar `git add --chmod=+x <path>` via CLI para persistir o bit de execução no Git de forma agnóstica.
- **Fim de Linha (EOL)**: Evitar `stat-dirty` no Windows. Injeção mandatória de `.gitattributes` com `* text=auto` e `*.sh text eol=lf`.

### 2.3. Detecção de Package Manager

- **Diferenciação**:
  - **Yarn Classic (v1)**: via `yarn.lock` sem `.yarn/releases`.
  - **Yarn Modern (v4)**: via `.yarn/releases` ou campo `packageManager`.
- **Ação**: O Wizard ajusta comandos (ex: `yarn dlx` vs `yarn`) dinamicamente.

## 3. Infraestrutura de Testes: Node.js 24

### 3.1. Configuração Nativa

- **Config**: Uso do `node.config.json` com namespace `testRunner`.
- **BDD**: Estrutura `describe/it` do módulo `node:test` focada em Regras de Negócio (`[BR-CLI-XX]`).

---

_Data: 2026-04-23_  
_Contexto: Spec 0005 - Governança Modular_
