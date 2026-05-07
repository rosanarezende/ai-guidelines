/**
 * Metadata leve para templates SDD distribuídos.
 *
 * Cada arquivo em `.specify/templates/*.md` carrega na primeira linha:
 *
 *     <!-- ai-guidelines-template: <slug> v=<n> -->
 *
 * O `slug` é o nome do template (ex.: `spec-boilerplate`) e `n` é um inteiro
 * monotônico que **só sobe** quando o conteúdo muda de forma relevante para
 * o consumidor (não para refactors silenciosos). A CLI usa esse header para
 * informar transições no log de ações (`write spec-boilerplate.md
 * (template v=1 -> v=2)`), mas **não muda o comportamento de mirror**: o
 * destino é sempre sobrescrito com a versão upstream. O header é
 * informacional, não controla update.
 */

const TEMPLATE_HEADER_REGEX =
  /^[ \t]*<!--\s*ai-guidelines-template:\s*([a-z0-9._-]+)\s+v=(\d+)\s*-->/m;

export function parseTemplateMetadata(content) {
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

export function formatTemplateHeader({ name, version }) {
  return `<!-- ai-guidelines-template: ${name} v=${version} -->`;
}

/**
 * Compute a human-friendly action label for a template write, given the
 * metadata of source and destination contents.
 */
export function describeTemplateTransition(sourceMeta, destinationMeta) {
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
