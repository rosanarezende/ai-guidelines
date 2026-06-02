# Revisão-como-artefato (Spec 0024 · Checkpoint 2.4 — MVP dogfood)

> O comentário de PR **não é memória do processo** — é interface operacional. A memória vive aqui, versionada. Gate `review:check` (no `yarn validate`) torna estes artefatos load-bearing.

## Onde vive o quê

| Papel                              | Artefato versionado                                          | Comentário no PR                                    |
| :--------------------------------- | :----------------------------------------------------------- | :-------------------------------------------------- |
| **Implementação**                  | o **commit/diff** + checkboxes em `tasks.md` (já versionado) | —                                                   |
| **Technical Audit** (Codex)        | `reviews/c<N>-audit.yml` (findings embutidos)                | —                                                   |
| **Architectural Review** (ChatGPT) | `reviews/c<N>-arch.yml` (findings embutidos)                 | —                                                   |
| **Gate humano** (owner)            | `gates/c<N>.yml` + o _Approve_ nativo do GitHub              | —                                                   |
| **Projeção**                       | —                                                            | **1 comentário de status** (editado, não acumulado) |

## Respostas diretas

- **Onde vivem os findings?** Embutidos na review (`reviews/c<N>-<role>.yml`). Sem arquivo `findings.yml` à mão — seria mais uma projeção que dói por drift; o consolidado é **derivado**.
- **Como são identificados?** `id` local à review (`F1`, `F2`…); globalmente é `c<N>-<role>#F1`. Único por arquivo (validado).
- **Como mudam de estado?** Edita-se o `status` no YAML (`open → resolved | accepted | dismissed`); o **git** é o log de quem/quando.
- **Como múltiplas revisões escrevem no mesmo lugar?** **Não escrevem.** 1 arquivo por `(checkpoint, role)`. Re-review **edita** o seu próprio arquivo. Sem contenção.
- **Como o gate sabe o consolidado?** `review:check` **deriva** por checkpoint (open por severidade, decisões) e **enforça**: gate `approved` ⇒ zero `critical/high` `open`. O owner lê a saída do check; o `gate.yml` registra o veredito.
- **Qual comentário sobra no PR?** **Um** comentário de status (projeção): `reviews [...] · findings X open / Y resolved · gate <estado>`. Mais o _Approve_/checks nativos.
- **Quais comentários somem já?** Os 4 comentões de proveniência (`implementation` / `technical_audit` / `architectural_review` / `human_gate`) — viram artefatos. Implementação → commit; audit/review → `reviews/`; gate → `gates/`.

## Como o próximo PR (Checkpoint N) funciona

1. **Claude implementa** → commit + `tasks.md`; **1 comentário de status** no PR (sem proveniência longa).
2. **Codex audita** → escreve `reviews/c<N>-audit.yml` (findings + `decision`); edita o status do PR.
3. **ChatGPT revisa** → escreve `reviews/c<N>-arch.yml`.
4. **Iteração:** Claude corrige; marca `status: resolved` nos findings tratados (mesmos arquivos).
5. **Gate humano:** owner roda `yarn review:check` (lê consolidado), cria `gates/c<N>.yml` (`approved`) e clica _Approve_. O check **barra** aprovar com bloqueante aberto.
6. **`yarn validate`** (já required via `repo-validation`) roda `review:check` → o estado vivo do PR passa a depender dos artefatos, não de comentários.
