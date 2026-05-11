# ADRs — Lar Canônico Consolidado

Este diretório é o **lar canônico** das Architecture Decision Records (ADRs) do framework `ai-guidelines`, alinhado com a arquitetura de informação estabelecida pela Spec 0021 (`.core/governance/` hospeda artefatos de governança transversal, incluindo `ARCHITECTURE.md`, `ARCHITECTURE-REFERENCE.md` e agora as ADRs).

## Estado atual (durante PR3 da Spec 0021)

- **ADRs deste diretório** (0001–0005) nasceram aqui durante o sub-bloco `[3.0]` (Saneamento de Fundação pré-TDD). Numeração local da Spec 0021.
- **ADRs legadas** continuam em `/adrs/` na raiz do repositório (0003–0009). Migram para cá em **PR4 / sub-bloco 4.B.5** com renumeração (0001–0005 viram 0010–0014; 0003–0009 mantêm numeração para preservar referências históricas).

## Como ADRs vivem aqui

Quando uma ADR é redigida durante uma spec ativa, ela nasce em `.specify/specs/<spec-id>/adrs/` (lar local da spec) **ou** diretamente neste diretório (decisão por spec, conforme âncora arquitetural). No rito de merge da spec, ADRs locais são promovidas para cá com numeração global.

## Fronteira ADR vs Foundation

ADRs registram **decisões arquiteturais estáveis, cross-spec**. Constituição operacional viva (processos, manuais, fronteiras editoriais) pertence a `.core/process/` ou a documentos vivos como `AGENTS.md` / `ARCHITECTURE.md`. O critério de migração foundation → ADR é regido por `[DEC-0021-B04]` (fronteira híbrida explícita) e formalizado em PR4 / sub-bloco 4.B.

## Critério editorial — ADR é princípio perene, não revisitação datada

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
- Decisão lista mudanças por nome de arquivo ou linha (isso pertence ao commit message).
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

## ADRs ativas neste diretório

| #    | Título                                                                 | Princípio                                                                       | Status   |
| ---- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------- |
| 0001 | Work Items como Taxonomia MECE de Intenção de Saída                    | Trabalho classificado por intenção de saída, MECE em uma dimensão               | Proposta |
| 0002 | Outcomes em Artefatos Derivados são Enums Fechados                     | Estados modelados como enum fechado, mensagens nomeando o conjunto válido       | Proposta |
| 0003 | Bypass Auditável de Contratos de CI via Diretivas Declarativas In-Code | Bypass como diretiva próxima à infração, expirável, com referência rastreável   | Proposta |
| 0004 | Análise Estática AST como SSOT para Artefatos Derivados de Código      | Artefatos derivados são função pura do AST; telemetria runtime é camada aditiva | Proposta |
| 0005 | Separação entre Validação Semântica e Estética em Artefatos Gerados    | Engine valida semântica de gênero; lint estético em camada separada opcional    | Proposta |

Status muda para `Aceita` após gate humano formal do Arquiteto Líder durante encerramento do sub-bloco `[3.0]`.
