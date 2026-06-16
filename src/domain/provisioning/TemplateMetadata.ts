/**
 * Metadata leve para templates SDD distribuídos ao consumidor.
 *
 * Espelha `cli/features/core/template-metadata.mjs` sem depender de `/cli`, para
 * que o novo plano de provisionamento decida o log de transição fora do adapter.
 */
export interface TemplateMetadata {
  readonly name: string;
  readonly version: number;
}

const TEMPLATE_HEADER_REGEX =
  /^[ \t]*<!--\s*ai-guidelines-template:\s*([a-z0-9._-]+)\s+v=(\d+)\s*-->/m;

export function parseTemplateMetadata(content: string | null): TemplateMetadata | null {
  if (typeof content !== "string") {
    return null;
  }

  const match = content.match(TEMPLATE_HEADER_REGEX);
  if (!match) {
    return null;
  }

  return {
    name: match[1],
    version: Number.parseInt(match[2], 10),
  };
}

export function describeTemplateTransition(
  sourceMeta: TemplateMetadata | null,
  destinationMeta: TemplateMetadata | null
): string | null {
  if (!sourceMeta) {
    return null;
  }

  if (!destinationMeta) {
    return `template v=${sourceMeta.version}`;
  }

  if (destinationMeta.version === sourceMeta.version) {
    return `template v=${sourceMeta.version}`;
  }

  return `template v=${destinationMeta.version} -> v=${sourceMeta.version}`;
}
