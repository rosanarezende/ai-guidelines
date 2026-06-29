# Banco e view POR-REPO, auto-contidos via lib compartilhada (padrão contrato-first + implementação swappable)

- Data: 2026-06-28 · Spec 0024 · Natureza: **research, não-autoridade** (insumo de DEC; não decide sozinho).
- Motivação: a sim (`_org-simulation-v2`) hoje tem **1 banco central** que deriva todos os repos e **escreve** dashboards dentro deles. Isso não é fiel à **Lente 5**: o repo deveria ser a **fonte da verdade auto-contida** — dono do seu **dado** (um db próprio) e da sua **view** —, consumindo uma **lib compartilhada**, em vez de receber projeções de uma ferramenta externa. _"Não vejo como um banco fora do repo seja sustentável: para saber uma informação interna seria necessária uma consulta externa."_ (owner, 2026-06-28).
- Prior art pública abaixo; o padrão é genérico (repository pattern + fake API + context como DI).

---

## 1 · O problema (na nossa sim)

- **Hoje:** `_banks/run.ts` (central) lê o `.governance/` de TODOS os repos e materializa db/HTML para dentro deles. O repo não tem autonomia — depende da ferramenta central rodar.
- **Queremos:** cada repo **auto-contido** — seu próprio **banco/db** + sua própria **view** — montados a partir de uma **lib compartilhada**; o repo **projeta pra dentro** (detalhe interno) e **pra fora** (o que a governança agrega). O banco central vira só o **host de agregação**.

## 2 · O padrão (genérico — 4 peças)

**(a) Lib compartilhada (distribuição).** O código comum vira **pacotes versionados** (estilo npm), consumidos por cada app como dependência — igual a uma lib de terceiros. Ganhos: versionamento, **adoção gradual**, notificação de update, múltiplos formatos de bundle. _→ o que os repos compartilham (o derive, os componentes de view, o provider de contexto) mora numa lib; cada repo a consome, não copia._

**(b) Context-data (provider/consumer = DI de contexto).** O **host** define um **contexto de aplicação** (dados compartilhados: usuário/conta/papéis/…) por **objeto estático · função sync · função async · promise**; os módulos consomem via **hook/HOC**. É **single source of truth** do contexto, **desacoplado**, e o framework cuida do estado de **init assíncrono**. _→ o host injeta o contexto compartilhado nos módulos; é **dependency injection de dados** (contexto como DI, não state-management)._

**(c) Fake-api (mock local, roteado por ambiente).** Handlers definidos em **arquivos** (módulos que exportam funções por método HTTP: `get`/`post`/…), pastas = rotas aninhadas. O cliente é **contrato-estável** (`client.create('serviço')` → `api.get('/x')`); o framework **roteia por ambiente** — **dev → fake local · staging/prod → real** — de forma **transparente**, sem o consumidor mudar. Dados realistas via **JSON Schema + faker**, com filtros/query. _→ cada repo serve seu **dado local** por um fake-api (fonte própria) e **troca pro real** sem tocar no consumidor: o **contrato** é o mesmo. Equivale a MSW/json-server, mas file-defined + env-routed + schema/faker._

**(d) Fake-repository (origem swappable do módulo).** Roda um módulo **localmente** dentro do host **sem deploy**: **real** = módulo publicado · **fake** = servidor local numa porta; troca-se pela **config** (a propriedade que aponta pra origem: publicado ↔ `localhost`). _→ a **origem** de um módulo/dado é **injetável**: local (auto-contido, dev/sim) ↔ publicado (real)._

**A ideia que unifica = contrato-first + implementações swappable.** O consumidor fala com um **contrato estável**; a **implementação é injetada** — **fake/local** (auto-contido, sem dependência externa, ideal pra dev e pra esta simulação) ou **real** (publicado). A **lib compartilhada** provê as peças; o **host injeta o contexto**. É exatamente "cada repo auto-contido + lib compartilhada".

## 3 · Prior art pública (referências)

- **Repository pattern + FakeRepository** — porta/adapter: in-memory/fake pra dev-teste, real pra prod; troca por **dependency injection** sem tocar na lógica. ([cosmicpython cap. 2](https://www.cosmicpython.com/book/chapter_02_repository) · [.NET DDD persistence](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design))
- **Fake API local / contract-first** — [MSW](https://mswjs.io/) intercepta na **camada de rede** (o app não sabe que é mock); [json-server](https://mistershadrack.medium.com/effortlessly-mock-apis-with-json-server-a-comprehensive-guide-for-developers-7aee507bbce6) transforma um `db.json` em REST; [contract-first](https://developers.redhat.com/blog/2020/04/28/contract-first-development-create-a-mock-back-end-for-realistic-data-interactions-with-react) (OpenAPI) deixa front e back evoluírem em paralelo contra o mesmo contrato. ([4 ways to fake an API](https://www.valentinog.com/blog/fake/))
- **Context como Dependency Injection** (não state-management) — [React Context p/ injetar dependências](https://testdouble.com/insights/react-context-for-dependency-injection-not-state-management) em libs de componente / micro-frontends ([Code Driven Dev](https://codedrivendevelopment.com/posts/dependency-injection-in-react)).

## 4 · Como mapeia na governança-grafo (Lente 5)

| peça do padrão                       | na nossa sim                                                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **lib compartilhada**                | um `_lib/` único (derive + fake-api/db + context provider + view) que **cada repo importa**                                         |
| **fake-repository** (origem do dado) | o **derive** que lê o `.governance/` do repo (a fonte da verdade local)                                                             |
| **fake-api / db local**              | um **`db.json` por repo** (a projeção interna servida localmente) — troca-se pelo "real" no futuro sem mudar o contrato             |
| **context-data**                     | o que o repo **publica pra fora** (as arestas `coordinates-with`/`answers`/`blocked-by`/contratos) — o **host (governança) agrega** |
| **host**                             | o repo de governança = **dashboard principal** (consome o contexto publicado)                                                       |

- **As 2 camadas da Lente 5 batem:** **INTERNA** = fake-repository + `db.json` local + **view local** (o repo pra dentro, auto-contido) · **EXTERNA** = o **contexto** que o repo publica e o host agrega (o repo pra fora).
- **Contrato-first:** o que sobe pra governança é um **contrato** (a projeção externa, estável); o **detalhe interno** (db local, view) é do repo. Espelha "cliente contrato-estável, implementação swappable".

## 5 · Perguntas abertas (o que a DEC/plano decide)

- **Q1 — escopo "fake" só:** na sim, basta o **fake** (db.json por repo derivado do `.governance/`); o **real** (backend de verdade) fica **fora de escopo** — só **prevemos** a troca (a interface contrato-first). _Confirmar._
- **Q2 — a lib é 1 pacote** (`_lib/`) que cada repo **importa** (simulando o npm), não cópia. _Confirmar._
- **Q3 — a view por-repo:** **HTML estático gerado** (como hoje, simples) **OU** um mini-app que **lê o `db.json` local** (mais fiel ao fake-api, porém mais peso). _Trade-off simplicidade × fidelidade — decisão da owner._
- **Q4 — o context (o que sobe pro host):** quais campos viram o "contexto" publicado e como o host agrega (provável: as arestas + status de contrato).
- **Q5 — onde moram os artefatos por-repo:** `<repo>/.governance/db.json` + `<repo>/.governance/dashboard.(html|app)`? (provável sim.)

## 6 · Direção proposta (seed — o detalhe vai no plano)

Reestruturar a sim em **3 camadas**: **(1)** um **`_lib/` compartilhado** (derive/fake-repository sobre `.governance/` + builder do `db.json` local + context provider + renderer de view); **(2)** **cada repo** monta seu **`db.json` + view** **a partir da lib**, lendo só o seu `.governance/` (auto-contido); **(3)** **governança = host** que agrega o **contexto** publicado → **dashboard principal**. Mantém **contrato-first** entre interno e externo. _Não implementar antes da DEC/aprovação._
