import { ReviewComment, StackOps } from "../ports/StackOps.js";

/**
 * Triagem **determinística** de review de PR (comando `review`, tier-1 inspeção).
 *
 * Busca os review comments via `StackOps` (read-only) e os agrupa em threads,
 * separando os que ainda **não têm resposta** (a triar) dos já respondidos.
 *
 * **Boundary ADR 0018 (sem LLM no runtime):** este use case só **reúne e
 * estrutura** estado declarado. A análise (o que faz sentido), a aplicação de
 * correções e a redação das respostas são trabalho do **agente (canal)**, não
 * do runtime. Lookup-only, espelhando [[feedback-lookup-not-coordination]].
 * Cf. `[DEC-0023-N01]`.
 */
export interface ReviewThread {
  readonly root: ReviewComment;
  readonly replies: ReadonlyArray<ReviewComment>;
}

export interface TriageReviewResult {
  readonly prNumber: number;
  readonly total: number;
  /** Threads cujo comentário-raiz ainda não tem resposta (a triar). */
  readonly untriaged: ReadonlyArray<ReviewThread>;
  /** Threads que já têm ≥ 1 resposta. */
  readonly replied: ReadonlyArray<ReviewThread>;
}

export class TriageReview {
  constructor(private readonly stack: StackOps) {}

  run(prNumber: number): TriageReviewResult {
    const comments = this.stack.listReviewComments(prNumber);

    const repliesByRoot = new Map<number, ReviewComment[]>();
    for (const c of comments) {
      if (c.inReplyToId !== null) {
        const arr = repliesByRoot.get(c.inReplyToId) ?? [];
        arr.push(c);
        repliesByRoot.set(c.inReplyToId, arr);
      }
    }

    const threads: ReviewThread[] = comments
      .filter((c) => c.inReplyToId === null)
      .map((root) => ({
        root,
        replies: (repliesByRoot.get(root.id) ?? [])
          .slice()
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      }));

    return {
      prNumber,
      total: comments.length,
      untriaged: threads.filter((t) => t.replies.length === 0),
      replied: threads.filter((t) => t.replies.length > 0),
    };
  }
}
