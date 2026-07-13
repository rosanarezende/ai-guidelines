/**
 * Envelope não funcional de uma publicação governada de review.
 *
 * O artefato canônico continua sendo o review/evento. Projeções listadas aqui
 * são companheiras determinísticas: podem ser regeneradas no mesmo commit sem
 * transformar a publicação em mudança funcional nem abrir o mixed diff para
 * arquivos arbitrários.
 */
import {
  REVIEW_PUBLICATION_COMPANION_IDS,
  ReviewPublicationCompanionId,
} from "../../domain/policy/reviewPolicy.js";

const COMPANION_RELATIVE_PATHS: Readonly<Record<ReviewPublicationCompanionId, string>> = {
  "governance-graph-snapshot": "assets/governance-graph-snapshot.json",
};

function toPosix(value: string): string {
  return value.replace(/\\/g, "/");
}

function normalizedReviewsDir(reviewsDirRel: string): string {
  return toPosix(reviewsDirRel).replace(/\/+$/, "");
}

export function reviewPublicationProjectionPaths(
  reviewsDirRel: string,
  companions: readonly ReviewPublicationCompanionId[] = REVIEW_PUBLICATION_COMPANION_IDS
): readonly string[] {
  const reviewsDir = normalizedReviewsDir(reviewsDirRel);
  const governedWorkRoot = reviewsDir.replace(/\/reviews$/, "");
  if (governedWorkRoot === reviewsDir) return [];
  return companions.map(
    (companion) => `${governedWorkRoot}/${COMPANION_RELATIVE_PATHS[companion]}`
  );
}

export function reviewsDirFromArtifactPath(artifactRelFile: string): string | null {
  const normalized = toPosix(artifactRelFile);
  const marker = "/reviews/";
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex < 0) return null;
  return normalized.slice(0, markerIndex + "/reviews".length);
}

export function reviewPublicationProjectionPathsForArtifact(
  artifactRelFile: string,
  companions: readonly ReviewPublicationCompanionId[] = REVIEW_PUBLICATION_COMPANION_IDS
): readonly string[] {
  const reviewsDir = reviewsDirFromArtifactPath(artifactRelFile);
  return reviewsDir ? reviewPublicationProjectionPaths(reviewsDir, companions) : [];
}

export function isReviewPublicationEnvelopePath(filePath: string, reviewsDirRel: string): boolean {
  const normalized = toPosix(filePath);
  const reviewsDir = `${normalizedReviewsDir(reviewsDirRel)}/`;
  return (
    normalized.startsWith(reviewsDir) ||
    reviewPublicationProjectionPaths(reviewsDirRel).includes(normalized)
  );
}
