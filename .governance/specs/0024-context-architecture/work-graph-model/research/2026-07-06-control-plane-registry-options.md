# Control plane / registry opcional — opções

> **Frente:** Spec 0024 · work-graph-model · governance-demo
> **Data da pesquisa:** 2026-07-06
> **QRDs alvo:** QRD-36 (control plane opcional), com dependências em QRD-14/15/19/20 (workspace-mode, adapters, auth, identity providers).
> **Regra:** três planos são distintos e não podem se misturar —
> `identity/control plane` ≠ `governance plane` ≠ `content plane` (QRD-36). Nenhuma plataforma é default. Login nunca concede membership/role/authority.

## 1. Base verificada

**Local:**

- `APP-DECISIONS.md` QRD-36 (research-open; boundary atual + contratos futuros APP-38..41, SEC-13), QRD-14 (workspace-mode local|shared|controlled; adapters), QRD-15 (onboarding padrão/avançado; `operational-store: files|sqlite|postgres`; `identity-provider: none|local-auth|github-oauth|gitlab-oauth|bitbucket-oauth|oidc`), QRD-19 (auth/convites/membership por modo), QRD-20 (github-oauth, google-oidc, oidc genérico).
- `APP-PRODUCT-STATEMENT.md` (local-first; usável sem conta cloud).
- `model.yml` `adoption-shell` (account/workspace/governance-host/work-sources/memberships) e `physical.backend: [file, sqlite, neo4j, mongo]`.
- `frontend/server/adoption/` (shell local real: `.local-state/` JSON + event-log + lock + cookie httpOnly não assinado — hoje é `local` puro).

**Externas (primárias quando possível):**

- Cloudflare D1 pricing/limits: <https://developers.cloudflare.com/d1/platform/pricing/>, <https://developers.cloudflare.com/d1/platform/limits/>; Workers pricing: <https://developers.cloudflare.com/workers/platform/pricing/>
- Supabase self-hosting: <https://supabase.com/docs/guides/self-hosting>
- Appwrite self-hosting: <https://appwrite.io/docs/advanced/self-hosting>
- PocketBase: <https://pocketbase.io/>
- Keycloak: <https://www.keycloak.org/> · Ory: <https://www.ory.sh/> · Zitadel: <https://zitadel.com/> · Authentik: <https://goauthentik.io/>
- Better Auth: <https://www.better-auth.com/> · Auth.js: <https://authjs.dev/>

> **Confiança:** licenças e mudanças de governança mudam. Marco data/fonte onde o fato é volátil e sinalizo o que não abri na fonte primária.

## 2. Fatos

- **F1 — Hoje o app só suporta `local` de verdade.** `frontend/server/adoption/` persiste em `.local-state/` na máquina; sessão é cookie httpOnly **não assinado**; não há registry compartilhado. Um convite real entre duas máquinas **não converge** hoje. (Fonte: repo + QRD-36 R.)
- **F2 — QRD-36 já fixou a fronteira dos três planos** e cinco contratos futuros (APP-38: control plane não é requisito p/ local; APP-39: shared exige registry/self-host; APP-40: control plane guarda metadados de workspace, não lê conteúdo governado; APP-41: login autentica, não concede authority; SEC-13: token/secret de provider fora de payload público/event-log/read-model). (Fonte: repo.)
- **F3 — Better Auth: MIT, TypeScript-first, roda DENTRO do app, usuários no SEU banco (SQLite ou Postgres), sem serviço externo; plugins nativos de organizations/teams/convites/RBAC/multi-tenant.** Em set/2025 a equipe do Auth.js (NextAuth) juntou-se ao Better Auth; Auth.js segue com security patches, mas Better Auth é o recomendado para projetos novos. (Fonte: better-auth.com; comparativos indie-starter/betterstack/makerkit, jul/2026 — data de "Auth.js joining" não verificada na fonte primária do Auth.js.)
- **F4 — Cloudflare D1/Workers:** free tier generoso (10 DBs × 500 MB no free; 10 GB/DB no pago, **teto rígido**; sem cobrança de egress). Porém: replicação/bindings proprietários, **não exporta como Postgres (saída é SQLite)**, arquitetura single-writer, "locked into Cloudflare, hard to migrate". (Fonte: developers.cloudflare.com/d1 + análises 2026.)
- **F5 — PocketBase:** binário Go único, SQLite embutido, auth + realtime + file storage, sem Docker; **um servidor só, sem Postgres, sem escala horizontal**; open-source (MIT). (Fonte: pocketbase.io + comparativos 2026.)
- **F6 — Supabase (self-host):** stack multi-serviço em Docker (Postgres + GoTrue auth + PostgREST + Realtime + Storage + Kong); Postgres real; componentes majoritariamente Apache-2.0; self-host pesado. (Fonte: supabase.com/docs/guides/self-hosting.)
- **F7 — Appwrite (self-host):** microserviços em Docker sobre MariaDB; funções multi-linguagem; self-host pesado. (Fonte: appwrite.io/docs/advanced/self-hosting.)
- **F8 — IdPs self-hosted maduros:** Keycloak (Apache-2.0, Red Hat, CNCF, Java, OIDC/OAuth2/SAML, pesado, battle-tested); Ory Kratos/Hydra/Keto (modular, você compõe); Authentik (MIT + enterprise, Python, OIDC/SAML/LDAP/RADIUS); **Zitadel migrou de Apache-2.0 para AGPL-3.0 em 2025** (Go, event-sourced, multi-tenant). (Fonte: comparativos houseoffoss/wz-it/oso 2025–2026; mudança de licença do Zitadel não verificada na fonte primária do repo Zitadel.)

## 3. Interpretação

**Erro a evitar:** tratar "control plane" como "escolher um BaaS/IdP" e colar identidade+registro no mesmo lugar do estado governado. QRD-36 é claro: o control plane só precisa saber _que um workspace existe e quem foi convidado_; ele **não** lê `governance host`, repos ou evidências.

Isso muda o eixo da decisão. A pergunta não é "Cloudflare vs Supabase vs Keycloak"; é **"qual o menor mecanismo que faz convite convergir sem virar segundo SSOT nem SaaS obrigatório?"**.

Observação de coerência de stack (INTERPRETAÇÃO forte): o app é **Next.js/TypeScript** e o `operational-store` já é `files|sqlite|postgres` (QRD-15). **Better Auth** encaixa nesse eixo sem introduzir novo runtime: roda no próprio app, guarda accounts/memberships/convites no mesmo SQLite/Postgres do `operational-store`, e traz organizations/teams/invites prontos — que são _exatamente_ as primitivas de registry do QRD-36. Ele mantém os três planos separados por construção: os dados de Better Auth são o **control plane** (metadados de conta/workspace/convite), enquanto authority efetiva continua resolvida no **governance plane** (reducer `@demo/domain`, file-first). Não é BaaS, não é serviço externo, e degrada para `local` (SQLite local) sem cloud.

Cloudflare/Supabase/Appwrite/PocketBase resolvem "onde HOSPEDAR", não "qual biblioteca de auth". Eles competem no **execution-mode**, não no plano de identidade. E Cloudflare D1 tem lock-in explícito (F4) que colide com o valor "portável/self-hostable".

Distinção operacional:

- **Biblioteca de auth/registry** (roda no app): Better Auth (recomendado) | Auth.js | Lucia-like | Ory (se quiser IdP externo).
- **Onde hospedar o control plane** (execution): self-host (Docker/VM) | PocketBase (single-binary p/ pilotos) | Supabase self-host | Cloudflare (lock-in) | Fly/Render/Railway etc.
- **IdP externo** (federar login): GitHub OAuth, Google OIDC, OIDC genérico (Keycloak/Authentik/Zitadel/Entra/Okta) — QRD-20 já define a ordem.

## 4. Matriz de alternativas

### 4a. Camada de auth/registry (roda no app)

| Alternativa                        | O que entrega                                                                                | Custo/operação               | Lock-in                           | Self-host | Maturidade                                             | Riscos                                                          | Aderência (3 planos)                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------- | --------- | ------------------------------------------------------ | --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Better Auth (MIT)**              | accounts, sessão, orgs/teams, convites, RBAC, social/OIDC, passkeys — no seu SQLite/Postgres | baixo; é lib no app          | nenhum (código seu, dados seu DB) | nativo    | alta e crescente; Auth.js convergiu p/ ele (F3)        | projeto jovem; superfície de segurança própria a auditar        | **ótima** — control plane no seu DB, authority fica no governance plane |
| **Auth.js v5 (MIT)**               | auth + social/OIDC; orgs/RBAC você constrói                                                  | baixo                        | nenhum                            | nativo    | madura, porém em modo manutenção pós-convergência (F3) | menos features de org/multi-tenant; precisa construir registry  | boa                                                                     |
| **Ory Kratos/Keto (Apache-2.0)**   | IdP + permissões (Zanzibar-like) como serviços                                               | médio/alto (compor + operar) | baixo                             | sim       | alta                                                   | complexidade; overkill p/ primeiro release                      | boa, mas separa em serviço externo                                      |
| **Keycloak / Authentik / Zitadel** | IdP completo OIDC/SAML                                                                       | alto (operar IdP)            | baixo (Zitadel agora AGPL, F8)    | sim       | alta                                                   | peso; vira dependência de `controlled`, não do primeiro release | boa como IdP externo (QRD-20)                                           |

### 4b. Onde hospedar o control plane (execution)

| Alternativa                              | O que entrega                         | Custo/operação            | Lock-in                                           | Self-host          | Maturidade          | Riscos                                       | Aderência ao modelo                                               |
| ---------------------------------------- | ------------------------------------- | ------------------------- | ------------------------------------------------- | ------------------ | ------------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| **Self-host Docker/VM (Postgres + app)** | controle total; portável              | médio (você opera)        | nenhum                                            | total              | alta                | operação por conta da mantenedora            | **ótima**                                                         |
| **PocketBase (single binary)**           | registry+auth simplíssimo p/ piloto   | baixíssimo                | baixo (SQLite exportável)                         | total              | alta p/ solo/piloto | 1 servidor, sem Postgres/escala (F5)         | boa p/ piloto shared pequeno                                      |
| **Supabase self-host**                   | Postgres gerenciável + auth + storage | médio/alto (stack Docker) | baixo (Postgres padrão)                           | total              | alta                | peso operacional (F6)                        | boa; bom se já quiser Postgres                                    |
| **Cloudflare D1/Workers**                | free tier grande, zero-ops edge       | baixo $                   | **alto** (sem export Postgres, single-writer, F4) | não                | alta                | lock-in colide com "portável"; teto 10 GB/DB | fraca p/ SSOT-portável; ok só como casca de metadados descartável |
| **Cloud PaaS (Fly/Render/Railway)**      | deploy fácil de container próprio     | baixo/médio $             | baixo (container padrão)                          | n/a (mas portável) | alta                | custo recorrente                             | boa                                                               |

## 5. Recomendação

**Decidir agora (baixo risco, alto retorno):**

1. **Camada de auth/registry = Better Auth** como candidato primário do control plane opcional, **a validar num spike** antes de cravar em QRD. Racional: MIT, roda no app TS, guarda accounts/memberships/convites no mesmo `operational-store` (SQLite local → Postgres shared/controlled), traz orgs/teams/invites prontos e mantém os três planos separados por construção. Não introduz runtime novo nem SaaS.
2. **Control plane operado por nós = NÃO agora.** Resposta à pergunta-1 do prompt: **ambos no tempo certo, mas comece por "self-hostable primeiro"**. O primeiro release entrega o control plane como **software self-hostável** (mesmo binário/stack do app, com Better Auth + Postgres/SQLite). Uma casca hospedada por nós (ex.: em `*.pages.dev` ou PaaS) pode vir **depois**, opcional, como conveniência — nunca como requisito. Isso honra QRD-12 e APP-38/39.
3. **Descartar Cloudflare D1 como store do control plane** enquanto "portável/self-hostable" for valor central (F4). Cloudflare Pages continua ok para **docs/landing estáticos**; Workers só entra se algum dia houver casca hospedada, e mesmo assim sem D1 como SSOT.
4. **Reafirmar SEC-13 antes de qualquer código:** token/secret de provider nunca em payload público, event-log ou read-model.

**Se houver casca hospedada (pergunta-2 do prompt): stack de menor custo/lock-in para 1º release OSS =** container único (app Next + Better Auth) + **Postgres** gerenciado barato (ou SQLite p/ piloto), atrás de um PaaS portável (Fly/Render/Railway) ou VM. Evitar edge-DB proprietário. Isso é trivialmente self-hostável pela comunidade — o mesmo artefato que nós rodaríamos.

**Manter aberto:**

- Se/quando operar a casca hospedada (depende de demanda real de convites cross-máquina).
- IdP externo default para `controlled` (Keycloak vs Authentik vs Zitadel-AGPL) — decidir junto com QRD-20, não agora.

**Testar antes de cravar:**

- **Spike Better Auth** (fora do caminho de produto, como foi o visual-stack): provar signup→org→convite→aceite com dados no SQLite, mostrando que (a) authority efetiva continua vindo do reducer `@demo/domain` e não do Better Auth; (b) nenhum dado do governance host entra no control plane; (c) trocar SQLite↔Postgres não muda contrato. Só depois abrir QRD de decisão.

## 6. Impacto em QRDs

- **Avançar QRD-36 (segue research-open até o spike):** registrar Better Auth como candidato primário + "self-hostable primeiro, hosted opcional depois" + Cloudflare-D1 descartado como SSOT. Converter APP-38..41 e SEC-13 de "pendentes de pesquisa" para **contratos candidatos a implementar** após o spike.
- **Conecta com QRD-14/15/19/20:** o control plane preenche a lacuna de `shared`/`controlled` (convite real) sem tocar governança; identity providers externos entram como adapters (QRD-20).
- **Novos contratos/testes sugeridos (não implementar nesta rodada):**
  - `SEC-13` (teste): nenhum secret de provider aparece em `/api/*` público, event-log ou read-model.
  - `APP-40` (teste): control plane responde "workspace existe / convidados" sem expor nós governados.
  - `APP-41` (teste): login (mock IdP) cria account mas **não** cria membership/role/authority.
  - `ARCH` (guard): control-plane store (Better Auth) fisicamente separado do governance host; import cruzado barra no check.
