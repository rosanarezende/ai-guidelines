# Research — Lente "entidade de 1ª classe vs projeção" (coletor de padrão)

> **Alimenta:** `[DEC-0024-G01]` (pilares/estrutura primária) e `[DEC-0024-G02]`. **Não é decisão** — é coletor de _candidatos_ a investigar.
> **Data:** 2026-05-30. **Autoria:** owner (lente) + Claude Opus 4.8 (coleta).
> **Instrução da owner (2026-05-30):** usar a lente explicitamente ao revisar artefatos da 0024; registrar candidatos como **finding de research, não decisão**. _"Primeiro quero enxergar o padrão completo."_ **Não auto-absorver.**

---

## A lente

> **Isto é realmente uma entidade de 1ª classe, ou é uma projeção de algo mais fundamental?**

É o **inverso operacional da identidade C do G00**: se a raiz é a _transformação governada_ (mecanismo) e os objetos são _projeções_, então o framework tende a **ossificar projeções em pseudo-entidades** — e a manutenção paga o preço (drift, sincronização, fronteiras borradas). A lente caça esses casos.

**Sintoma diagnóstico recorrente:** a projeção-tratada-como-entidade exige **sincronização manual** entre cópias paralelas; toda evolução do mecanismo real deixa as projeções para trás. (Foi o tell da taxonomia.)

---

## O princípio mais fundo (síntese da sessão — ChatGPT, 2026-05-30): **estados de conhecimento > containers**

> A descoberta mais **geral** da sessão não é G00, G02 nem a taxonomia. É que tudo o que a lente persegue são **conflações de estágio-de-conhecimento com container**. O modelo estável não organiza por container (`DEC`, `research`, `brief`) e sim por **estado**:
>
> `research/* → finding (aberto | convergido) → decision (pendente | resolved) → execution`
>
> **`status` deixa de ser propriedade do _arquivo_ e passa a ser propriedade do _estágio de conhecimento_.** Evidência prática já no repo: `F-003 Status: Aberto` **soa natural** (findings podem estar abertos), mas `DEC Status: Open` **soa errado** — porque `DEC` significa _pronto para decidir_. A assimetria é o tell.
>
> **Conexão com G00/G01:** se a unidade primária é a transformação governada (identidade C), então `research → finding → decision → execution` são os **estágios** dessa transformação e os artefatos são **projeções de estágio**. Candidato à **gramática estrutural de C** → alimenta **`[DEC-0024-G01]`** (estrutura primária) e é mais uma evidência de que C é load-bearing. **Registrar, não cravar.**

---

## Instâncias CONFIRMADAS (já viradas finding/decisão)

| Instância                                           | Projeção de quê?                                                                                                                                                                        | Onde                                                                                         |
| :-------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| **Handoff**                                         | situação > distribuição estática — o handoff é projeção do _contexto situado_, não artefato primário                                                                                    | **ADR 0022** (handoff situado precede distribuição estática)                                 |
| **Taxonomia `deterministic/mixed/evidence-driven`** | projeção do _crivo de pesquisa por bloco_ — o tipo de spec não é entidade, é como o gate projeta sobre os blocos                                                                        | `research/2026-05-30-g02-taxonomy-elimination.md` → `[DEC-0024-G02]`                         |
| **`[DEC]`**                                         | projeção do _julgamento_ — o DEC é o **registro persistente** do resultado (CAMADA 2 da imagem), não o gatilho nem a unidade primária (a primária é "bloco exige julgamento", CAMADA 3) | `research/2026-05-30-unified-tasks-model.md` § Princípio (revisão 2026-05-30, leitor tardio) |

---

## Candidatos a INVESTIGAR (research, NÃO decisão)

> Grounded o suficiente para registrar; **não** falsificados; **não** decididos. Cada um precisa de evidência + contraste antes de qualquer DEC.

- **C-1 — `Stage 1 / Stage 2` como projeção agregada de `blocos que exigem julgamento`** _(investigado a pedido — leitor tardio, 2026-05-30; registrar, não decidir)_:
  - _A favor (é projeção):_ sob gate por-bloco, não existe fase global — "Stage 1" é só a **vista** "quais blocos ainda esperam julgamento". O `mixed` já furava a globalidade (determinísticos rodando pré-gate). É consequência direta do finding da taxonomia.
  - _Contra (é entidade):_ a transição global `Stage 1 → Stage 2` hoje é **sinal de coordenação** ("não comece NENHUMA implementação antes das decisões fundacionais"); pode haver acoplamento genuinamente spec-global.
  - _Impacto se projeção:_ "Stage" vira **derivado** (estado por-bloco), não declarado; some a transição global; o runtime já não depende dela (lê `review.md`). Passa o critério (remove trabalho), mas pode perder o sinal coarse de coordenação → **candidato, não decisão**. Alimenta G01/G03.
- **C-2 — `Modo de gate` (`escolha`/`aceitação`) como _determinado por_, não escolhido.** O modo não é uma entidade selecionável; é **função do que a research entregou** (opções vivas → `escolha`; finding convergido → `aceitação`). Se verdadeiro, o boilerplate não deveria pedir "declare o modo" e sim _derivá-lo_ do estado da research. Médio.
- **C-3 — Boilerplate-variante como projeção de `(contrato × slots do artefato)`.** O sistema de recipe/partials já trata artefatos como _composição de partials_ (projeção de um slot-spec). "Boilerplate" pode ser projeção, não fonte. Liga ao **G04** (casa única). Médio.
- **C-4 — `gate` como projeção do estado de julgamento** _(leitor tardio, 2026-05-30 — registrar, não decidir)_: o gate pode ser o _evento/vista_ da transição de julgamento (`pendente → cravado`), não uma entidade. _Contra:_ é **fronteira de autorização load-bearing** (runtime lê `review.md`); o ritual humano de cravar tem valor real. _Critério operacional:_ colapsá-lo provavelmente é **só renomear** → tende a ficar nota, não DEC.
- **C-5 — `julgamento` como projeção da preservação/promoção de `contexto`** _(leitor tardio, 2026-05-30 — registrar, não decidir)_: a pergunta da 0024 **nunca foi sobre julgamento** — foi _o que preservar para que o julgamento aconteça_. Cadeia: `contexto → incerteza → julgamento → governança`.
  - **Fixpoint (guard anti-regresso):** rodada após rodada as entidades caem (handoff, taxonomia, DEC, talvez Stage/gate) **mas `contexto` sobrevive a todas**. E contexto é exatamente (a) a raiz que o **G00 já nomeou** (`contexto humano → governança executável`) e (b) o **nome da própria spec** (`context-architecture`). Logo o regresso da lente **não é infinito: converge em contexto.** C-5 é menos "novo candidato" e mais **confirmação de que o piso do regresso = a raiz do G00** — o que, por sua vez, é evidência adicional para aceitar a identidade C no gate de G00.

---

- **C-6 — `Open` DEC como projeção de uma pergunta de research** _(ChatGPT/owner, 2026-05-30 — registrar; é a intuição original da owner sobre "A-F parecem DECs enquanto pesquisam")_: um `[DEC]` em `Status: Open` é, **pela própria legenda do brief**, _"ainda em research"_ — logo **não é decisão; é pergunta de investigação vestida de DEC**. A entidade real é a pergunta (research/finding aberto, como F-003); o `[DEC]` deveria **nascer `Pendente`** (convergido → exige julgamento). _Critério operacional:_ passa — o decision-brief deixa de ler como "mapa de investigação" e vira "caderno de decisões". _Liga a G03_ (pipeline: pergunta → finding aberto → finding convergido → DEC `Pendente`).
  - **Dois problemas distintos (correção ChatGPT, 2026-05-30) — não conflar:**
    - **(A) Volume — depende de G00:** muitos `Open` (G01-G05, A-F) são Open _porque G00 não foi cravado_ (invariante de ordem). Cravar G00 colapsa G01-G05 em facetas e estabiliza A-F → **reduz o volume** do "mapa de investigação".
    - **(B) Estrutural — independe de G00:** `DEC Open ≠ DEC` é defeito do artefato e **persiste mesmo com G00 `Resolved`** (G01/A01 seguiriam Open). Resolver G00 **não elimina** C-6 — só reduz o volume.
  - **Teste diagnóstico (pós-G00):** se, com G00 resolvido, o `decision-brief` **ainda** parecer "mapa de investigação", então C-6 é **defeito estrutural** (não sintoma de G00) → a próxima evolução é o modelo de **estados > containers** acima. Casa do grafo de dependências, se os `Open` saírem do brief: spec/plan, **não** DEC. **Restruturar só depois do gate de G00.**

## Disciplina (anti-elegância — correção tri-party da owner)

A própria lente é sedutora: aplicada sem freio, **tudo** vira "projeção de algo mais fundamental" (regresso infinito — o mesmo que refutou a Opção A do G00). **Guard:** um candidato só sobe a DEC quando (a) a sincronização-manual-recorrente é observável OU (b) há ≥2 instâncias do mesmo mecanismo subjacente. Senão fica aqui como candidato. **Não trocar uma elegância por outra.**

> **Critério decisivo (ChatGPT, 2026-05-30):** **a lente só é útil se produzir simplificação operacional.** Se colapsar a projeção na entidade-mãe **não remove drift, cópias paralelas, sincronização manual ou uma decisão antecipada desnecessária**, então é só **renomear conceito** — e fica como nota, não vira DEC. Este critério é o que impede a 0024 de recair em debate ontológico interminável. (As duas instâncias confirmadas passam: handoff e taxonomia **removem** trabalho operacional real.)

## Roteamento

Coletor vivo. Não estabiliza nada antes de G00. Pode virar **instrumento de G01** (a lente como método de derivar os pilares). Owner revê o padrão completo antes de promover qualquer candidato.
