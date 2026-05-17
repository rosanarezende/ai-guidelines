# ADR 0009 — Naming do pacote npm e estratégia de registry

**Status**: Aceita
**Data**: 2026-05-07
**Spec**: 0020 — `npm-publication`

---

## Contexto

A Spec 0020 (`npm-publication`) destrava a publicação pública do framework no registry npm. Antes da publicação efetiva, três decisões precisavam ser cravadas para evitar bikeshedding posterior e fechar a janela de exposição do nome no registry:

1. **Naming do pacote principal** — scoped (`@<scope>/core`) vs não-scoped (`ai-guidelines`).
2. **Registry de publicação** — público padrão, paid org do npm, ou GitHub Packages.
3. **Auth da Action `pr-curator`** — Personal Access Token fino vs GitHub App, dado que a Action precisa abrir PRs cross-repo a partir do repositório da mantenedora para repositórios consumidores.

Decisões tangenciais relevantes registradas em ADRs anteriores:

- ADR 0005 — curadoria público/privado.
- ADR 0006 — licença Apache-2.0.
- ADR 0007 — visibilidade pública via fresh repo + snapshot curado.

---

## Decisão 1 — Naming: `ai-guidelines` não-scoped

### Opções consideradas

| Opção                            | Memorabilidade                           | Riscos                                                 | Custo |
| -------------------------------- | ---------------------------------------- | ------------------------------------------------------ | ----- |
| **`ai-guidelines`** (não-scoped) | Alta — `npx ai-guidelines init` direto   | Janela de exposição até publish (alguém pode squat)    | Zero  |
| `@ai-guidelines/core` (scoped)   | Média — exige nome de scope memorizado   | Verbosidade no comando inicial; fricção em demos       | Zero  |
| `@<owner>/ai-guidelines`         | Baixa — owner-bound, dificulta narrativa | Acopla nome ao owner pessoal; troca de owner = rebrand | Zero  |

### Decisão

Publicar o package principal como **`ai-guidelines`** (não-scoped). A org `@ai-guidelines` (já criada em npmjs.com em rodada anterior) fica **reservada** para extensões futuras no formato `@ai-guidelines/<addon>` (ex.: `@ai-guidelines/dashboard`, `@ai-guidelines/intake`).

### Critério decisivo

`npx ai-guidelines init` é objetivamente mais memorável e narrativamente mais forte para portfólio do que `npx @ai-guidelines/core init` ou `npx @<owner>/ai-guidelines init`. O comando inicial é o primeiro contato do consumidor com o framework — fricção aqui se paga em adoção.

### Risco residual aceito

Janela de exposição entre a abertura desta spec e o publish efetivo: alguém pode publicar `ai-guidelines` antes de a Spec 0020 fechar. **Mitigação adotada:** promoção imediata da Spec 0020 sobre candidatas concorrentes (cf. `roadmap/backlog.md` § "Bloqueadores resolvidos") para fechar a janela rapidamente. Disponibilidade do nome verificada em 2026-05-07 (`registry.npmjs.org/ai-guidelines` → HTTP 404).

---

## Decisão 2 — Registry: público padrão (gratuito)

### Opções consideradas

| Opção                    | Visibilidade           | Custo          | Compatibilidade `npx`    |
| ------------------------ | ---------------------- | -------------- | ------------------------ |
| **npm registry público** | Total (default global) | Zero           | Nativa                   |
| npm paid org (privado)   | Restrita               | Pago mensal    | Exige auth do consumidor |
| GitHub Packages          | Total (auth-friendly)  | Zero (público) | Exige `.npmrc` extra     |

### Decisão

Publicar no **registry público padrão do npm**, sem paid org e sem GitHub Packages. `npm publish --access public` no momento do release.

### Critério decisivo

A Spec 0020 entrega adoção pública gratuita; qualquer fricção de auth no consumidor (caso típico de GitHub Packages) destrói o `npx ai-guidelines init` direto. Paid org só se justificaria com necessidade de acesso privado, que **não existe hoje** — todo o conteúdo distribuído é open source sob Apache-2.0 (ADR 0006).

### Gatilho condicional para revisitar

Considerar GitHub Packages ou paid org **somente se** surgir uma das condições:

1. Necessidade documentada de distribuição privada de variantes do framework para clientes específicos.
2. Mudança no modelo de licenciamento (improvável dado ADR 0006).

Sem nenhuma dessas condições, o registry público permanece a escolha estável.

---

## Decisão 3 — Auth do `pr-curator`: GitHub App preferencial; PAT fino como bootstrap

### Opções consideradas

| Mecanismo                               | Granularidade                                            | Rotação              | Setup inicial                             |
| --------------------------------------- | -------------------------------------------------------- | -------------------- | ----------------------------------------- |
| **GitHub App** (com installation token) | Alta — escopo por permissão e por repo                   | Auto (token efêmero) | Médio — exige criação do App e instalação |
| Personal Access Token (PAT) fino        | Média — escopo por permissão, sem expiração curta nativa | Manual               | Baixo — gerar e copiar                    |
| PAT clássico (sem fino)                 | Baixa — escopo amplo demais                              | Manual               | Baixo                                     |

### Decisão

**Preferência canônica: GitHub App** com permissão mínima necessária (Pull Requests: read/write nos repos consumidores; Contents: read no repo da mantenedora). Tokens de installation são efêmeros (rotação automática), reduzindo blast radius em caso de vazamento de log.

**PAT fino é aceitável como bootstrap inicial** enquanto o GitHub App não estiver criado/instalado, com as condições:

- Apenas escopos `pull-requests:write` e `contents:read` nos repositórios alvo.
- Expiração ≤ 90 dias com lembrete de rotação documentado no workflow.
- Armazenado em secret do repositório da mantenedora; nunca commitado.

PAT clássico está **descartado** — escopo amplo demais.

### Critério decisivo

A Action opera cross-repo, abrindo PRs em repositórios que não a hospedam. Vazamento de credencial nesse cenário tem blast radius proporcional ao escopo do token; a rotação automática do GitHub App é o controle proporcional à exposição. PAT fino é tolerável como rampa porque o setup do App tem custo não-trivial e a Spec 0020 já carrega outros entregáveis críticos.

---

## Janela de unpublish do npm — rede de segurança operacional

A política do npm permite `unpublish` de uma versão **dentro de 72 horas após publish**, desde que a versão não tenha tido downloads relevantes. Esta janela é a rede de segurança aplicável **apenas** para bugs críticos descobertos imediatamente pós-publish (ex.: vazamento acidental de credencial, corrupção de estado em consumidor).

**Política operacional adotada:**

1. **Preferência absoluta:** publicar versão patch (`1.0.1`, `1.0.2`...) corrigindo o bug. SemVer respeitado, histórico preservado, contrato com consumidores intacto.
2. **Unpublish dentro da janela de 72h:** apenas se o impacto justificar (ex.: instalar a versão quebra ambientes consumidores ou expõe credencial).
3. **Após 72h:** unpublish requer fluxo manual com suporte do npm; tratar como incidente, não como rotina.

---

## Impacto

- **Imediato (Spec 0020):** package.json reflete `name: "ai-guidelines"` (não-scoped); `npm publish --access public` no momento do release; workflow `pr-curator.yml` (sub-bloco E da Spec 0020) usa GitHub App como caminho preferencial e aceita PAT fino como bootstrap documentado.
- **Roadmap:** extensões futuras seguem o naming `@ai-guidelines/<addon>`; primeira candidata provável é `@ai-guidelines/dashboard` (telemetria de adoção, ainda em backlog).
- **Reversibilidade:** decisões 1 e 2 são reversíveis com custo (rebrand de pacote / migração de registry); decisão 3 é trivialmente reversível (rotação de credencial).

---

## Lições e gotchas

- **Janela de exposição do nome é real:** decisões de naming em frameworks open source devem ser fechadas antes de a estratégia ser anunciada publicamente. Anunciar antes do publish convida squatting.
- **Scoped vs não-scoped não é só estética:** scoped exige `--access public` no publish e introduz fricção em demos; vale o custo apenas quando o package é parte de uma família já reconhecida.
- **GitHub App é mais setup mas paga blast radius menor.** Para automações cross-repo persistentes, nunca PAT clássico — apenas PAT fino (como rampa) ou App.
