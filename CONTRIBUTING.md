# Como Contribuir

Obrigado pelo interesse em contribuir com o `ai-guidelines` BR! 🎉

Este repositório é **AI-governed**: humanos e agentes de IA seguem o mesmo fluxo de governança. Se você está usando uma IA para contribuir, oriente-a a ler [`AGENTS.md`](AGENTS.md) antes de qualquer ação.

Contribuições em PT-BR e EN são bem-vindas.

---

## Formas de contribuir

Contribuir não precisa ser um Pull Request. Você pode:

- Apontar uma ambiguidade na documentação
- Relatar uma fricção ao usar `init` ou `adopt`
- Sugerir adaptação para um caso de uso real (Python, Go, monorepos, etc.)
- Propor melhoria de exemplos ou onboarding
- Abrir discussão sobre compatibilidade com outra IA ou ambiente

Se for abrir issue, use os templates em [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/) — eles te ajudam a estruturar o relato de forma útil.

---

## Workflows por persona

Quatro caminhos, escolha o que se aplica ao seu caso:

### 1. 🩹 Ajuste rápido (typo, wording, bug pequeno)

Quando: mudança trivial, ≤ 1 arquivo, sem decisão arquitetural envolvida.

```
main → branch dedicada → commit atômico → PR Draft → CI verde → Ready → review
```

1. Crie branch: `fix/descricao-curta` ou `docs/descricao-curta`
2. Faça o ajuste
3. Abra PR em **modo Draft** usando o template [`.github/pull_request_template.md`](.github/pull_request_template.md)
4. Garanta CI verde (`yarn format` + `yarn check`)
5. Converta para **Ready** e solicite review de pelo menos 1 owner

**Sem spec necessária.**

### 2. 🛠️ Feature ou refactor (mais de 1 sessão, > 1 arquivo)

Quando: mudança que toca múltiplos arquivos fora de uma feature isolada, ou que precisa sobreviver a troca de IA/sessão para ser concluída.

```
backlog.md (candidata) → spec em .specify/specs/<slug>/ → branch → commits → PR Draft → CI → Ready → review
```

1. **Registre a intenção** — abra issue com label apropriado, ou proponha entrada em [`.specify/specs/roadmap/backlog.md`](.specify/specs/roadmap/backlog.md).
2. **Crie a fundação documental** em `.specify/specs/<slug>/` a partir dos templates SDD em [`.specify/templates/`](.specify/templates/):
   - `spec.md` — escopo e critérios de aceite (imutável após `In Review`)
   - `plan.md` — plano de implementação (vivo durante execução)
   - `tasks.md` — checklist de tarefas
   - `NEXT.md` — débitos adiados (apenas se houver; deletar no encerramento)
3. Crie **branch dedicada**: `feat/spec-XXXX-<slug>` (número sequencial alocado quando a candidata sai do backlog).
4. **Commits atômicos** por unidade lógica (não agrupe docs + código + config num commit só).
5. `yarn format` e `yarn check` antes de qualquer push.
6. Abra PR em **modo Draft** com matriz preenchida.
7. Trabalho finalizado + CI verde → converta para **Ready**.
8. Antes de pedir review, confirme a checklist técnica: spec/plan/tasks atualizados, decisões arquiteturais registradas em ADR quando necessário, `yarn format` + `yarn check` verdes, ausência de contexto pessoal/operacional vazado, e impacto downstream documentado.
9. Solicite review de pelo menos **1 owner** (ver [CODEOWNERS](.github/CODEOWNERS)).

### 3. 🧩 Spec consolidada (absorve candidatas relacionadas)

Quando: várias candidatas no backlog tocam o mesmo contrato e fazem mais sentido como uma spec única que como specs separadas.

**Critério canônico** (Spec 0008):

> "Se a entrega de uma altera o contrato da outra, fundir em uma spec única. Caso contrário, manter separadas."

1. Documentar a fusão na própria `spec.md` (seção "Decisão de Fusão").
2. Atualizar candidatas absorvidas em [`backlog.md`](.specify/specs/roadmap/backlog.md) com cross-ref à spec consolidada.
3. Seguir workflow 2 a partir daí.

### 4. 🤖 Agente IA com autonomia

Quando: você está executando trabalho via Claude Code, Gemini CLI, Codex, Cursor, Antigravity ou similar.

1. Ler [`AGENTS.md`](AGENTS.md) - directive "FASE 1: The Prime Directive" obrigatória (Environment Check e persistência).
2. Ler [`AGENTS.md`](AGENTS.md) seção **"Regras Globais"** — princípios de engenharia e workflow universais aplicáveis ao agente.
3. Seguir **PR description colaborativo (3 etapas)**:
   - Listar tópicos relevantes para validação humana **antes** do texto final;
   - Só escrever o texto após o humano editar/aprovar a lista;
   - Submeter o texto final para um último check humano antes de criar/editar o PR.
4. Aprovação humana explícita obrigatória antes de `git push`.

---

## Convenções de commit

Conventional Commits em PT-BR (ou EN):

```
<tipo>(escopo): <descrição>

feat(cli): adicionar flag --dry-run ao comando adopt
fix(engine): corrigir detecção de monorepo no Windows
docs(readme): atualizar tabela de compatibilidade
chore(ci): atualizar threshold de cobertura para 85%
```

**Tipos aceitos:** `feat`, `fix`, `docs`, `test`, `chore`, `refactor`,
`style`.

---

## Padrões obrigatórios

| Regra                          | Detalhe                            |
| :----------------------------- | :--------------------------------- |
| Nunca commitar em `main`       | Toda alteração em branch dedicada  |
| Commits atômicos               | Uma unidade lógica por commit      |
| PRs sempre em Draft            | CI verde → Ready → review de owner |
| `yarn format` antes do push    | CI valida formatação               |
| `yarn check` antes do push     | CI valida cobertura e testes       |
| Documentar decisões relevantes | ADR para mudanças arquiteturais    |
| Approval humano antes de push  | Aplica-se também a agentes IA      |

---

## Estrutura de governança (Single Source of Truth)

Cada conteúdo vive em **um único lugar**; outros documentos apenas linkam:

| Conteúdo                          | Vive em                            | Outros docs apenas linkam    |
| :-------------------------------- | :--------------------------------- | :--------------------------- |
| Workflow obrigatório do agente IA | `AGENTS.md`                        | README, CONTRIBUTING         |
| Princípios de engenharia (regras) | `.core/rules/global-rules.md`      | AGENTS, CONTRIBUTING, README |
| Como contribuir (humano)          | `CONTRIBUTING.md`                  | README                       |
| Lifecycle de specs                | `.core/process/spec-foundation.md` | AGENTS, CONTRIBUTING         |
| Visão geral do framework          | `README.md`                        | (raiz, ponto de entrada)     |

Antes de começar, leia:

- [`AGENTS.md`](AGENTS.md) — fluxo obrigatório, princípios de engenharia e workflow (humanos e agentes).
- [`.core/process/spec-foundation.md`](.core/process/spec-foundation.md) — quando abrir spec, como estruturar `spec.md`/`plan.md`/`tasks.md` e como fechar débitos/research.
- [`.specify/specs/roadmap/backlog.md`](.specify/specs/roadmap/backlog.md) — backlog e candidatas.

---

## Dúvidas?

Abra uma issue no GitHub com um dos [templates disponíveis](.github/ISSUE_TEMPLATE).
Não precisa ser perfeita — contexto real é sempre bem-vindo.

---

_Licença: [Apache-2.0](LICENSE)_
