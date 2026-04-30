# Roadmap Format Benchmarks (Sub-bloco B — Task B.9)

> Pesquisa: como projetos open source maduros organizam roadmap e backlog
> público. Objetivo: validar (ou ajustar) a decisão preliminar registrada de
> migrar `.specify/specs/ROADMAP.md` para pasta `.specify/specs/roadmap/` com
> 2 arquivos (`concluido.md` + `proximos.md`), com candidatas por slug sem
> número.

---

## Projetos analisados

### Rust RFCs (`rust-lang/rfcs`)

**Estrutura:**

```
text/
  0001-private-fields.md
  0002-rfc-process.md
  ...
  3000-...md
```

**Convenções:**

- **Número = ID do RFC, atribuído na aceitação** (merge do PR que cria o
  arquivo). Número sequencial global, nunca reutilizado.
- RFCs propostos vivem em **PRs abertos** (não em pasta separada).
- Quando merge, ganham o número seguinte disponível. Arquivo imutável após
  isso.
- Status (accepted / withdrawn / postponed) marcado no front-matter do próprio
  arquivo ou via issue tracker separado.

**Lições:**

- **Número só na aceitação** — candidatas não têm número. Elimina
  renumeração.
- Candidatas vivem em canal dinâmico (PR), não em arquivo Markdown.
- Arquivo aceito é **imutável** (exatamente o princípio `spec.md` imutável
  que a Spec 0008-B adota).

### React RFCs (`reactjs/rfcs`)

**Estrutura:** idêntica a Rust RFCs. Pasta `text/` com `0000-feature-name.md`.
Templates em `0000-template.md`. Processo de aceitação via PR.

### Python PEPs (`python/peps`)

**Estrutura:**

```
peps/
  pep-0001.rst
  pep-0008.rst
  ...
```

**Convenções:**

- Número = ID do PEP, **atribuído ao aceitar o status Draft** (não na
  aceitação final). Nunca renumera.
- Status complexo: Draft / Active / Accepted / Final / Rejected / Withdrawn /
  Deferred / Superseded. Marcado no front-matter do PEP.
- Roadmap "vivo" não existe como arquivo único — é derivado dos PEPs com
  status específicos.

**Lições:**

- Número atribuído cedo (Draft), mas não renumera.
- Status rico permite filtrar "roadmap" sem precisar mover arquivos.

### Astro RFCs (`withastro/roadmap` separado)

**Estrutura:**

- Repositório separado `withastro/roadmap` para RFCs.
- Roadmap "página" em `astro.build/roadmap` é gerado a partir dos RFCs.
- Status via GitHub Projects + labels.

**Lições:**

- Separar RFCs (processo formal) de roadmap "visual" (para público).
- Roadmap visual = vista sobre fonte de verdade, não fonte primária.

### Vue RFCs (`vuejs/rfcs`)

Segue padrão Rust/React. Número na aceitação, arquivos imutáveis em `active-rfcs/`.

### Next.js (Vercel)

**Estrutura:** não tem arquivo `ROADMAP.md` centralizado. Usa:

- GitHub Issues com label `kind: feature-request`.
- GitHub Projects para priorização (Now / Next / Later via columns).
- Changelog e releases notes para passado.

**Lições:**

- Para projetos com muitos contribuidores, roadmap fica em GitHub nativo (não
  em arquivo).
- Custo: baixa discoverability para LLMs lendo o repo (tem que chamar API).
- Benefício: priorização dinâmica, sem churn de arquivo.

### Vite

Similar a Next.js. GitHub Projects + Issues + Discussions. Sem arquivo
ROADMAP centralizado.

### Kubernetes KEPs

**Estrutura:** similar a RFCs, mas organizadas em **diretórios por SIG**
(Special Interest Group):

```
keps/
  sig-api-machinery/
    0001-kep-name/
      README.md
      kep.yaml
```

**Convenções:**

- Número dentro do SIG, não global.
- Status no kep.yaml (implementable / implemented / deferred / withdrawn).
- Agrupamento por categoria (SIG) + status.

**Lições:**

- Para projetos grandes, categorização por domínio ajuda.
- Status rico em metadata permite vistas dinâmicas sem renomear arquivos.

### Specify Kit (`github/spec-kit`)

Framework SDD moderno (similar ao `ai-guidelines`). Usa:

- `.specify/specs/<slug>/` com spec.md + plan.md + tasks.md.
- Sem ROADMAP centralizado explícito — candidatas vivem como issues.

**Lições:**

- Convergente com o modelo atual do ai-guidelines (pasta por slug).
- Sem ROADMAP único pode dificultar onboarding de quem chega novo.

### Spec Kit — estado da arte 2026 (repo-first + extension system)

Análise adicional em 2026-04-24: o Spec Kit está **ativamente** discutindo o
mesmo problema levantado ("e se o repo alvo usar GitHub Projects /
Jira / Linear?"). Não é teórico — há issues e discussions abertas:

- **Issue #880** — "Spec-kit and Github Issues/Projects".
- **Issue #889** — "Support for ticketing systems like JIRA".
- **Issue #1088** — "Tighter integration between GitHub Issues and Spec Kit
  created branches".
- **Discussion #1549** — "Extension system proposal + implementation (to e.g.
  support mapping spec/tasks to Jira, Linear but not limited to)".
- **Discussion #152** — "Evolving specs".

**Posição oficial do Spec Kit** (do README): markdown no repo é **fonte
primária**; integrações com GitHub Issues / Jira / Projects / Linear existem
como **community extensions** que sincronizam para destinos externos. A
filosofia é "spec-driven development flips the script... specifications
become executable".

**Outros padrões técnicos viáveis** para o mesmo problema:

- **Imdone** — sincroniza GitHub Issues ↔ arquivos Markdown bidirecionalmente.
- **Stately, GitBook, ReadMe, Harness Git Experience** — todos implementam
  "Git como source of truth" com sync bidirecional para ferramentas externas.

**Lições para o ai-guidelines:**

- Repo-first + adapters externos é o **padrão emergente canonizado** pelo
  framework de referência (Spec Kit), não uma escolha idiossincrática.
- O conceito técnico ("extension system" / "adapter") é nomeado e
  implementável — Spec 0016 candidata ganha fundamentação.
- GitHub Projects / Jira / Linear não são "ou — ou" contra Markdown; são
  **camadas colaborativas complementares**.

---

## Síntese — padrões observados

| Padrão                                       | Exemplos                        | Aplicável aqui?                                |
| :------------------------------------------- | :------------------------------ | :--------------------------------------------- |
| **Número só na aceitação** (nunca renumera)  | Rust, React, Python PEPs, KEPs  | **Sim** — adotar                               |
| Candidatas em PR/issue, não em arquivo       | Rust, React, Next.js            | Não — perdemos discoverability para LLMs       |
| Status rico em front-matter                  | Python PEPs, KEPs               | Complementa bem a decisão preliminar           |
| Split por categoria (SIG/domínio)            | Kubernetes KEPs                 | Não — projeto pequeno demais ainda             |
| Split por status (active / draft / accepted) | Astro, Vue (active-rfcs/)       | **Parcial** — equivalente a concluido/proximos |
| Arquivo ROADMAP único                        | (modelo atual do ai-guidelines) | Não escala: vira o problema atual              |
| GitHub Projects/Jira/Linear (dinâmico)       | Next.js, Vite, Spec Kit exts    | **Complementar** — camada humana, não fonte    |

---

## Validação da decisão preliminar registrada em 2026-04-24

**Decisão preliminar:** pasta `.specify/specs/roadmap/` com 2 arquivos:

- `concluido.md` — passado (specs concluídas + absorvidas com rastreabilidade).
- `proximos.md` — presente + futuro (em execução + Now/Next/Later; candidatas
  por slug).

### Análise

✅ **Split por status** (concluído vs propostas) é padrão validado por Astro e
Vue.

✅ **Número só na aceitação** (candidatas por slug) é o padrão dominante (Rust,
React, Python, KEPs). Elimina renumeração.

✅ **Arquivo Markdown como fonte primária** — coerente com a filosofia do
framework ("repositório é sua memória") e mantém discoverability para LLMs
lendo o repo. **Não exclui** GitHub Projects / Jira / Linear como camada
humana colaborativa: o repo é fonte canônica; ferramentas externas são
destinos sincronizados via adapter (ver Spec 0016 candidata e seção
"Política repo-first, integração-friendly" no final).

✅ **Separar passado vs futuro** é mais enxuto que status rico no front-matter
(não precisamos de Draft/Active/Accepted/Final/Rejected/etc.).

### Ajustes sugeridos à decisão preliminar

1. **Nomes dos arquivos**: após preferência registrada e validação semântica,
   **recomendação final `historico.md` + `backlog.md`**. Justificativa:
   - `backlog.md` é mais amplo que `proximos.md` — acomoda presente
     (em execução), futuro (Now/Next/Later), candidatas por slug,
     bloqueadores cross-spec **e** ponteiros para itens em trackers
     externos (GitHub Issue/Project, Jira, Linear). "Próximos" conota
     apenas fila imediata.
   - `historico.md` é mais amplo que `concluido.md` — cobre specs
     concluídas, absorvidas, superseded, canceladas e migradas. "Concluído"
     conota apenas sucesso.
   - Ambos são termos padrão no vocabulário de engenharia de software
     (inclusive em PT-BR), então a perda de idioma é nula.

2. **Regra de ouro adicional** (vinda dos benchmarks): _"Número é atribuído
   quando a spec sai de candidata e cria branch. Nunca renumera. Candidatas
   vivem por slug."_ — já alinhado com a decisão preliminar.

3. **Organização interna de `backlog.md`**: seções sugeridas em ordem de
   urgência:

   ```markdown
   ## Em execução

   ## Now (próxima fila, ordem importa)

   ## Next (depois, ordem flexível)

   ## Later (gatilho específico)
   ```

4. **Organização interna de `historico.md`**: seções:

   ```markdown
   ## Specs concluídas (cronológico reverso)

   ## Specs absorvidas (com ponteiro para spec que absorveu)
   ```

5. **Front-matter leve** nas entradas de `backlog.md`: slug + título + fonte
   do insight + pré-requisitos + sinal de "está na hora" + campo opcional
   **`tracker`** (link para GitHub Issue/Project/Jira/Linear quando existir).
   Evita que cada candidata inflame e já prepara terreno para adapters
   (Spec 0016 candidata).

6. **Migração de `ROADMAP.md` atual**: dividir o conteúdo existente entre os
   dois novos arquivos. Regra:
   - "Specs concluídas" + "Specs propostas" marcadas como absorvidas → vão
     para `historico.md`.
   - "Specs propostas" ativas + "Bloqueadores cross-spec" + "Itens
     oportunistas" → vão para `backlog.md`.

---

## Recomendação final para B.10

**Adotar a decisão preliminar registrada, com ajustes acima.**

Criar:

```
.specify/specs/roadmap/
  historico.md
  backlog.md
```

E **atualizar referências** em `AGENTS.md`, `README.md`, `CONTRIBUTING.md`,
`docs/process/spec-foundation.md`, templates SDD para o novo caminho.

**Manter `.specify/specs/ROADMAP.md` como arquivo stub** linkando para os dois
novos por um commit de transição (opcional, para não quebrar bookmarks
externos), ou remover direto (mais limpo). Recomendação: **remover direto** —
o repo ainda não é público, bookmarks externos são raros, e manter stub é
churn desnecessário.

**Templates a criar em B.8:**

- `.specify/templates/roadmap-boilerplate.md` — documenta o formato dos 2
  arquivos (cabeçalho, seções, formato de entrada **incluindo campo opcional
  `tracker`** para link externo).
- `.specify/templates/research-index-boilerplate.md` — formato do
  `research-index.md` (que já existe em `.specify/specs/research-index.md`
  mas sem template formal).

---

## Política "repo-first, integração-friendly"

Princípio canonizado a partir da pesquisa ampliada (Spec Kit 2026 +
benchmarks de sync bidirecional):

> **O repositório é a memória canônica mínima para agentes.** Ferramentas
> externas (GitHub Projects, GitHub Issues, Jira, Linear, etc.) **podem** ser
> usadas como camada colaborativa humana, desde que exista **ponteiro
> rastreável** no `backlog.md` do repo.

### Aplicação por perfil de projeto

- **Projeto solo / pequeno**: `backlog.md` é fonte única de verdade. Sem
  sync externo. Entrada mínima: slug + descrição + sinal de "está na hora".
- **Projeto GitHub-native**: `backlog.md` mantém o índice completo; cada
  entrada pode linkar Issue/Project via campo opcional `tracker`. Humanos
  colaboram no Project; agente continua lendo o repo.
- **Projeto com Jira/Linear**: `backlog.md` guarda índice mínimo (só
  slug + título + link externo); detalhe mora no tracker externo.
- **Projeto grande / multi-time**: candidato para usar adapter com sync
  bidirecional — **escopo da Spec 0016 candidata (Roadmap Adapters / SDD
  Extension System)**.

### Princípio irredutível

**Agente precisa conseguir retomar trabalho lendo apenas o repo.** Se o
`backlog.md` ficar vazio ou obsoleto porque "tudo vive no Jira", o framework
quebra — agente sem acesso a Jira perde contexto. Por isso o ponteiro é
mandatório quando tracker externo é usado, mas o **resumo mínimo no
`backlog.md` é mandatório também**.

### Handoff para Spec 0016 candidata

Esta pesquisa valida **editorialmente** o princípio. A implementação técnica
(feature opt-in `cli/features/opt-in/adapters/` com subadapters
`github-projects.mjs`, `github-issues.mjs`, `jira.mjs`, `linear.mjs`) fica
fora do escopo da Spec 0008 e vira **Spec 0016 candidata no ROADMAP**, com
gatilho "quando ai-guidelines virar público OU quando primeiro consumidor
multi-time adotar".
