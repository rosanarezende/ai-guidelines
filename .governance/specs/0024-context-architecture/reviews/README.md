# Revisão-como-artefato (Spec 0024 · Checkpoints 2.4 + 2.4a)

> O comentário de PR **não é memória do processo** — é interface operacional. A memória vive aqui, versionada. `review:check` (no `yarn validate`, ∴ em `repo-validation` required) torna estes artefatos load-bearing.

## Lanes de propriedade (2.4a — o ponto central)

| Lane                       | Arquivo                        | Dono                     | O gate lê?                  |
| :------------------------- | :----------------------------- | :----------------------- | :-------------------------- |
| **Finding** (a claim)      | `reviews/c<N>-<role>.yml`      | reviewer (Codex/ChatGPT) | **sim** — via `disposition` |
| **Resolução** (a resposta) | `reviews/c<N>-resolutions.yml` | implementer (Claude)     | **não**                     |
| **Gate** (o veredito)      | `gates/c<N>.yml`               | owner                    | é o gate                    |
| **Projeção**               | 1 comentário de status no PR   | —                        | —                           |

**Anti-autoaprovação estrutural:** o gate bloqueia em finding bloqueante (`critical/high`) com `disposition: open`. **Só o reviewer fecha** (`accepted`/`dismissed`). O implementador escreve resolução noutra lane — que **não destrava o gate**. Para autoaprovar, teria de editar a `disposition` no arquivo do reviewer: um **diff cross-lane visível e atribuível**.

## Integridade local (tamper-EVIDENCE, não tamper-proofing — ADR 0021)

- **`fingerprint`** (por finding) = `sha256(checkpoint|role|id|severity|location|description)[:12]` sela a **claim**. Reescrever severity/description/location sem re-selar → **vermelho**. Inclui `checkpoint|role` (2.4b) → bloco transplantado de outra review não casa o hash recomputado no destino (**anti-transplante**). _Não entra no hash:_ `disposition` (muda de propósito).
- **`review_fingerprint`** (envelope, 2.4b) = `sha256(checkpoint|role|findings_emitted|<ids>)[:12]` sela o **CONJUNTO**. Deletar a cauda (`F4`) + decrementar `findings_emitted` muda o envelope → **vermelho** (fecha a "poda final"). Não acopla findings entre si — só sela a claim de conjunto, que é do reviewer.
- **`findings_emitted` + ids contíguos `F1..FN`** → deletar um finding do meio quebra a contiguidade → vermelho.
- **Limite honesto:** um check local é **cego a autoria** — não impede criptograficamente um forjador (ele re-sela / edita cross-lane). Ele **eleva a barra** de "edição silenciosa de 1 linha" para "forja explícita, atribuída e detectável". Prevenção plena exigiria CODEOWNERS/assinatura (off-repo/nova camada) — deferido.

## Respostas diretas

- **Onde vivem os findings?** `reviews/c<N>-<role>.yml` (selados). Sem `findings.yml` à mão — consolidado é **derivado**.
- **Identidade?** `F1..FN` contíguos por arquivo; global = **`<role>#F<n>`** (totalmente qualificado). Resoluções referenciam essa forma exata — sem colisão cross-role (2.4c). `fingerprint` (JSON canônico) amarra id↔conteúdo.
- **Mudança de estado?** Reviewer muda `disposition`; implementador anexa `resolution` (lane separada). Git = log.
- **Múltiplas revisões no mesmo lugar?** Não. 1 arquivo por `(checkpoint, role)`.
- **Gate sabe o consolidado?** `review:check` deriva e enforça (gate `approved` ⟹ 0 bloqueante `open`).
- **Comentário que sobra?** 1 de status. **Some:** os 4 comentões de proveniência → viram artefatos.

## Fluxo do próximo PR (Checkpoint N)

1. **Claude** implementa → commit + 1 comentário de status.
2. **Codex** → `reviews/c<N>-audit.yml` (findings selados, `disposition: open`).
3. **ChatGPT** → `reviews/c<N>-arch.yml`.
4. **Claude** corrige → `reviews/c<N>-resolutions.yml` (`action: fixed`, `ref: <sha>`). **Não fecha findings.**
5. **Reviewer** valida e fecha (`disposition: accepted/dismissed`) — re-selando se mudou a claim.
6. **Owner** → `gates/c<N>.yml` (`approved`) + Approve nativo. `review:check` barra aprovar com bloqueante `open`.
