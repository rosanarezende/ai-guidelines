---
artifact-kind: research
---

# Modelo Conceitual

- **Implementação:** É a alteração de código ou especificação proposta (commit ou PR). Sempre existe. O artefato canônico da implementação é o próprio diff/commit, versionado no repositório (SSOT do projeto). Ele documenta _o quê_ foi mudado e gera automaticamente informações como arquivos alterados, linhas adicionadas/removidas, etc. Em outras palavras, a implementação é o ponto de partida – as mudanças de fato – e vive no repositório de código (por exemplo, no branch do PR).

- **Revisão:** É o processo opcional de examinar a implementação. Uma revisão pode ter perfis diferentes (arquitetural, de segurança, de desempenho, rápida, profunda etc.), conforme a escolha do solicitante. O output canônico de uma revisão _não_ é um comentário, mas sim um artefato versionado que reúne contexto e _findings_ (achados, recomendações, ou riscos). Esse artefato pode ser um arquivo (por exemplo, `reviews/RV-001.md` ou `.yml`) no próprio repositório, contendo metadados (quem revisou, data, tipo de revisão, decisão) e lista categorizada de problemas encontrados. Os comentários de PR tornam-se então apenas projeções desse artefato – por exemplo, um único comentário sintético referenciando o ID da revisão e link para o artefato completo. Essa abordagem (“revisão como artefato”) é inspirada em práticas de auditoria formal, onde o “relatório de revisão” é gravado como evidência duradoura【3†L460-L469】, em vez de ficar disperso na timeline do PR.

- **Finding (achado):** Elemento atômico de uma revisão. Cada finding representa um problema, vulnerabilidade, risco ou sugestão identificada. Cada finding tem atributos claros: _descrição_, _severidade_ (p. ex. Critic/H/M/L), _status_ (Aberto, Resolvido, Aceito como risco, etc.) e possivelmente _categoria_ (ex: segurança, estilo, performance). Os findings vivem no artefato de revisão como itens enumerados. Eles têm ciclo de vida: criados na revisão, depois resolvidos (refatorado) ou aceitos/ignorados (exceção). Através do repositório, podemos consultar o estado atual de todos os findings (quantos abertos, quais severidades) – o “estado” – e também manter histórico completo de eventos (quando um finding foi aberto, alterado ou fechado) como logs no próprio artefato (por exemplo, histórico em `review.yml` ou commits).

- **Gate Humano:** É a decisão final sobre o PR, tomada por uma pessoa. Não é apenas um comentário: é uma aprovação formal ou solicitação de mudanças. Em termos arquiteturais, tratamos o Gate como um artefato de decisão separado. Por exemplo, podemos ter um arquivo `gates/HG-001.md` registrando o veredito humano (“Approved” ou “Request changes”), data, aprovadores e uma síntese. No GitHub, esse “gate” aparece como o clique em _Approve/Request changes_ no PR. A saída principal do Gate é binária (aprovar ou reprovar o merge), mas também pode comentar brevemente ou apontar artefatos de revisão. Sua importância é validar que _todos_ os requisitos (funcionais, de segurança, processo) foram atendidos antes do merge. Em suma, o Gate consome o estado consolidado dos findings (quantos ainda abertos, etc.) para decidir. Ele marca o ponto onde se diz: “Sim, podemos avançar” ou “não, voltar à etapa anterior”.

- **Pull Request (PR):** A PR é meramente uma “superfície de integração” operacional. É como um canal temporário que reúne a implementação, vincula revisões e gates, e executa checagens automáticas. O conteúdo crucial dela é mínimo: link para o branch, título/descrição sucintos, possivelmente referências a itens externos (issues, tickets). Tudo o que for estático ou duradouro não deve ficar no PR, mas sim no repositório. Por exemplo, não queremos listar _todos_ os findings ou discussões no próprio PR. Em vez disso, o PR exibe **estado atual**: número de checks aprovados, se há aprovação humana, e pode ter um único comentário fixo (ex. “Status do PR: revisão RV-001 completa, aguardando aprovação.”). A PR não guarda histórico de conversas críticas; ela referencia artefatos versionados (e.g. “Veja reviews/RV-001.md”). Em vez de ser fonte de verdade, é apenas a trilha de execução: _“Esta implementação foi revisada e agora aguarda meu sinal”_. Em resumo, tudo o que importa fica no repositório, e o PR mostra somente o essencial operacional.

# Arquitetura Recomendada

**Visão geral:** A proposta é uma canalização em etapas claramente separadas, governadas por artefatos versionados:

```
Implementação → [Revisão] → Findings → [Gate Humano] → Merge
        ↓             ↑                 ↑
     Commit/PR       Artifact          Decision
        ↓             ↑                 ↑
Repository (SSOT) ← (State & History) ← (Recorded)
```

- **Implementação:** O desenvolvedor (ou IA) faz um commit/branch e abre um PR. Isso dispara validações básicas (linter, testes, etc.). Essa etapa produz apenas os diffs no repo – nada permanece na PR além de integrá-los.

- **(Opcional) Revisão:** Se o escopo demanda, um ou mais reviewers (podem ser humanos, IA ou ambos) realizam a revisão. Cada review gera um _artefato de revisão_ no repositório (por ex. `specs/0024/reviews/RV-001.md`). Nele constam cabeçalhos (ID, data, autor, tipo de revisão, decisão preliminar) e a lista de findings categorizados por severidade【3†L460-L469】. Além disso, um sumário indica se aprova ou pede mudanças (mesmo que provisório). No PR, registra-se apenas algo como: “RV-001: Revisão [tipo] – Changes Requested”, com link pro arquivo. Não se repetem as mensagens no PR.

- **Findings (estado consolidado):** Os findings do artefato formam o quadro de situação atual. Podemos ter outro arquivo (ex: `review_log.yml`) ou anexa-los no final do review.md) indicando quais findings foram resolvidos e quais permanecem abertos. Assim, extrai-se quantos problemas restam (ex: “8 issues abertos”). Esse estado (zero findings abertos seria meta) é o que o gate humano consumirá.

- **Gate Humano:** Uma vez que a(s) revisão(ões) estejam concluídas (todas tratadas ou aceitas as pendências), um responsável (owner, arquiteto líder, etc.) analisa. A decisão é registrada como artefato (por ex. `specs/0024/gates/HG-001.md` com status Aprovado/Rejeitado, justificativa mínima e data). Em paralelo, o humano clica no _Review_ do GitHub PR com Approve/Request Changes. Esse clique serve apenas para integrar com o fluxo do GitHub (por ex. para permitirem o merge automático) – os detalhes ficam no arquivo do gate. Assim, o “approval” do GitHub é consequência (soft boundary) dessa decisão.

- **Merge (Integração final):** Se o gate aprovado, faz-se merge. A versão mesclada agora inclui todos os artefatos: a implementação **e** seus artefatos de governança. O histórico completo (commits + review MD + gate MD) fica assim versionado.

Este fluxo garante que **o repositório é a fonte de verdade** (SSOT). Todas as decisões e evidências ficam em arquivos controlados por versionamento, seguindo o princípio de “executar a governança via código”【16†L241-L249】. O PR serve apenas para acionar o trabalho e reportar o status atual, sem ficar inchado com conteúdo duplicado.

# Modelo de Dados (YAML/Markdown)

Propomos estes templates:

- **Review (revisão):** Por exemplo, `specs/0024/reviews/RV-001.yml`:

  ```yaml
  id: RV-001
  type: architectural  # ou security, performance, etc.
  requested_by: @alice
  reviewer: @bob
  date: 2026-06-01
  decision: changes_requested  # ou approved, blocked
  summary: "Solicita ajustes em X e Y"
  findings:
    critical: []
    high:
      - id: F-10
        description: "Falta validação de inputs no módulo Z"
        status: open
      - id: F-11
        description: "Uso de API legada no componente W"
        status: resolved
    medium:
      - id: F-12
        description: "Teste faltando para função Q"
        status: open
    low: []
  ```

  Nesse formato, tudo está no repositório. Quando um finding é resolvido, atualiza-se seu status para `resolved` (ou move-se para `closed`).

- **Finding (achado):** Cada finding tem pelo menos:

  ```yaml
  id: F-12
  severity: medium
  description: "Teste faltando para função Q"
  status: open # open | resolved | accepted | dismissed
  ```

  Normalmente eles estão embutidos nos arquivos de revisão. Poderíamos extrair para arquivos dedicados (`findings/F-12.yml`) se desejar histórico separado, mas é opcional.

- **Gate (decisão humana):** Exemplo `specs/0024/gates/HG-001.yml`:

  ```yaml
  id: HG-001
  date: 2026-06-01
  decision: approved  # approved | changes_requested
  comments: "Todas as pendências tratadas. Bom para avançar."
  approved_by:
    - @owner (2026-06-01)
  ```

  Esse artefato registra que o PR foi aprovado no dia X pelo owner, podendo opcionalmente indicar revisores adicionais. Ele seria criado logo antes do merge.

- **Estado Consolidado (opcional):** Poderíamos ter também um sumário global no final do `review.yml` ou num log separado, por exemplo:
  ```yaml
  total_findings:
    open: 2
    resolved: 1
  ```
  Ou simplesmente inferir do próprio `findings`.

Veja que todos esses modelos usam a facilidade do Git para armazenar YAML/Markdown no projeto. Citações do SmartBear e de Martin Fowler reforçam que “documentos em revisão devem ser versionados com todo o histórico”【16†L241-L249】【3†L460-L469】.

# Fluxos Operacionais

1. **Nova Implementação e PR:** Desenvolvedor cria branch, faz commits, abre PR com título e descrição breve (por exemplo, “Implementa check X no subsistema Y”). PR tem checks automáticos básicos (compilação, testes). Neste ponto, _ainda não há review nem gate_.

2. **Solicitação de Revisão (se aplicável):** Dependendo da política, o autor solicita uma revisão específica (por perfil). Pode marcar “@ai-bot review arquitecture” ou chamar um colega. Um agente (humano ou IA) faz a revisão. Ao concluir:
   - O revisor cria/atualiza `specs/XXXX/reviews/RV-XYZ.md` com findings, conforme template. Usa IDs únicos (RV-XYZ, F-xyz).
   - Ele registra no artefato sua decisão preliminar (aprova ou pede mudanças).
   - No PR, ele posta _um único comentário sintético_: e.g. “**AR-001**: Architectural Review (Requested Changes). Veja `specs/0024/reviews/AR-001.md` para detalhes.” Isso permite ao autor saber o resultado sem detalhes repetidos no PR.
   - A partir daí, o PR pode mostrar, por exemplo, um status-check personalizado “Review:Changes Requested” (implementado via GitHub Checks ou action).

3. **Iterações de Revisão:** O autor corrige o código. Ele atualiza os findings no artefato (marca `status: resolved` nos que tratou, ou os remove). Para cada nova rodada, edita o mesmo `RV-XYZ.md` ou cria um novo `RV-XYZ` com incrementos. Importante: **não apaga o arquivo original**, preserva o histórico. Se for necessária nova revisão, repete-se o passo 2 (agora talvez “Revisão de segurança” com outro ID).

4. **Conclusão de Revisões:** Quando todos os reviewers concordam (ou o processo exigir) que não há _mais_ findings críticos abertos, o estado fica “0 findings high/critical abertos; os restantes são médios/baixos opcionalmente aceitos”.

5. **Gate Humano:** O owner (por exemplo, arquiteto responsável) verifica o estado final:
   - Lê `specs/.../findings...` para ver pendências.
   - Se aceitável, cria o artefato `specs/XXXX/gates/HG-001.md` com `decision: approved`. Usa o PR do GitHub para clicar em **Review > Approve** (mas sem listar novamente findings). O conteúdo do YAML do gate fornece auditoria; o click no GitHub só serve para liberar o merge, conforme configurações de branch (as `required_status_checks`).
   - Se houver urgência ou discrepância, ele pode fazer `decision: changes_requested` e, como nos reviews, postar um breve comentário (“HG-002: Gate requested changes – ver comentários”) para indicar recuo.

6. **Merge:** Uma vez aprovado pelo gate, o PR pode ser mesclado. O merge resultante agora inclui os artefatos de revisão e gate. A memória está no repo: no branch principal, ficam commit de código + arquivos de revisão/decisão. O GitHub mostrará estes artefatos na árvore de código, não nos comentários.

7. **Pós-Merge:** Em casos regulados (ex.: compliance), a organização pode exportar esses artefatos de revisão/gate como evidências. Como tudo foi versionado e revisado via o processo normal (pull requests de artefato inclusos), o histórico prova que cada mudança passou pelas etapas certas.

# Integração GitHub (PR, Comentários, Checks)

Para não perder a conveniência do GitHub:

- **PR Body:** Deve conter apenas uma descrição sumária do que foi implementado ou link para uma Story/Issue. Nada dos findings. Pode conter links para artefatos importantes (p. ex. `relacionado a specs/0024/reviews/RV-001.md`). Mas não precisa listar detalhes.
- **PR Comentários:** Em vez de dezenas de comentários do bot ou humanos, teremos _no máximo_:
  - **1 comentário por revisão completa**: ex. “RV-001 (security): changes requested” com link para arquivo. Ele é fixo (pode ser editado em vez de criado sempre).
  - **1 comentário final de gate (humano)**: ex. “HG-001: PR Approved” ou “Changes requested”. O comentário de aprovação (o “Approve”) por si só já aparece no GitHub (no painel de _Checks_), então este pode ser apenas uma formalidade (ou nem comentar se a plataforma mostrar o approval status).
  - _Comentários inline:_ Para debate fino, poderíamos usar comentários de linha do GitHub como sempre, mas o ideal é evitar acumular milhares. O foco está no artefato, não na thread.
- **Status Checks / GitHub Actions:** Criar checks customizados. Por exemplo:
  - `review/architectural` – passa se não há findings High/Critical abertos da revisão arquitetural. Pode ser um workflow que lê o YAML `RV-XXX` e falha se algum item com severidade ≥ High estiver marcado `open`.
  - `review/security`, etc. Cada tipo de revisão pode ter um check.
  - `human-gate` – passa somente depois que o gate YAML existe com `approved`. (Ou simplesmente use o GitHub _required approvals_ como checagem).
  - Assim, o PR exigirá que todos checks “review” passem antes do merge. Se não, o PR não permite merge (force a “porta de aprovação”).
- **Artefatos / Templates:** Organizar diretórios do repositório, por ex.:
  ```
  specs/0024/
    reviews/   # arquivos RV-XXX
    gates/     # arquivos HG-XXX
    findings/  # (opcional) arquivos F-XXX
  ```
  Todos commitados normalmente.

Esse esquema combina repositório **estado** (os arquivos, versionados, auditáveis) com PR **timeline** (um ou dois comentários de síntese, e o mecanismo de “approvals/checks” do GitHub) sem duplicar conteúdo. As diretrizes do GitHub enfatizam que um PR deve mostrar apenas o necessário para o fluxo (link para código, status dos checks, quem aprovou) e não ser repositório de documentação pesada. Nossa integração proposta segue a lógica de “evidências na repo, bot como curador”.

Por exemplo, quando o bot ou o Humano aprova, ele pode emitir:

```
gh pr review $PR --approve --body "HG-001: all checks passed. Ready to merge."
```

Isso aparece no GH mas não repete findings (os quais já estão em specs).

# Estratégia de Implementação no ai-guidelines (Fases)

1. **Fase 1 – MVP (compativel com Spec 0023):**
   - _Estado atual:_ PRs geram comentários longos e artefatos dispersos.
   - _Meta:_ Consolidar revisão e decisão em poucos arquivos.
   - _Tarefas:_
     - Padronizar modelo dos artefatos de revisão (ex: criar pasta `specs/.../reviews` e template MD/YAML).
     - Modificar os bots (Claude/AGY/Codex) para escrever nesse modelo (por ex. seguindo [3]).
     - Nos PRs existentes, passar a criar um único comentário de revisão (com link) em vez de vários.
     - Exigir 1 revisão humana (ou CI) e apenas 1 aprovação do PR como gate.
   - _Exemplo:_ Ao rodar `yarn validate` ou similar, em vez de `console.log` no PR, o agente adiciona `specs/0024/reviews/AR-001.md`.

2. **Fase 2 – Revisão como Artefato:**
   - _Meta:_ Completar a migração para “Revisão como Artefato”.
   - _Tarefas:_
     - Consolidar todos comentários de revisão existentes em arquivos no repositório (refatorar `#33`).
     - Criar CI that reads these YAML/MD files and enforces consistency (IDs únicos, todas pendências resolvidas antes do merge).
     - Documentar no guia de contribuição como escrever uma revisão (estrutura, severidades, etc.).
     - Ajustar os bots de PR para postarem só um comentário mínimo (revisão completa linkada).
   - _Exemplo:_ O CI Failá se detecta um `status: open` em revisão crítica quando tentamos marcar o PR como “reviewed”.

3. **Fase 3 – Automação de Findings:**
   - _Meta:_ Permitir que revisores (AI ou humanos) criem findings automaticamente via ferramentas.
   - _Tarefas:_
     - Escrever ou integrar ferramentas para detecção de problemas (linters, scanners de segurança, ou IA).
     - Automatizar o preenchimento do YAML de findings (ID, descrição, severidade).
     - Possibilitar comandos para marcar um finding como “resolvido” (p. ex. commit uma tag `#resolve F-12`).
     - Implementar checks de CI que falham se houver findings abertos acima de certo nível.
   - _Exemplo:_ Um GitHub Action lê `specs/.../reviews/RV-XXX.yml` e aponta “3 high issues ainda abertos” como check failing.

4. **Fase 4 – Gate Humano Formalizado:**
   - _Meta:_ Tratar a aprovação humana como artefato de controle.
   - _Tarefas:_
     - Criar template para arquivos de gate (`specs/.../gates/HG-XXX.yml`).
     - Exigir que o merge só ocorra se existir um `HG-...: approved`. (Ex.: GitHub _required check_ que barra o merge se ausente.)
     - Atualizar documentação para mostrar que o “merge” precisa deste artefato, não apenas do clique no PR.
     - Integrar com nosso workflow de branch rules – pode ser um step de CI também.
   - _Exemplo:_ Tentar dar merge sem o arquivo `HG-XXX` aprovado resulta em erro “Human approval artefact missing”.

5. **Fase 5 – PR Mínimo / Workflow Plena:**
   - _Meta:_ Reduzir ao essencial o uso do PR.
   - _Tarefas:_
     - Remover qualquer escrita automática de findings ou logs no corpo/comentários do PR.
     - Usar “Create or update comment” GitHub Action para manter um único comentário de status (edita em vez de novo).
     - Talvez até migrar para uma ferramenta externa de comentário (como abrir issue e fechar) se fizer sentido, mas preferencialmente ficar no PR.
     - Assegurar que a única fonte legível do workflow pelo usuário seja o repositório e o resumo no PR; as regras de branch e checks dirigem tudo.
   - _Exemplo:_ Após a revisão RV-002, o PR só mostra “Arquitetural Review: Approved” e o check “reviews/all” verde; não tem 10 comentários sobre cada bullet.

**Hipótese Fundamental:** Neste modelo, _“comentários de PR não são memória do processo, mas apenas interface operacional”_. Toda a governança é feita em “governance-as-code” – revisão gera artefato no repo, findings são persistidos, gate é documento. O PR serve apenas para orquestrar a integração e evidenciar aprovação final. Isso alinha-se com a filosofia já documentada: “o repositório é a memória” e “instruções no repositório executam a governança”【16†L241-L249】.

Ao adotar essa abordagem, a discussão passa de “como melhorar comentários em PRs” para “como modelar a governança da revisão em artefatos versionados”. Isso garante auditabilidade (todo histórico está no Git), reprodutibilidade (dados nas máquinas), e flexibilidade (vários tipos de revisão suportados via metadados). O ai-guidelines então evolui de roteiro pontual de revisão para um _framework completo_ de governança por artefatos.

**Fontes:** Exemplos dessa prática já existem na comunidade. Por exemplo, ferramentas de AI review criam artefatos `*.md` no repo com findings detalhados, e usam apenas sumários para comentários de PR【3†L460-L469】【3†L501-L511】. Da mesma forma, guias de engenharia moderna defendem codificar as políticas de equipe como artefatos executáveis e versionados em vez de deixá-las em comentários dispersos【16†L241-L249】. Estas referências orientam que mover “tudo que é permanente” para o repositório e deixar o PR para “apenas o essencial” é uma prática recomendada.
