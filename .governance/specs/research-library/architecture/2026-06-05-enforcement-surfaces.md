# Superfícies de enforcement — restrições de **evento** não vivem em **estado contínuo**

> **Status: descoberta de pesquisa VIVA, não cristalizada.** NÃO é ADR, NÃO é doctrine, NÃO é
> decisão. Captura uma taxonomia arquitetural reutilizável para **preservar a evidência** e
> **observar reaparecer** antes de cristalizar (o que o próprio modelo epistêmico do projeto
> prescreve — ver [[2026-06-04-epistemic-commitment-model]]).
> Origem: a rodada "como impedir merge prematuro?" (Spec 0024 / PR #35), 2026-06-05. A pergunta
> de merge foi o **mecanismo**; o **artefato** é esta taxonomia. Data: 2026-06-05.

---

## 1. A descoberta (em uma frase)

> **Uma restrição sobre um EVENTO não deve ser enforçada numa superfície de ESTADO CONTÍNUO.**

E o corolário que a acompanha:

> **Superfície de DECLARAÇÃO ≠ superfície de ENFORCEMENT.** Onde um fato é _declarado_ (ex.:
> "o veículo desta spec é o Integration PR") não é necessariamente onde ele pode ser _imposto_.

Toda a dor da rodada veio de fundir esses dois eixos: tentou-se **impor** um constraint de
**evento** (uma aterrissagem/merge) numa superfície que só observa **estado contínuo** (a CI,
que roda a vida inteira do PR). Como a CI não vê o evento, ela é forçada a **inferir** "vai
aterrissar?" a partir do estado — e a inferência erra sempre para um dos dois lados.

## 2. Sintoma clássico (como reconhecer o erro)

```text
o estado fica VERMELHO cedo demais      (bloqueia um estado legítimo, por semanas)
        — ou —
o estado fica VERDE tarde demais        (só falha quando o dano já é possível/feito)
```

Quando um enforcement oscila entre "cedo demais" e "tarde demais" **sem um ponto verde
estável**, a regra provavelmente não está errada — a **superfície** está.

## 3. O eixo: estado contínuo × evento

|                       | **Estado contínuo**                                             | **Evento**                                     |
| --------------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| Observado             | a vida toda do artefato                                         | só no instante em que algo acontece            |
| Pergunta que responde | "como está agora?"                                              | "isto pode acontecer **agora**?"               |
| Bom para              | declarar fatos, medir saúde                                     | autorizar/barrar uma **transição**             |
| Falha típica          | inferir um evento futuro a partir do estado → cedo/tarde demais | (poucas; mas exige um gancho no momento certo) |

Um constraint cuja linguagem é **"quando X acontecer…"** ou **"só Y pode fazer Z"** é quase
sempre **de evento**. Tentar hospedá-lo num estado contínuo (CI, label, campo persistido,
flag de ciclo de vida) deve **exigir falsificação extra** — é o lugar onde o erro se esconde.

## 4. Exemplos falsificados nesta rodada (linguagem de superfícies)

As três implementações ficam preservadas **localmente como evidência histórica** (commits
`c626ce6`, `a6d509a`, `f5feb48` — não-pushadas, falsificadas como solução).

| Tentativa                                         | Onde tentou viver                                         | Por que falhou (em superfícies)                                                                                           |
| ------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Autorização (R8/review.md)** num status check   | autorização → **estado contínuo**                         | artefato terminal lido continuamente: **sem estado verde** durante o dev → vermelho permanente / bootstrap                |
| **GitHub Reviews** (REQUEST_CHANGES)              | **autorização** (eixo errado)                             | modela aprovação humana de _review_ (≠ autorização-de-aterrissagem) e **não codifica topologia** (qual é o veículo)       |
| **landing_policy** (flag persistido)              | **declaração** duplicando a topologia                     | **terceira representação** do mesmo fato → drift; e ainda imposta por status check (contínuo)                             |
| **Vehicle derivado da topology** num status check | declaração lida certo, **enforcement** em estado contínuo | re-fundiu estado×evento; gateado por `Ready + base=main` → **contradiz R7** (que exige não-veículos em Ready)             |
| **Ready** como gatilho                            | **estado contínuo de ciclo de vida**                      | "elegível para review" ≠ "elegível para aterrissar"; a doutrina (R7) **manda** não-veículos ficarem Ready                 |
| **Draft** como bloqueio                           | **estado contínuo de ciclo de vida**                      | semântica per-PR de "WIP", não per-spec de "veículo"; manter não-veículos bloqueados exigiria Draft eterno → contradiz R7 |
| **base == main** como gatilho                     | **estado estrutural contínuo**                            | é a realidade de _raiz da stack_, não intenção de aterrissar; a linha-base é `base=main` legitimamente                    |

**Padrão comum:** o _enforcement_ foi sempre posto numa superfície **contínua**, forçando
inferência do evento. A **declaração** (topologia) nunca foi o problema.

## 5. Mapa de superfícies (reutilizável)

Catálogo das superfícies onde um constraint de "quem/quando pode aterrissar em main" poderia
viver. Reaproveitável trocando "aterrissar" por outra transição (publicar, aprovar, encerrar…).

| Superfície                            | Categoria                      | GH/FW              | Contínua / no evento              | Capaz?                                                     |
| ------------------------------------- | ------------------------------ | ------------------ | --------------------------------- | ---------------------------------------------------------- |
| Required status check                 | estado contínuo                | GH+FW              | contínua                          | ✗ infere o evento                                          |
| Draft/Ready (`isDraft`)               | estado contínuo                | GH                 | contínua                          | ✗ WIP per-PR, não veículo (R7)                             |
| `base` do PR                          | topologia estrutural           | GH                 | contínua                          | ✗ raiz é `base=main` legítima                              |
| Labels                                | estado contínuo                | FW                 | contínua                          | ✗ flag mutável; infere evento                              |
| Corpo/template do PR                  | estado contínuo (documental)   | FW                 | contínua                          | ✗ documental; drift                                        |
| R8 / review.md                        | autorização                    | FW                 | terminal                          | ✗ como check contínuo                                      |
| GitHub Reviews                        | autorização                    | GH                 | contínua                          | ✗ review ≠ auth-aterrissagem; sem topologia                |
| CODEOWNERS                            | autorização                    | GH                 | contínua                          | ✗ _quem aprova_, não _qual veículo_                        |
| Owner/admin bypass                    | autorização/acesso             | GH                 | —                                 | ✗ é **teto**, não um lar                                   |
| **topology / state.yml**              | **topologia**                  | FW                 | contínua                          | **✓ DECLARAR · ✗ ENFORÇAR sozinha**                        |
| DAG de bases (git)                    | topologia                      | GH/git             | contínua                          | parcial (`base≠main` não aterrissa; veículo é `base=main`) |
| **Merge queue (`merge_group`)**       | **evento**                     | GH                 | **no evento**                     | **✓ em princípio** (não explorada)                         |
| Pre-receive hook                      | evento                         | GH (só Enterprise) | no evento                         | ✓ em princípio · **indisponível** no github.com            |
| Webhook `pull_request.merged`         | evento (pós-fato)              | GH                 | depois                            | ✗ reage, não previne                                       |
| **MergeStack (executor)**             | **operação de merge**          | FW                 | **no evento**                     | **✓ no caminho do framework · ✗ no merge pela UI**         |
| Wizard / CLI dispatch                 | evento (operação)              | FW                 | no evento                         | ✓ só no caminho controlado                                 |
| Restrição do caminho de merge em main | **controle de acesso** (outra) | GH                 | regra contínua / efeito no evento | ✓-ish (força o caminho controlado; teto do owner)          |

**Superfícies ainda viáveis (não falsificadas):**

- **Declaração** → `topology / state.yml` (lar do fato "o veículo é X"; intacta como declaração).
- **Enforcement (evento/operação)** → `merge queue (merge_group)`; a **operação de merge** do
  framework (MergeStack); restrição do **caminho de merge** (acesso) que torna a operação do
  framework o único _merger_.
- **Falsificadas por disponibilidade/natureza:** pre-receive (indisponível); webhook pós-merge
  (não previne).
- **Teto sobre tudo:** owner/admin bypass — qualquer enforcement vira "impede acidental / exige
  bypass deliberado" para o owner.

## 6. Heurística (para a próxima vez)

```text
Se a regra fala sobre "QUANDO algo acontece" ou "só QUEM pode fazer a transição":
    → provavelmente é uma restrição de EVENTO.

Se a implementação proposta vive em:
    CI · status check · label · campo persistido · qualquer estado contínuo
    → EXIGIR falsificação extra antes de aceitar.
    (Pergunte: existe um estado VERDE estável durante toda a vida do artefato?
     Se não houver, a superfície está errada.)

Separe sempre:
    onde o fato é DECLARADO   (pode ser contínuo: topologia, estado)
    de
    onde o fato é ENFORÇADO   (um constraint de evento precisa de superfície de evento)
```

## 7. O meta-padrão do projeto (a sequência de falsificações)

A descoberta emergiu de um ciclo recorrente — vale registrar o **formato**, não só o resultado:

```text
Hipótese 1 → implementação → dogfood → falsificação   (R8/review.md em status check)
Hipótese 2 → implementação → dogfood → falsificação   (landing_policy/vehicle em status check)
Hipótese 3 → implementação → dogfood → falsificação   (vehicle+Ready em status check → contradiz R7)
                                   ↓
                         descoberta mais geral:
        "o problema não era a regra — era a SUPERFÍCIE onde a regra tentava viver"
```

A implementação não foi desperdício: foi o **instrumento de falsificação**. Cada commit
falsificado tornou observável uma propriedade que a análise pura não havia exposto. Tratar a
rodada como _fracasso de implementação_ apagaria o artefato; tratá-la como _descoberta de
pesquisa_ preserva a taxonomia. (Consistente com [[2026-06-04-epistemic-commitment-model]]:
regressão sob evidência é o gate **funcionando**, não erro arbitrário.)

## 8. Onde isto tende a reaparecer (além de merge)

A mesma confusão estado×evento e declaração×enforcement deve recorrer em:

- **publicação de releases** (evento) vs versão declarada (estado);
- **aprovação de ADRs** (evento) vs status `Aceita` (estado);
- **gates de checkpoint** (evento: TA→AR→Human) vs gate `closed` (estado);
- **encerramento de specs** (evento) vs `stage: done` (estado);
- **promoção de artefatos** (evento) vs presença em `assets/` (estado);
- **workflows humanos** e **capabilities de governança** em geral.

Em cada um: declarar na superfície contínua certa; enforçar na superfície de evento certa.

## 9. Caminho de cristalização e guardrail

```text
evidência encontrada → capturar (ESTE research) → observar reaparecer (≥1 domínio novo)
                     → só então cristalizar (ADR + heurística permanente; eventual doctrine)
```

**Guardrail ao cristalizar:** não transformar a taxonomia num _checklist rígido_ nem num _enum
universal de superfícies_. O valor é a **pergunta** (estado ou evento? declaração ou
enforcement?), não uma lista fechada. O mapa de §5 é instanciação do problema de **merge** —
cada domínio terá seu próprio conjunto de superfícies.

## 10. Cross-refs

- **Lente irmã:** [[2026-06-04-epistemic-commitment-model]] (o que se pode _afirmar_; esta é
  sobre _onde_ um constraint pode ser _imposto_ — complementares).
- **ADRs tocados:** ADR 0024 (Draft/Ready/Mergeable — `Ready ≠ Mergeable`; a fonte da confusão),
  ADR 0020 (governança precede execução; merge atômico), ADR 0025 (contêiner precede código).
- **Doutrina:** R7 (review.md — todos os não-Integration em Ready **antes** de R8/merge) foi a
  contradição formal que falsificou a Hipótese 3.
- **Evidência (commits locais, não-pushados, falsificados):** `c626ce6`, `a6d509a`, `f5feb48`.
- **Mecanismos citados:** `governance-pr-check` (o status check), `MergeStack` (a operação de
  merge), `state.yml § topology` (a declaração), ruleset `main-governance` (status checks +
  bypass do admin).
