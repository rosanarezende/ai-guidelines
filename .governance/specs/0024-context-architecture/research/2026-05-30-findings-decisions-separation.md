# Research — Separação `findings` vs `decisions` (finding estrutural da 0024)

> **Alimenta:** contrato da cadeia (`governance-foundation.md` + `[DEC-0024-G06]`), `[DEC-0024-G04]` (materialização/boilerplates) e `[DEC-0024-G05]` (projeção gate-ready).
> **Classe:** mudança de **processo/artefato** — ortogonal ao _conteúdo_ de G00 (mesma categoria do G06). **Não viola o invariante de ordem**; pode ser implementada com G00 `Pendente`.
> **Data:** 2026-05-30. **Autoria:** owner (dúvida) + ChatGPT (proposta) + Claude Opus 4.8 (análise/dogfood).

---

## Problema

O `decision-brief.md` acumula responsabilidades de **pesquisa + síntese + evidência + decisão**. Sintomas:

1. um bloco `DEC` em `Status: Open` ainda _descobrindo o problema_ **não é decisão — é pesquisa**;
2. o gate humano precisa **reconstruir a síntese** (o que foi descoberto/descartado/sobrou) antes de poder aceitar/rejeitar/reenquadrar;
3. o artefato **cresce demais** — G00 virou quase uma tese (~70 linhas), carregando investigação + evidência + dispositions + decisão;
4. o significado de `DEC` **dilui**.

Isso cria atrito **exatamente no ponto que a arquitetura protege** — o julgamento humano (Camada 3).

## Não é ideia nova — é a forma concreta de uma lacuna já registrada

As obs **#10** e **#11** do preâmbulo do decision-brief e o **`[DEC-0024-G05]`** já diziam: _"a decision-brief define a ESTRUTURA da decisão, não a INTERAÇÃO"_ e _"o decisor humano é consumidor de 1ª classe ainda não modelado — precisa de uma projeção **gate-ready**, não do brief cru."_ ChatGPT nomeou o mecanismo: **separar `findings` de `decisions`.**

## Proposta

| Artefato               | Pergunta que responde              | Contém                                                                                           | Não contém                 |
| :--------------------- | :--------------------------------- | :----------------------------------------------------------------------------------------------- | :------------------------- |
| `research/findings.md` | **o que aprendemos?**              | findings convergidos (`F-NNN`): observação · evidências (refs) · contradições · impacto · status | gate, decisão, aprovação   |
| `decision-brief.md`    | **o que exige julgamento humano?** | por DEC: pergunta · evidências (refs a `F-NNN`) · opções/finding · tradeoffs · gate              | síntese de research inline |

`research/*` (datados) = trilha bruta da investigação. `findings.md` = consolidação convergida. `decision-brief` = só decisão.

## Análise (pela própria lente da 0024)

- **Passa o critério operacional:** remove a re-síntese do humano no gate, encolhe o brief, devolve a `DEC` o significado de _decisão_. **Não é renomear** — muda a ergonomia do julgamento.
- **Guard anti-drift (a lente nos avisa):** o risco é `findings.md` virar cópia paralela de `research/*`. Mitigação cravada: um finding **referencia** a fonte (não duplica) e é **imutável após `Convergido`** (semântica do DEC `Resolved`). Logo é projeção-com-ponteiro, não cópia hand-maintained.
- **Lugar na arquitetura:** refina o seam `research → decision-brief` do contrato da cadeia (`findings` é a saída _entendimento_ da fase de research, agora com casa própria). É **processo** (como G06) → fora do invariante de ordem.

## Dogfood na 0024 (feito nesta rodada)

1. ✅ criado `research/findings.md` com **F-001…F-007** (referenciando as researches; convergidos imutáveis).
2. ✅ **G00 enxugado** (~70 → ~48 linhas): investigação/síntese/dispositions → findings; o bloco ficou _decisão + ponteiros_ (F-001/002/006). **Critério de sucesso atingido:** dá para decidir G00 lendo só o bloco.
3. ✅ **G02** passou a citar F-004/F-005.

**Validação:** o gate de G00 ficou **menor e mais claro** — exatamente o efeito previsto (G00 era grande porque misturava camadas).

## Generalização (próximo incremento — derivar do que funcionou)

1. `findings-boilerplate.md` canônico (extraído do `findings.md` da 0024).
2. simplificar `decision-brief-boilerplate.md` (DEC = pergunta + evidências-refs + opções/finding + gate; tirar a carga de síntese).
3. adicionar o nó `findings` ao contrato da cadeia em `governance-foundation.md` (`research/* → findings → decision-brief → gate`).
4. (opcional) `0.B` dos tasks-boilerplates referenciar findings.

**Método (casa):** dogfood-first — provar na 0024 (feito) **antes** de cravar o boilerplate. A generalização não estabiliza nada de G00; é materialização (G04) + processo (G06).

## Camada acima (registrada, NÃO resolvida) — o `Open` no decision-brief

A separação `findings`/`decisions` resolveu a mistura _dentro_ de um DEC, mas **empurrou o problema um nível acima** (ChatGPT, 2026-05-30): o `decision-brief.md` ainda mistura **dois tipos de coisa**:

- **Decisões reais** (`G00`, `G02` `Pendente`; `G06` `Resolved`) — há algo a aceitar/rejeitar;
- **Perguntas de investigação** (`G01`, `G03`, `A01`, `B01`… `Open`) — ainda não há decisão.

Pela legenda do próprio brief, `Open` = _"ainda em research"_. Logo o artefato chamado _Decision Brief_ ainda lê como **mapa de investigação** (incl. "Critério de saída do Bloco G"), não como **caderno de decisões**. É a intuição **original da owner** (A-F parecem DECs enquanto pesquisam) — e é o candidato **C-6** da lente.

**Direção candidata (não decidida):** um `[DEC]` **nasce `Pendente`** (convergido → exige julgamento); perguntas abertas vivem como **findings abertos** (findings.md já faz — F-003 `Aberto`) até convergir. O brief conteria só `Pendente`/`Resolved`.

**Por que NÃO implementar agora (nuance de sequência):**

1. **Invariante de ordem:** G01-G05 e A-F são `Open` _porque G00 não foi cravado_. **Cravar G00 colapsa G01-G05 em facetas e estabiliza A-F** — esvaziando boa parte do "mapa de investigação". Restruturar o brief antes do gate é mexer no que o gate vai mudar.
2. **Casa do mapa de dependências:** se os `Open` saem do brief, o grafo de dependências + "Critério de saída" precisam de casa (candidato: spec/plan — não DEC). Decisão de processo própria.

**Recomendação:** **cravar G00 primeiro** (agora mais decidível, pós-enxugamento) — mas **distinguir dois problemas** (correção ChatGPT, 2026-05-30): **(A) volume** dos `Open` depende de G00 (cravar reduz); **(B)** `DEC Open ≠ DEC` é **defeito estrutural independente de G00** (persiste com G00 `Resolved`). **Teste diagnóstico (pós-G00):** se o brief ainda parecer "mapa de investigação", C-6 é defeito estrutural → próxima evolução = **estados > containers** (status como propriedade do _estágio de conhecimento_, não do arquivo; ver `research/2026-05-30-projection-vs-entity-lens.md`).

## Critério de sucesso (régua)

O gate humano responde **Aceitar / Rejeitar / Reenquadrar** sem reconstruir a pesquisa. Se ainda for preciso ler grandes volumes de research para entender o DEC, a separação está incompleta.
