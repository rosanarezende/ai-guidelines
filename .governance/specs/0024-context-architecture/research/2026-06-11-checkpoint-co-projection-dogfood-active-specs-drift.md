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

## Referências

- Commit da correção: `5881a85` (fix(spec-0024): enforca coerencia da projecao de specs ativas)
- Insight: PIT-0011 (2ª ocorrência, `insight saw`, 2026-06-11)
- PIT-0010 → GG-0004 (classe irmã: ponteiro de retomada stale em Markdown)
- ADR 0021 (reconcile-on-load), ADR 0022 (handoff situado), ADR 0026 (projeção ≠ entidade)
- research-library/architecture/2026-06-05-enforcement-surfaces.md (estado contínuo × evento)
