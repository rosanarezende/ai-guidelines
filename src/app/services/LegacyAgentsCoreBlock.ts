const CORE_BEGIN = "<!-- BEGIN:ai-guidelines-core -->";
const CORE_END = "<!-- END:ai-guidelines-core -->";

export function stripLegacyCoreBlock(content: string): string {
  const start = content.indexOf(CORE_BEGIN);
  const end = content.indexOf(CORE_END);

  if (start === -1 || end === -1 || end < start) {
    return content;
  }

  return `${content.slice(0, start)}${content.slice(end + CORE_END.length)}`;
}
