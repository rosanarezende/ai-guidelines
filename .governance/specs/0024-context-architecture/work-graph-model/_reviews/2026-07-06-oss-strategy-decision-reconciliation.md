# Reconciliação — pesquisas Claude/Gemini para estratégia OSS

> **Frente:** Spec 0024 · work-graph-model · governance-demo  
> **Data:** 2026-07-06  
> **Tipo:** reconciliação consultiva para tomada de decisão  
> **Status:** não-autoridade; subordinado a `APP-DECISIONS.md`, `model.yml` e decisão humana.

## 1. Base verificada

**Repo local**

- Branch: `feat/spec-0024-artifact-taxonomy-and-model-review-contract`
- HEAD observado: `c934ade6`
- Working tree no início desta reconciliação:
  - `APP-DECISIONS.md` modificado;
  - 6 research/review files novos da rodada Claude;
  - prompt salvo em `research/2026-07-06-open-source-product-strategy-research-prompt.md`.

**Arquivos locais lidos**

- `governance-demo/APP-DECISIONS.md`
- `research/2026-07-06-control-plane-registry-options.md`
- `research/2026-07-06-open-graph-ecosystem-opportunities.md`
- `research/2026-07-06-oss-product-positioning-and-naming.md`
- `research/2026-07-06-work-graph-model-extraction-strategy.md`
- `research/2026-07-06-google-oss-programs-and-tools.md`
- `_reviews/2026-07-06-oss-strategy-synthesis.md`

**Fontes externas spot-checked**

- Better Auth Organization plugin:
  <https://better-auth.com/docs/plugins/organization>
- Cloudflare D1 limits:
  <https://developers.cloudflare.com/d1/platform/limits/>
- Cloudflare D1 import/export:
  <https://developers.cloudflare.com/d1/best-practices/import-export-data/>
- Kuzu GitHub archive:
  <https://github.com/kuzudb/kuzu>
- Apache AGE:
  <https://age.apache.org/>

## 2. Veredito curto

Claude e Gemini convergem no essencial: **self-hostable primeiro**, cloud/hosted
opcional depois; `identity/control plane` separado de `governance plane` e
`content plane`; Better Auth como melhor candidato de spike para conta/org/
convites; grafo como read-model portável, com Neo4j e Apache AGE como caminhos
fortes; Google útil principalmente via OSV/deps.dev/OSV-Scanner, não como
plataforma default.

O stress test posterior da owner refinou a conclusão: para uma release usável
por negócio/design/investidor, não basta dizer "GitHub resolve colaboração".
GitHub/Git pode ser o **cofre auditável** do governance host, mas a experiência
humana precisa de um **portal mínimo** com contas, convites e papéis. Esse portal
continua subordinado ao governance host Git-backed; ele não vira SSOT nem fonte
de authority.

Minha recomendação: transformar essa convergência em **decisões pequenas e
sequenciais**, sem fechar nome, licença, repo separado ou hosted central ainda.

## 3. Convergências fortes

| Tema                     | Claude                                           | Gemini                                         | Leitura consolidada                                                                                          |
| ------------------------ | ------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Control plane            | self-hostable primeiro; hosted opcional depois   | self-hostable primeiro                         | Decisão segura. O primeiro release não deve depender de serviço operado pela mantenedora.                    |
| Better Auth              | candidato primário de spike                      | candidato principal para spike                 | Forte candidato, mas ainda precisa provar contratos APP-40/41 e SEC-13 antes de virar escolha final.         |
| Cloudflare D1            | descartar como SSOT; docs/landing ainda possível | descartar como SSOT                            | Correto: não usar D1 como registry autoritativo portável. Cloudflare ainda pode servir docs/site/casca leve. |
| GitHub/Google login      | provider opcional; login não concede authority   | provider opcional; login não concede authority | Já alinhado a QRD-20 e APP-41.                                                                               |
| Git-backed host + portal | não tratado completamente                        | não tratado completamente                      | Novo achado do stress test: Git é cofre/auditoria; portal é a UX de pessoas não técnicas.                    |
| Produto/repo             | não extrair agora; gatilhos objetivos            | não extrair agora; gatilhos objetivos          | Decisão segura: não abrir repo separado agora. Registrar gatilhos e impedir que a Spec 0024 fique bloqueada. |
| Nome do produto          | manter aberto                                    | manter aberto                                  | Correto. `governance-demo` é codinome; `ai-guidelines` continua CLI/framework.                               |
| Grafos                   | Neo4j Community + Apache AGE                     | Neo4j Community + Apache AGE                   | Direção forte. AGE deve ser validado como spike de paridade antes de virar promessa de release.              |
| Kuzu                     | evitar upstream arquivado                        | evitar upstream arquivado                      | Confirmado por fonte: repo arquivado em 2025. Não usar como default.                                         |
| Source-available graphs  | fora do default                                  | fora do default                                | Correto para OSS-first; manter como adapters opcionais, se houver demanda.                                   |
| Google OSS               | OSV/deps.dev/OSV-Scanner como checks/adapters    | idem                                           | Decisão segura em tese; implementar como check/advisory pequeno, não como dependência de Google Cloud.       |

## 4. Divergências ou ajustes necessários

### D1/Cloudflare

**Fato:** D1 tem limite oficial de 10 GB por banco e import/export orientado a
SQLite. Isso não prova que Cloudflare é ruim, mas prova que D1 não é bom SSOT
portável para o registry de longo prazo.

**Interpretação:** "Descartar D1 como SSOT" é correto. "Descartar Cloudflare" é
forte demais. Cloudflare pode seguir como site/docs/preview/edge opcional, desde
que o contrato de registry seja portável.

### Better Auth

**Fato:** Better Auth tem plugin de organization com members/teams, roles e
permissions. Isso encaixa no problema de conta/org/convite.

**Interpretação:** ainda não devemos escrever "Better Auth escolhido". O correto
é: **Better Auth é o candidato prioritário de spike**. O spike precisa provar que
login/membership do control plane não vira authority efetiva.

### Git-backed governance host + portal humano

**Fato:** GitHub/GitLab/Bitbucket já resolvem parte relevante do problema de
cofre, histórico e permissão de alteração: repositórios privados, branch
protection, CODEOWNERS, required checks e auditoria de commits/PRs.

**Interpretação:** isso não resolve a experiência de uma pessoa de negócio,
designer ou investidor. A direção correta é separar: Git-backed governance host
como SSOT/auditoria; portal como cliente humano que lê, propõe e explica. O
portal pode usar Better Auth ou stack equivalente para conta/convite, mas deve
propor mudanças no governance host, não substituir o host.

### Apache AGE no primeiro release

**Fato:** Apache AGE é extensão de PostgreSQL para grafo. Isso é arquiteturalmente
atraente porque `postgres` já aparece como opção de store.

**Interpretação:** a tese "grafo portável entre backends" é forte e deve ser
registrada. Mas prometer AGE no primeiro release antes de spike/paridade com
Neo4j pode inflar escopo. Melhor: **aprovar S2 — AGE parity spike** e depois
decidir se entra no release.

### Google OSS

**Fato:** OSV, OSV-Scanner e deps.dev são ferramentas neutras de supply-chain e
não exigem Google Cloud.

**Interpretação:** bom candidato a dogfood cedo. Assured OSS/GCP deve ser "não
default", não "proibido para sempre". Empresas que já usam GCP podem optar por
isso via adapter/policy.

## 5. Decisões candidatas para iterar

### DEC-1 — Postura de distribuição e topologias

**Pergunta:** o primeiro release funcional deve modelar as quatro topologias
(`local-solo`, `git-backed`, `self-hosted-portal`, `hosted-portal`) e entregar
ao menos o caminho local + Git-backed como base segura?

**Recomendação:** sim.

**Efeito:** fecha a direção de QRD-36/QRD-41 sem escolher stack hospedada. O
hosted/control plane operado pela mantenedora continua opcional e futuro, mas o
portal mínimo para multiusuário não técnico entra como hipótese de spike.

### DEC-2 — Portal/control plane como spike, não decisão final

**Pergunta:** autorizamos um spike de portal/control plane para conta, org,
convite, aceite e ponte GitHub governance host, usando Better Auth como
candidato primário, provando APP-40, APP-41 e SEC-13?

**Recomendação:** sim.

**Critério de sucesso:**

- signup/org/convite/aceite persistidos;
- pessoa convidada pode entrar sem precisar operar GitHub diretamente;
- workspace aponta para governance host Git-backed por adapter/contrato;
- authority efetiva continua no reducer `@demo/domain`;
- control plane não lê governance host;
- secrets fora de payload/event-log/read-model;
- SQLite e Postgres mantêm o mesmo contrato.

### DEC-3 — Estratégia de grafo portável

**Pergunta:** registramos a tese "read-model de grafo portável entre backends",
com Neo4j Community como opção avançada já decidida e Apache AGE como spike de
paridade?

**Recomendação:** sim.

**Efeito:** mantém QRD-16, avança QRD-39 e evita lock-in Neo4j sem abandonar
Neo4j.

### DEC-4 — Google OSS como supply-chain/tooling, não cloud default

**Pergunta:** adotamos OSV-Scanner/OSV/deps.dev como checks/adapters de
governança do próprio projeto, sem escolher Google Cloud?

**Recomendação:** sim.

**Efeito:** avança QRD-40 com baixo risco.

### DEC-5 — Extração do `work-graph-model`

**Pergunta:** manter dentro da Spec 0024 por enquanto, mas registrar gatilhos
objetivos para promoção/extração?

**Recomendação:** sim.

**Gatilhos mínimos:**

- nome público decidido;
- licença por corpo decidida;
- fronteira `@demo/*` estável;
- checks rodando com `repoRoot` parametrizável;
- demanda real de contribuição/release;
- control plane suficientemente resolvido.

### DEC-6 — Nome e licença

**Pergunta:** decidir nome e licença agora?

**Recomendação:** não. Registrar critérios; decidir depois de S1/S2 e antes de
extração.

## 6. Ordem recomendada

1. Registrar em `APP-DECISIONS.md` as decisões de baixo risco:
   - quatro topologias modeladas;
   - Git-backed governance host como cofre/auditoria para colaboração;
   - portal mínimo como experiência para pessoas não técnicas;
   - Better Auth como candidato de spike, não decisão final;
   - grafo portável como tese;
   - OSV/deps.dev como checks/adapters candidatos;
   - extração só por gatilhos.
2. Atualizar matriz de cobertura/iteration map com S1 e S2 como spikes
   bloqueantes de decisão, não features de produto.
3. Implementar S1 portal/control plane + Git-backed host bridge.
4. Implementar S2 Apache AGE parity.
5. Só depois reabrir:
   - nome do produto;
   - licença app/server;
   - promoção para raiz ou repo separado;
   - hosted control plane operado pela mantenedora.

## 7. Riscos reais

| Risco                           | Severidade | Por que importa                              | Mitigação                                        |
| ------------------------------- | ---------- | -------------------------------------------- | ------------------------------------------------ |
| Control plane virar authority   | P0         | quebra o modelo de governança                | APP-41 + testes de reducer + guard de import     |
| Graph read-model virar SSOT     | P0         | quebra file-first/event-log                  | sourceRevision/fail-closed + guard de escrita    |
| Secret em event-log/read-model  | P0         | risco de segurança direto                    | SEC-13 antes de auth real                        |
| Prometer AGE sem paridade       | P1         | infla release e cria débito                  | S2 antes de decisão de release                   |
| Fork/repo separado cedo demais  | P1         | duplica CI, docs, governança e sincronização | gatilhos objetivos                               |
| Licença errada cedo demais      | P1         | afeta adoção corporativa e hosted futuro     | manter aberta até naming/control plane           |
| Cloud convenience virar lock-in | P1         | contradiz self-hostable/open-source          | contrato portável primeiro; Cloud apenas adapter |

## 8. Recomendação para a próxima conversa

Começar por **DEC-1**, porque ela reduz o espaço de decisão sem escolher
ferramenta:

> "Confirmamos que o modelo deve ter quatro topologias desde já, com Git-backed
> governance host como cofre compartilhado e portal mínimo como experiência
> humana para colaboração não técnica?"

Se confirmado, a próxima decisão natural é DEC-2 (spike de portal/control plane
com Better Auth como candidato primário e ponte GitHub governance host).
