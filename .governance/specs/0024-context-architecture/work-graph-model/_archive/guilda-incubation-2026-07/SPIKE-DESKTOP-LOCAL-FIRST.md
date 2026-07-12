# Spike S2 - Guilda Governance desktop local-first

> **Status:** active spike.
> **Data:** 2026-07-08.
> **Autoridade:** complementa [`APP-DECISIONS.md`](APP-DECISIONS.md) QRD-52,
> [`APP-PRODUCT-STATEMENT.md`](APP-PRODUCT-STATEMENT.md) e
> [`PRODUCT-TOPOLOGY.md`](PRODUCT-TOPOLOGY.md). O objetivo e decidir a
> distribuicao inicial do produto sem abandonar as provas de portal/control
> plane ja feitas.

## 1. Pergunta que o spike responde

O caso pessoal fundador e:

```text
Uma pessoa trabalha diariamente com varios workspaces e varios repos.
Ela quer abrir um app, apontar para pastas/repos locais, criar ou vincular um
governance host Git-backed, trabalhar offline quando necessario e sincronizar
via Git/GitHub quando quiser.
```

Um PWA ou portal web ajuda em login, portfolio, leitura compartilhada e pessoas
nao tecnicas, mas nao resolve sozinho este caso porque nao tem acesso robusto e
permanente a filesystem, Git local, editores, comandos, caches locais e
watchers de repos. O produto precisa de uma superficie desktop para quem vive no
codigo.

Este spike testa a tese:

```text
Guilda Governance v1 deve nascer desktop local-first.
Web/portal continuam como superficies complementares, nao como requisito para
o uso solo/local.
```

## 2. Decisao de produto testada

| Superficie               | Papel na v1                                                                              | Continua? |
| ------------------------ | ---------------------------------------------------------------------------------------- | --------- |
| Desktop local-first      | Superficie principal para dev solo, mantenedora, repos locais, Git, host e trabalho real | Sim       |
| Web/portal compartilhado | Superficie complementar para pessoas de negocio/design/investimento e times              | Sim       |
| PWA                      | Canal publico/marketing/demo ou acesso leve, sem prometer operacao profunda de repos     | Talvez    |
| CLI `guilda flow` futura | Automacao, CI, scripts e operacao repo-first                                             | Sim       |
| `ai-guidelines` atual    | Engine/core repo-first durante transicao                                                 | Sim       |

## 3. Por que desktop nao invalida web

Desktop e web respondem perguntas diferentes.

| Pergunta                                      | Melhor superficie inicial   |
| --------------------------------------------- | --------------------------- |
| Quero abrir uma pasta local e detectar repos  | Desktop                     |
| Quero ver Git dirty/head e operar host local  | Desktop                     |
| Quero trabalhar offline                       | Desktop                     |
| Quero que uma pessoa de negocio veja status   | Web/portal ou desktop leve  |
| Quero convidar alguem sem pedir que opere Git | Portal compartilhado        |
| Quero sincronizar a governanca oficial        | Git/GitHub/GitLab/Bitbucket |
| Quero automacao em CI                         | CLI                         |

O erro seria escolher uma superficie e fingir que ela cobre todas as outras.
O contrato correto e **mesmo modelo, multiplas superficies**:

```text
@demo/domain + @demo/contracts + backend runtime
  -> desktop shell
  -> web/portal
  -> CLI
```

Nenhuma superficie pode inventar um segundo SSOT.

## 4. Fronteira alvo

```text
Guilda Governance Desktop
  UI Next/MUI reaproveitavel
  Shell local Tauri/Rust candidato
  Capabilities:
    - escolher pasta local
    - ler/criar .governance-host
    - descobrir repos Git
    - ler head/dirty/status
    - persistir indice local em SQLite
    - abrir arquivos/repos no sistema
    - sincronizar via Git/GitHub quando configurado

Guilda Governance Web/Portal
  UI Next/MUI reaproveitavel
  Better Auth + Postgres/SQLite conforme topologia
  Capabilities:
    - conta sem senha
    - convite/membership de portal
    - registry minimo de workspace
    - leitura/proposta sobre governance host remoto
    - experiencia para pessoas nao tecnicas

Governance host
  Git-backed e controlado pelo usuario
  Guarda governanca real, policies, decisions, event-log e sourceRevision

CLI / guilda flow
  Automacao headless
  CI, scripts, checks e operacao repo-first
```

## 5. O que este spike implementa agora

Como Rust/Tauri nao esta instalado nesta maquina, este spike nao cria ainda um
crate Tauri. Ele implementa primeiro o contrato de capacidade no backend
TypeScript:

- descobrir repos Git em uma pasta local;
- preservar `git status --porcelain`, incluindo estado dirty;
- criar um `.governance-host/host.yml` minimo e `events/events.jsonl`;
- gerar `sourceRevision` derivado do host e dos repos locais;
- persistir o snapshot local em SQLite (`better-sqlite3`);
- provar tudo em `node:test`, sem browser e sem servidor.

Arquivos:

```text
backend/src/application/desktop-local/desktop-local-spike.ts
backend/tests/desktop-local-spike.test.ts
```

Isso nao substitui Tauri/Rust. Ele reduz risco antes de criar shell nativo: se
o contrato de capacidade local nao for bom em Node, ele tambem nao sera bom em
desktop.

## 6. Criterios de aceite deste spike

| Criterio                                               | Prova atual    |
| ------------------------------------------------------ | -------------- |
| Detectar dois repos Git dentro de um workspace local   | DESKTOP-01     |
| Mostrar repo dirty sem esconder drift                  | DESKTOP-02     |
| Criar `.governance-host` file-first                    | DESKTOP-03     |
| Persistir indice local em SQLite                       | DESKTOP-03     |
| Nao exigir portal, conta, magic link ou Postgres       | DESKTOP-01..03 |
| Manter Git/GitHub como lugar seguro da governanca real | QRD-52         |

## 7. Decisoes que o spike ainda nao fecha

Este spike nao decide sozinho:

1. Tauri/Rust como escolha final contra Electron.
2. Empacotamento Windows/macOS/Linux.
3. Auto-update.
4. Permissoes de filesystem no instalador.
5. Como compartilhar uma workspace desktop entre duas pessoas ao mesmo tempo.
6. Como o portal web entra para pessoas nao tecnicas.
7. Quando extrair para repo irmao.

Ele fecha uma coisa menor, mas crucial: **a v1 nao deve depender de um portal
publico para o caso fundador de dev solo/local**.

## 8. Proxima prova recomendada

S2b deve criar uma bancada desktop tecnica, ainda pequena:

```text
frontend/app/spikes/desktop-local/
  mostra workspace local detectado
  lista repos Git/head/dirty
  mostra governance host local
  mostra snapshot SQLite
```

S2c deve decidir Tauri vs Electron com prova real:

- abrir dialogo de pasta;
- chamar o mesmo contrato de capacidade;
- empacotar um build minimo;
- medir complexidade de instalacao local;
- confirmar se a UI Next/MUI atual pode ser reaproveitada sem fork.

## 9. Regra de seguranca

Desktop local-first nao significa menos governanca.

- O app local pode ler filesystem autorizado pela pessoa.
- O app local nao deve enviar conteudo de repo para portal sem acao explicita.
- O portal nao vira SSOT de governanca.
- Git dirty/head/sourceRevision devem ficar visiveis.
- Mutacao continua passando por comando, policy e event-log.
- Se sincronizar no GitHub, o host/versionamento seguem sendo a prova.
