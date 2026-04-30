# Plan — Spec 0017 Process Refinement & CLI Refactor

> Spec: [./spec.md](./spec.md)
> Status: Draft

> **Vive durante a execução.** Diferente da `spec.md` (imutável após In Review), este arquivo é atualizado conforme o entendimento técnico evolui. A IA implementadora deve consultar este plano como seu roteiro.

---

## 🏗️ Design e Arquitetura

### Princípio Guia

**A antes de B**: O sub-bloco A (Processo & Sanitização) define a estrutura canônica dos arquivos e o que fica em `docs/` vs `.core/rules/`. O sub-bloco B (CLI e Compilador) vem depois, construindo a infraestrutura com base na organização limpa entregue pelo Bloco A.

### Sub-bloco A — Process & Sanitization

#### A.1 — Research Lifecycle

Arquivos da spec atual (ex: pesquisa de compliance) e legados em `.specify/specs/researchs/` precisam ser renomeados para `YYYY-MM-DD-assunto.md`, organizados em pastas lógicas (`arquitetura/`, `compliance/`) e o índice `.specify/specs/research-index.md` deve ser regenerado.

#### A.2 — Auditoria e Sanitização de Documentação

A IA deve inspecionar a pasta `docs/`. Documentos que prescrevem como o agente ou o desenvolvedor **deve codificar** (ex: regras finas de engenharia que não estão no opt-in) devem ser movidos e consolidados no `.core/rules/global-rules.md` ou criados como novos opt-ins. A pasta `docs/` deve conter apenas documentação humana da CLI ou do fluxo de trabalho do projeto.

### Sub-bloco B — Monolithic Runtime Compiler (O Motor)

A arquitetura do `ai-guidelines-cli` precisa mudar sua forma de ingerir os _templates_. Em vez de um _stream_ sequencial ingênuo, a lógica em `cli/core/content-merge.mjs` (ou num novo `ast-compiler.mjs`) precisa ser refatorada para construir uma árvore abstrata e ordená-la antes de salvar o arquivo final no repositório alvo.

#### Decisão revisada — Runtime único no `AGENTS.md`

Após smoke test no próprio repositório, o contrato foi ajustado: o consumidor não recebe `.ai-guidelines/rules/` nem `.ai-guidelines/AGENTS.md`. O único artefato runtime é o `AGENTS.md` da raiz, com o conteúdo do framework delimitado por:

```xml
<AI_GUIDELINES>
...
</AI_GUIDELINES>
```

Conteúdo próprio do projeto consumidor deve permanecer fora dessa tag e nunca ser reescrito pelo motor. Em reexecuções do `adopt`, a CLI substitui somente o bloco `<AI_GUIDELINES>`. Features opt-in são geradas como blocos internos (`<FEATURE_TDD>`, `<FEATURE_BDD>`, `<FEATURE_QUALITY_GATES>`), permitindo atualização e prune por recompilação do runtime.

#### Estruturação da Compilação Topológica

O motor deve possuir três _buffers_ em memória:

1. `bufferTopo`: Adiciona o conteúdo de `AGENTS-core.md.tmpl` e, em seguida, anexa as `global-rules` e as regras específicas do modelo (`gemini.md`, `claude.md`).
2. `bufferCentro`: Itera sobre todos os recursos opt-in ativados (`tdd-pt.md`, `quality-gates.md`, etc.). Para cada um, lê o texto, injeta um prefixo `<FEATURE_NOME>` e sufixo `</FEATURE_NOME>` e anexa ao buffer.
3. `bufferBase`: Adiciona o contexto tático que guiará as ações imediatas dentro do runtime.

No final, o CLI fará um `join` destes três buffers, envolverá o resultado em `<AI_GUIDELINES>` e escreverá o monólito final no `AGENTS.md` consumido pela IA no diretório alvo.

#### Aliases de Módulo

O `package.json` deve ser alterado para incluir o subpath routing:

```json
"imports": {
  "#core/*": "./cli/core/*.mjs",
  "#features/*": "./cli/features/*.mjs",
  "#formatters/*": "./cli/formatters/*.mjs"
}
```

A IA deverá rodar um script ou usar sed para substituir ocorrências de ../../core/ por #core/ na base de código, resolvendo o dependency hell.

## ⚠️ Riscos e Portões de Qualidade (Quality Gates)

- Não inicie o passo B.2 (Mass Refactoring) antes de garantir que o passo B.1 (POC do package.json) passe nos testes unitários rodando com yarn test.
- Certifique-se de que a injeção de tags XML não quebre a formatação em Markdown (Mantenha as tags em suas próprias linhas, sem quebrar blocos de código).
