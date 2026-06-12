# Dogfood CO-4 — active specs drift mascarado por fallback (2026-06-11)

> **Natureza deste documento:** evidência arquitetural do checkpoint `checkpoint-co-projection`
> (nó `co-projection`, seq 8, PR #41). NÃO é handoff datado (PIT-0010/GG-0004: handoffs
> persistidos são registro histórico, nunca superfície de retomada). Alimenta os requisitos
> do `deriveHandoff`/`handoff:check` deste mesmo nó.

## Contexto

Primeira retomada de sessão usando o handoff derivado (`npm run guidelines -- handoff 0024`)
como ponto de entrada, no primeiro dia útil do nó `co-projection` (PR #41 Draft, stacked
sobre #39, HEAD `2f90d41`). O handoff é exatamente o mecanismo que o CO-4 vai estender —
ou seja, o episódio é dogfood do próprio objeto do checkpoint.

## Reprodução

```text
git checkout feat/spec-0024-co-projection   # branch real do nó ativo
npm run guidelines -- handoff 0024          # retoma branch/PR/cursor CORRETOS
cat .governance/runtime/specs/active.yml    # branch: feat/spec-0024-bootstrap-compiler (stale, 2 nós atrás)
npm run active-specs:check                  # ✅ passava (escopo: só stage)
```

## Fato observado

- O handoff retomou corretamente branch, HEAD, PR (#41), cursor (`co-projection ·
checkpoint-co-projection`) e narrativa.
- Mas `active.yml` projetava `branch: feat/spec-0024-bootstrap-compiler` (`updated_at`
  2026-06-09) — **duas gerações stale** (#38 → #39 → #41): nem a transição para
  `toolchain-simplification` nem a para `co-projection` republicaram a projeção.
- A resolução do handoff era **projeção-primeiro** (match de branch em `active.yml`);
  como o match primário falhava silenciosamente, um **fallback por regex** (`spec-(\d{4})`
  no nome do branch) encontrava a spec — e nada declarava que o fallback tinha sido usado.
- `active-specs:check` passava porque o escopo original (herdado da 0023) validava apenas
  `stage`, tratando `branch` como "registro factual fora de escopo".
- A divergência só ficou visível na reconciliação humana/agente (primeiro turno do handoff).

## Hipótese anterior falsificada

> "`branch`/`updated_at` são registros factuais, não projeções de `state.yml`, então não
> entram no drift guard" (escopo original do `active-specs:check`, era [DEC-0023-A04]).

Falsificada: `branch` pode não ser projeção de `state.yml`, mas é **projeção de um fato**
(git no momento do publish) — e fato→projeção também drifta. Pior: a projeção de branch é
**consumida operacionalmente** (era o resolver primário do handoff), então o drift não era
inofensivo; era mascarado. Classe do erro:

```text
projeção situada stale continua aceita porque um fallback
operacional encontra a spec correta e esconde a divergência
```

## Impacto

- Qualquer consumidor de `active.yml` que confiasse em `branch` se situaria **dois nós
  atrás** (mesma classe do PIT-0010, que motivou o GG-0004 — agora numa superfície YAML,
  não Markdown).
- O evento de atualização (`workflow publish-state` na transição de nó) existia, era
  documentado e **ninguém o descobriu no momento da ação** em duas transições seguidas —
  ocorrência direta do PIT-0011 (contrato executável invisível), registrada via
  `insight saw PIT-0011` (visto 2×).

## Correção desta rodada (commit `5881a85`)

1. **Checker** (`active-specs:check`): invariantes ampliadas — `branch` projetada × branch
   git factual (quando o branch corrente pertence à mesma spec, id canônico via
   `parseSpecBranch`/[DEC-0023-I01]); round-trip de identidade `id`/`slug` × basename de
   `spec_path`; `source_state_path` × `spec_path`. Diagnóstico declara valor projetado,
   valor factual, fonte de cada um e o comando canônico de reconciliação. Fronteira
   documentada e testada: em detached HEAD (CI de PR) ou branch fora do padrão, o
   sub-check de branch é _skipped_ — o ponto de enforcement determinístico é o `validate`
   local (pre-push) rodando na branch da spec. Coerência projetada×factual é invariante
   de **estado contínuo**, então superfície de check é a correta (taxonomia de superfícies,
   research 2026-06-05).
2. **Handoff**: resolução invertida para **canônica-primeiro** (id do branch → diretório;
   projeção deixa de ser primary resolver — [DEC-0023-I01]); projeção ausente/ilegível/sem
   entry/divergente viram **estados distintos e declarados** (linha `projecao
specs/active.yml:` + seção `⚠ Aviso de projeção` com instrução de reconciliação);
   disponibilidade preservada (handoff continua sendo gerado), confiança degradada vira
   aviso explícito, nunca silêncio.
3. **Projeção regenerada** pelo comando canônico (`workflow publish-state --status=active
--updated-by=@rosanarezende`) — sem edição manual do YAML.
4. **12 cenários de regressão** cravando: branch stale falha; diagnóstico completo;
   fallbacks declarados; reconciliação remove o aviso; multi-spec; fronteiras de
   observabilidade.

## Implicações obrigatórias para o CO-4 (`deriveHandoff` / `handoff:check`)

1. Toda fonte usada pelo renderer deve declarar **origem e frescor** (este episódio: a
   fonte `active.yml` era consumida sem declarar que estava stale).
2. **Fallback nunca pode ser silencioso** — recuperar disponibilidade e declarar a
   degradação são obrigações simultâneas.
3. O handoff precisa **indicar degradação de confiança** no próprio output (implementado
   nesta rodada em forma mínima; o contrato de carga formaliza).
4. **Reconcile-on-load deve comparar projeção × fatos** (ADR 0021) — o primeiro turno
   recomendado já pede isso em prosa; o `handoff:check` torna executável.
5. O **selo de geração deve incluir/representar as fontes situadas** usadas pelo renderer
   (não só HEAD): `state.yml`, `active.yml`, reviews/gates consumidos.
6. **Freshness não pode depender de um Markdown persistido** — a fonte que envelheceu aqui
   era YAML de runtime; o check tem de validar fontes×fatos, não a idade de um artefato.
7. **stdout segue candidato a superfície primária** (este episódio não exigiu persistência
   para detectar o drift — exigiu comparação fonte×fato no ponto de consumo).
8. **Projeção persistida, se existir, deve ser descartável e regenerável** pelo comando
   canônico (como `active.yml` é via `publish-state` — o que faltava era o guard, não a
   regenerabilidade).

## Perguntas que permanecem abertas (não resolvidas nesta rodada)

- Persistir ou não a projeção do handoff em `.governance/runtime/handoff/` (decisão
  arquitetural preliminar registrada no PR; implementação fora desta rodada).
- Forma do selo de geração (o que carrega; contra o que o `handoff:check` compara).
- Fonte canônica da "próxima ação única" (campo `next:` do último gate approved ×
  `state.next[0]` × cursor/topologia) sem criar segunda fonte narrativa.
- Semântica de ahead/behind numa stack em modo unit (base da stack × origin × main).
- Em qual evento governado a republicação da projeção deveria ser _cutucada_ (a correção
  desta rodada torna o drift visível e bloqueante no validate local; o disparo automático
  é assunto do CO-6, não deste nó).

## Rodada 2 (2026-06-11, mesmo dia) — núcleo do CO-4 implementado e dogfoodado

Continuação do mesmo checkpoint: `deriveHandoff`/`deriveNextAction`/freshness/selo +
`handoff:check` advisory implementados e rodados contra o próprio PR #41.

**O que funcionou (verificado no output real, HEAD `0c796fb`):**

- `handoff 0024` identificou #41 Draft (estado/base/head via gh), cursor
  `co-projection · checkpoint-co-projection`, ahead/behind 0/0, CI 12 pass;
- 7 fontes declaradas com origem/status/fingerprint; selo determinístico exibido
  (rodada com gh vivo: `adb3ff7c0a00` sobre HEAD `0c796fb`; mesmas fontes ⇒ mesmo
  selo, verificado por dupla geração);
- próxima ação única derivada das TAREFAS REAIS (tasks.md linha 98), não de
  `state.next[0]` — narrativa stale comprovadamente não altera a decisão (teste 9);
- proibições derivadas do estado: sem merge isolado (nó não-terminal/unit), sem
  Ready (precondições pendentes), sem gate artifact antes da decisão humana, sem
  abrir co-enforcement, sem sair do checkpoint;
- fonte remota indisponível (coletor lançando erro, via fixture — sem derrubar a
  rede real): handoff continua, `pull-request · unavailable` declarado, e quando a
  decisão depende do remoto a ação vira `reconcile-remote-source` (teste 11);
- nada persistido: `.governance/runtime/handoff/` não existe antes nem depois
  (teste de listagem).

**Hipótese falsificada na rodada:** "insights da spec inteira são contexto útil de
retomada" — falso: os 9 PITs abertos da 0024 viraram ruído; relevância situada =
ocorrência no checkpoint do CURSOR (após o filtro, só PIT-0011 aparece — o certo).

**Ajustes feitos durante o dogfood:** filtro de insights por cursor (acima);
`--no-remote` na CLI (offline explícito ≠ falha silenciosa); fixture de topologia
exige nó terminal (contrato do parser de state.yml, descoberto em teste).

**Próxima lacuna (não implementada nesta rodada):** contrato de carga formalizado
(reconcile-on-load executável de ponta a ponta — o `handoff:check` cobre freshness,
mas a comparação projeção×fatos no MOMENTO da carga do agente segue prosa);
ahead/behind vs base da STACK (hoje é vs upstream); disparo automático = CO-6.

## Rodada 3 (2026-06-11, mesmo dia) — contrato de carga / reconcile-on-load

**Contrato escolhido.** Não é possível provar que uma LLM _compreendeu_ uma narrativa —
qualquer tentativa nessa direção viraria teatro de compreensão (quiz, eco, assinatura
de prosa). O que É provável, e o que o contrato passa a provar:

```text
- a retomada foi solicitada            (comando executado)
- as fontes foram reconciliadas        (coleta + diagnósticos no mesmo ato)
- o handoff derivou de snapshot coerente (coleta única; anti-TOCTOU por HEAD)
- a sessão recebeu um selo correspondente (selo no stdout == selo no recibo)
- comandos posteriores detectam staleness (handoff:check: fresh/missing/
  stale-head/stale-sources/invalid, comparação por HEAD+fingerprints, nunca timestamp)
```

**Recibo como evidência local efêmera.** `.git/ai-guidelines/handoff-load.json`
(git-dir real via `rev-parse --absolute-git-dir`; worktree-safe): só fatos operacionais
(contractVersion, specId, branch, head, sourceSeal, fingerprints por fonte, degradações,
loadedAt fora do selo, comando de recarga). Não versionado, não-SSOT, apagável e
reconstruível por nova carga; recibo stale NUNCA é reescrito por check — só a carga
explícita reescreve.

**UX (sem duplicação).** O ato de carga É o próprio `handoff` (caminho canônico já
ensinado pelo AGENTS stub); `handoff:check` consulta; `continue` permanece como
briefing intra-sessão (propósito distinto; nenhum verbo novo `load`). `renderHandoff`
programático não grava recibo (consulta ≠ carga).

**Resultado do dogfood (PR #41, HEAD `5906666`):** recibo removido → carga → recibo
criado com selo IDÊNTICO ao do stdout (`eeb61fb9b65d`) → check `fresh — retomada
reconciliada`. Stale demonstrado: (a) por fonte — carga `--no-remote` + check com
remoto → `STALE (fontes): pull-request`, com selos carregado×atual e comando de
recarga; (b) por HEAD/fonte em fixtures (16 casos de teste, sem commit artificial);
recarga reconcilia. Guarda futura para comandos mutantes: `assertFreshHandoffReceipt`
(implementada e testada; deliberadamente NÃO conectada — wiring é evolução de
enforcement/CO-6).

**Hipótese falsificada:** "provar a carga exigiria persistir o handoff (Markdown) ou um
manifesto governado". Falso: selo determinístico + recibo efêmero fora do versionamento
bastam — nenhuma superfície governada nova, nenhum estado que possa driftar no repo
(a Opção A da rodada 1 sobrevive intacta).

**Limites deliberados:** ausência/stale de recibo é advisory (sem bloqueio global);
nenhum comando mutante consulta o recibo ainda; nada em `.governance/runtime/handoff/`;
CO-3/CO-6 intactos.

## Rodada 4 (2026-06-12) — contrato global carregado na cápsula

**Pergunta da owner:** uma sessão nova recebe e consegue verificar QUAL repositório,
QUAL contrato global de comportamento e QUAIS regras se aplicam — ou só o estado mutável?

**Lacuna encontrada:** o handoff listava `AGENTS.md`/catálogo na ordem de leitura e
injetava regras mínimas em texto FIXO (inventado no renderer), mas o selo/recibo não
provavam que bootstrap e catálogo participaram do snapshot — o contrato carregado era
invisível ao reconcile-on-load.

**Decisão:** três camadas distintas na mesma cápsula compacta — identidade+contrato
global do repositório / regras aplicáveis / estado operacional mutável — sem copiar
doutrina, sem segunda SSOT (o handoff projeta ids+títulos e aponta
`.core/rules/catalog.md`).

**Contrato global carregado (fontes reais, nada inventado):**

- identidade: `package.json` (name+description; "framework (mantenedor)" × "consumidor
  do framework" pela mesma heurística do runtime bootstrap; versão de release fora do
  fingerprint) + fato verificado `.governance/specs/` como SSOT estrutural;
- bootstrap: bloco compilado `<AI_GUIDELINES>` do `AGENTS.md`;
- regras globais: `rules.json` — seleção pelos metadados JÁ canônicos
  (`scope: universal` + tag `always_injected` ⇒ 16 CORE neste repo); **nenhuma tabela
  paralela criada** (a aplicabilidade estruturada por nó não existe no catálogo e NÃO
  foi inventada);
- scripts: `script-contracts.yml`.

**Separação global × nó × estado:** regras globais = catálogo (ids+títulos);
restrições do nó = proibições DERIVADAS de topologia/lifecycle (seção própria,
referenciada pela cápsula sem duplicação); estado mutável = seções 1/2/4/5.

**Fingerprints adicionados (semânticos):** `repository-contract`, `runtime-bootstrap`,
`rules-contract` (canônico: exclui `generated_at` e índices derivados; regras/tags
ordenadas — mudança de título/instrução muda o fp; volátil/ordem não muda),
`script-contract`. Contrato do handoff v1→v2 (recibos v1 viram `invalid` ⇒ recarga).

**Resultado do dogfood (HEAD `59a059e`):** 11 fontes fresh; cápsula com identidade +
16 obrigações [CORE-01..16] (id+título; ~28 linhas; output total ~95 linhas); recibo
fresh selo `23d0c8b4d666` (contrato v2) cobrindo as 4 fontes novas. Fixtures: mudança
semântica em regra ⇒ selo muda ⇒ recibo stale-sources nomeando `rules-contract`;
`generated_at`/ordem ⇒ selo estável; bootstrap/script-contracts alterados ⇒ check
nomeia a fonte; **sem bootstrap ou catálogo obrigatório NÃO existe recibo fresh**
(carga renderiza degradada, drift prioriza reconciliação); repo consumidor fixture
recebe a identidade/regras DELE (zero contexto local do framework vazado).

**Fronteira com enforcement (cravada no código):** co-projection prova qual contrato
foi carregado, reinjeta obrigações e detecta staleness; co-enforcement (CO-3)
transforma regras/decisões em bindings/checks executáveis adicionais.

**Limites restantes:** seleção por nó continua = derivação operacional (catálogo não
tem escopo por nó — extensão só se um caso real exigir); enforcement do recibo segue
desconectado; substituída a seção fixa "Regras situacionais mínimas" pela cápsula
derivada (texto inventado eliminado do renderer).

## Rodada 5 (2026-06-12) — contrato de review invisível

**Pedido simples da owner:** "faça uma auditoria técnica". **O que foi preciso:** um
mega-prompt reconstruindo spec/checkpoint ativos, intervalo, papel, path do artefato,
schema, geração de fingerprints, comandos, ações permitidas/proibidas, formato de
devolução, commit/push e GitHub. **Mesmo assim** (Technical Audit via Antigravity,
2026-06-12): (1) o agente publicou comentário redundante no PR porque o prompt citava
GitHub como projeção opcional — comentário SEM autoridade governada; (2) narrou um
fingerprint divergente do real do artefato (`538f2be5aed1`); (3) seria preciso um
segundo prompt extenso só para reconciliar a evidência.

**Hipótese falsificada:** "review-policy + schemas + templates + review:seal +
review:check bastam para tornar o review operacionalmente descobrível". Falso — o
contrato EXISTIA no repositório inteiro e não era projetado no momento da ação
(3ª ocorrência do PIT-0011, registrada via `insight saw`).

**Correção (briefing situado de reviews):** `npm run guidelines -- review
<technical-audit|architectural-review>` — o verbo `review` passou à governança
(ReviewCommand; `review [<pr>]` numérico delega ao triage, compat v1.1.0). O comando
é um ATO DE CARGA (mesmo snapshot do handoff via `loadHandoffSnapshot`; recibo
atualizado; anti-TOCTOU) e projeta: papel/objetivo/autoridade (lane governada em
`review-policy.yml § review_lanes` — vetores por papel, nada hardcoded no renderer);
**modo inferido determinístico** (create / current / verification / blocked, com base
factual); objeto auditado (base/head/intervalo); artefato-alvo exato (path canônico,
template, `EV<N>` append-only); findings/resolutions/events da lane; ações
permitidas/proibidas; comandos de validação; estrutura padronizada do relatório final.

**Proveniência do objeto auditado:** novo campo `subject_ref` (SHA ou `base..head`)
nos reviews e eventos — backward-compatible (extensão tagueada no
`review_fingerprint`; elemento condicional no `event_fingerprint`; selos históricos
byte-idênticos; `review:seal`/`review:check` reconhecem). Reviews históricos sem o
campo = proveniência `unknown` → NUNCA "fresh" por suposição → modo `verification`
degradado (revalidar cobertura completa). Templates documentam o campo.

**Política de publicação machine-readable** (`review-policy.yml § publication`):
artefato na spec = canal canônico; **GitHub forbidden-by-default**; comentário/review
remoto só com autorização explícita da owner. O briefing exibe; nada é publicado
automaticamente; sem fallback que comenta porque APPROVE falhou.

**Dogfood no estado real do #41:** `review technical-audit` → TA existente
(`approved`, fp real `538f2be5aed1` no output) SEM subject_ref → **VERIFICATION
degradada** (evento `events/c-co-projection-technical_audit-EV1.yml`; revalidar
cobertura completa até o HEAD final; original preservado). `review
architectural-review` → nenhum AR → **CREATE**
(`c-co-projection-architectural_review.yml`; subject = HEAD atual; vetores
arquiteturais da lane; GitHub proibido). Nenhum review realizado nesta rodada
(implementar o briefing muda o HEAD — revalidação prévia ficaria stale).

**Critério de falsificação da correção:** numa sessão NOVA, a owner pede apenas
"faça o Architectural Review" e o agente (via bootstrap do AGENTS) chega ao
briefing sem mega-prompt. Se ainda precisar de prompt extenso, a correção falhou.

## Referências

- Commit da correção: `5881a85` (fix(spec-0024): enforca coerencia da projecao de specs ativas)
- Insight: PIT-0011 (2ª ocorrência, `insight saw`, 2026-06-11)
- PIT-0010 → GG-0004 (classe irmã: ponteiro de retomada stale em Markdown)
- ADR 0021 (reconcile-on-load), ADR 0022 (handoff situado), ADR 0026 (projeção ≠ entidade)
- research-library/architecture/2026-06-05-enforcement-surfaces.md (estado contínuo × evento)
