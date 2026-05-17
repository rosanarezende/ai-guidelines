# ADRs — Lar Canônico Consolidado

Este diretório é o **lar canônico único** das Architecture Decision Records (ADRs) do framework `ai-guidelines`. Alinhado com a arquitetura de informação estabelecida pela Spec 0021: `.core/governance/` hospeda artefatos de governança transversal — `ARCHITECTURE.md` (lean), `ARCHITECTURE-REFERENCE.md` (denso), `GOVERNANCE-CATALOG.md` (carrier) e este diretório de ADRs.

> **Consolidação aplicada em PR4 / 4.B.5 (2026-05-17):** o diretório legado `/adrs/` na raiz do repositório foi removido; as 7 ADRs que viviam lá foram movidas para cá preservando numeração (0003–0009). As 5 ADRs locais que nasceram aqui durante PR3 (0001–0005) foram renumeradas para 0010–0014 para evitar colisão. Lacunas em 0001–0002 são honest historical artifact — esses números nunca existiram no lar canônico.

## Como ADRs vivem aqui

Quando uma ADR é redigida durante uma spec ativa, ela nasce em `.specify/specs/<spec-id>/adrs/` (lar local da spec) **ou** diretamente neste diretório (decisão por spec, conforme âncora arquitetural). No rito de merge da spec, ADRs locais são promovidas para cá com numeração global sequencial.

## Fronteira ADR vs Foundation

ADRs registram **decisões arquiteturais estáveis, cross-spec**. Constituição operacional viva (processos, manuais, fronteiras editoriais) pertence a [`.core/process/governance-foundation.md`](../../process/governance-foundation.md) ou a documentos vivos como `AGENTS.md` / `ARCHITECTURE.md`. O critério de migração foundation → ADR é regido por `[DEC-0021-B04]` (fronteira híbrida explícita).

**Critério prático para classificar:**

- Cita sub-bloco, fase, PR como cronograma operativo? → foundation (processo vivo).
- Atemporal, faz sentido 2 anos depois sem revisitação? → ADR.
- Lista mudanças por arquivo/linha? → commit message ou `.core/process/<topic>-policy.md`, não ADR.

## Critério editorial — ADR é princípio perene, não revisitação datada

> **Runtime injetado:** este critério tem regra-pointer correspondente em [`.core/rules/top/agents-core.md` `[CORE-15]`](../../rules/top/agents-core.md), que aparece compilada no bloco `<AI_GUIDELINES>` de todo `AGENTS.md` consumidor. A SSOT detalhada (formato, anti-padrões, sintomas de rejeição) vive **aqui**; a regra runtime aponta para cá.

ADRs neste projeto registram **princípios arquiteturais perenes** — não relatórios de execução de uma spec, não revisitação datada do `decision-brief.md`. Quando uma ADR vira lixo no momento em que a fase termina, ela não era ADR; era nota de execução.

|                          | `decision-brief.md`                    | ADR                                                 |
| ------------------------ | -------------------------------------- | --------------------------------------------------- |
| **Sujeito**              | Gate humano de **uma spec específica** | Princípio arquitetural perene                       |
| **Cronograma**           | Cita sub-blocos, PRs, fases            | Atemporal — spec aparece só como origem histórica   |
| **Forma**                | Opções A/B/C com decisão               | Princípio + opções avaliadas + casos onde se aplica |
| **Leitor 2 anos depois** | "Por que esta spec foi assim"          | "Por que o sistema é assim"                         |
| **Cross-spec**           | Não — restrito à spec                  | Sim — rege N specs futuras                          |

**Sintomas de ADR mal-escrita** (rejeitar no review):

- Título nomeia uma transição/feature concreta, não o princípio.
- Corpo cita "sub-bloco X.Y" ou "PR N" como cronograma operativo (não só como origem histórica).
- Decisão lista mudanças por nome de arquivo ou linha (isso pertence ao commit message ou a um `.core/process/<topic>-policy.md`).
- A ADR "vira lixo" quando o sub-bloco/fase termina.

## Formato

Toda ADR carrega:

- **Status** — `Proposta | Aceita | Rejeitada | Superseded by <ID>`.
- **Origem histórica** — spec que originou a decisão. Linha de header apenas; não permeia o corpo.
- **Pesquisa de suporte** — link para research em `.specify/specs/researchs/` quando aplicável.
- **Princípio** — uma frase curta enunciando a regra perene. Pode ser citada isoladamente em outros documentos.
- **Contexto** — o problema atemporal e por que ele exige decisão arquitetural.
- **Decisão** — o princípio detalhado em itens numerados; regras de aplicação.
- **Aplicações** — casos concretos atuais e previstos onde o princípio se manifesta. **Aqui** vivem as referências a `LivingDocumentation`, `RuleExtractor`, etc. — não no corpo da decisão.
- **Alternativas avaliadas e rejeitadas** — opções consideradas com o motivo de rejeição. Permite que o leitor 2 anos depois entenda por que outro caminho não foi escolhido.
- **Consequências** — positivas, negativas/riscos. **Não cita cronograma** — só implicações de longo prazo.
- **Nota histórica** (opcional, no rodapé) — registra a circunstância da consolidação sem permear o corpo.

## Ciclo de promoção — local → global

ADRs nascidas em `.specify/specs/<spec-id>/adrs/` (lar local da spec) recebem numeração local sequencial. No encerramento da spec (Fase F do `tasks.md`), durante a checklist de pré-merge, elas são **promovidas para este diretório** com a próxima numeração global disponível. A renumeração não pode acontecer depois — agentes externos podem ter referenciado o número local entre o gate humano e o merge.

A 4.B.5 da Spec 0021 estabeleceu o critério que rege colisões: **legado preserva numeração** quando consolidado a partir de outro lar; **locais recém-criadas renumeram** ao serem promovidas se houver colisão.

## ADRs ativas neste diretório

| #    | Título                                                                    | Princípio                                                                               | Status                             |
| ---- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------- |
| 0003 | Rastreabilidade `[BR-CLI-*]` é Contrato; Cobertura é Política Operacional | Vínculo regra↔teste é contrato; cobertura técnica é piso, com exceções honestas         | Aceita (reescrita em 4.B.4)        |
| 0004 | Governança de Responsabilidade Única                                      | Originalmente: 1 arquivo, 1 responsabilidade na governança                              | **Superseded by ADR 0008** (4.B.4) |
| 0005 | Curadoria Público/Privado                                                 | Taxonomia explícita de o que é público vs restrito; sanitização antes de flip           | Aceita                             |
| 0006 | Licença Apache-2.0                                                        | Apache-2.0 como licença de framework AI tooling; proteção de patentes (§3)              | Aceita                             |
| 0007 | Visibilidade Pública: Fresh Repo + Snapshot Curado                        | Tornar repo público via snapshot curado em fresh repo, não publish do histórico interno | Aceita                             |
| 0008 | Governança Monolítica (Monolithic Runtime Compiler)                       | Regras compiladas in-line no `AGENTS.md` para combater Lost-in-the-Middle               | Aceita                             |
| 0009 | Naming do pacote npm e estratégia de registry                             | `ai-guidelines` não-scoped; registry público gratuito; GitHub App para Action           | Aceita                             |
| 0010 | Work Items como Taxonomia MECE de Intenção de Saída                       | Trabalho classificado por intenção de saída, MECE em uma dimensão                       | Aceita                             |
| 0011 | Outcomes em Artefatos Derivados são Enums Fechados                        | Estados modelados como enum fechado, mensagens nomeando o conjunto válido               | Aceita                             |
| 0012 | Bypass Auditável de Contratos de CI via Diretivas Declarativas In-Code    | Bypass como diretiva próxima à infração, expirável, com referência rastreável           | Aceita                             |
| 0013 | Análise Estática AST como SSOT para Artefatos Derivados de Código         | Artefatos derivados são função pura do AST; telemetria runtime é camada aditiva         | Aceita                             |
| 0014 | Separação entre Validação Semântica e Estética em Artefatos Gerados       | Engine valida semântica de gênero; lint estético em camada separada opcional            | Aceita                             |

**Operacionalização correlata** (não ADR, vive em `.core/process/`):

- [`test-coverage-policy.md`](../../process/test-coverage-policy.md) — operacionaliza ADR 0003 (thresholds, exceções, mecanismo de colocation).

## Histórico de auditoria e supersessões

- **2026-04-21 a 2026-05-07:** ADRs 0003–0009 nascem em `/adrs/` na raiz.
- **2026-05-11:** 5 ADRs do PR3 (taxonomia MECE, enum de outcomes, bypass, AST-only, validação estrutural) nascem aqui em `.core/governance/adrs/` numeradas 0001–0005 (locais).
- **2026-05-17 (PR4 / 4.B.4):** auditoria caminhos a/b/c aplicada às 7 ADRs legadas:
  - 0003 reescrita como princípio perene (caminho **a**); parte tática extraída para `.core/process/test-coverage-policy.md`.
  - 0004 marcada `Superseded by ADR 0008` (caminho **c**); corpo preservado como rastro histórico.
  - 0005–0009 mantidas como estão — princípios sólidos, sem revisitação datada que justifique reescrita.
- **2026-05-17 (PR4 / 4.B.5):** consolidação física `/adrs/` → `.core/governance/adrs/`. Numeração: legadas 0003–0009 preservam; locais 0001–0005 renumeram para 0010–0014.
