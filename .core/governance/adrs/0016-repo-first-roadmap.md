# ADR 0016 — Roadmap Repo-First com Tracker Externo como Camada Colaborativa Opcional

**Status**: Aceita
**Origem histórica**: Spec 0008 (canonizou o princípio em `roadmap-boilerplate.md`) — promovida a ADR pela Spec 0021 sub-bloco 4.B.2 (2026-05-17).

---

## Contexto

Projetos sérios precisam de **memória do que está em curso** e **histórico do que foi entregue**. Duas escolhas dominantes existem no mercado:

- **Tracker externo como SSOT** (Jira, Linear, GitHub Projects): rico em UX colaborativa, mas opaco para agentes IA (cada tracker tem API própria, não há acesso uniforme), volátil (mudança de ferramenta destrói a memória), e dependente de credenciais que nem todo participante (humano ou agente) tem.
- **Repositório como SSOT** (Markdown versionado, estado estruturado): legível por qualquer agente que tenha acesso ao código, sobrevive à troca de ferramenta, versionado pelo mesmo VCS do código. Mas perde UX colaborativa rica (atribuição, status visual, notificações).

Sob framing AI-driven, a primeira escolha tem custo invisível mas crescente: agentes IA não conseguem ler o tracker, e cada vez que precisam de contexto sobre uma spec, têm que ser briefados manualmente. A segunda preserva agnosticismo humano/IA mas exige disciplina editorial.

## Princípio

**O repositório é a memória canônica do roadmap. Trackers externos são camada colaborativa humana opcional, nunca delegação de autoridade.** A SSOT do estado (o que está em curso, o que foi entregue, qual a prioridade) vive em arquivos versionados — hoje `.specify/specs/roadmap/{backlog,historico}.md`, evoluindo para `.governance/registry.yml` (PR4+ consumer-side) conforme a Spec 0021.

Quando há integração com tracker externo, o vínculo é **referência leve, não fonte primária**: um campo opcional `tracker:` aponta para a issue/card correspondente, mas o resumo mínimo no arquivo versionado é mandatório. O agente IA não precisa do tracker para entender o estado da spec; o humano pode usar o tracker para colaboração se quiser.

Três implicações decorrem do princípio:

1. **Resumo mínimo no repo é mandatório.** Toda entrada em `backlog.md` ou `historico.md` carrega: ID/slug, status (Now/Next/Later/Done/Cancelled), descrição em uma linha, owner. Sem esses campos a entrada é falha de contrato.

2. **`tracker:` é opcional, não required.** Quando presente, contém URL ou ID curto da issue externa. Quando ausente, o repo é suficiente. Nunca o inverso (tracker presente, repo ausente).

3. **Migração entre trackers não destrói memória.** Se o time migra de Jira para Linear, o conteúdo do `backlog.md` permanece intacto; só os valores de `tracker:` mudam (ou desaparecem).

## Opções avaliadas

| #   | Opção                                                                     | Trade-off                                                                                                                                                               |
| --- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | **Tracker externo como SSOT** (`.specify/` só citaria IDs do Jira/Linear) | Maximiza UX colaborativa, mas torna a memória **dependente** de credenciais e da disponibilidade do tracker; agentes IA precisam de briefing manual.                    |
| B   | **Repo-first sem integração externa** (proibir `tracker:`)                | Maximiza agnosticismo, mas força times com Jira/Linear/GHP a manter duas verdades — UX colaborativa perde.                                                              |
| C   | **Repo-first com `tracker:` opcional** (escolhida)                        | Preserva agnosticismo IA + sobrevive à troca de ferramenta + permite UX colaborativa onde o time já tem investimento. Exige disciplina de manter resumo mínimo no repo. |

## Onde se aplica

Este princípio rege:

- O formato de `.specify/specs/roadmap/backlog.md` e `historico.md` (campo `tracker:` opcional documentado em `roadmap-boilerplate.md`).
- O contrato consumer-side futuro de `.governance/registry.yml`: estado estruturado é SSOT; integração com tracker entra como campo opcional do schema.
- A política editorial do framework: PRs que propõem "delegar gestão de roadmap para Jira/Linear" são rejeitados como violação do princípio.

Este princípio **não** rege:

- A escolha de qual tracker usar — operacional, decidida por time.
- A política de notificações (Slack, email) que externos podem disparar a partir do tracker — orthogonal.

## Consequências

- Memória do roadmap é **portável** entre stacks, ferramentas e provedores de IA.
- Agentes IA podem ler o roadmap **sem credenciais externas**.
- Risco residual: duplicação de informação entre repo e tracker quando ambos são usados. **Mitigação**: tracker é "espelho lossy" do repo, não fonte. Se divergem, o repo manda.

---

_Operacionalização (formato de entrada, campos obrigatórios, política de migração): [`.specify/templates/roadmap-boilerplate.md`](../../../.specify/templates/roadmap-boilerplate.md) e [`.core/process/governance-foundation.md`](../../process/governance-foundation.md) § "Roadmap"._
