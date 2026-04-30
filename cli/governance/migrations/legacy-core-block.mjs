const CORE_BEGIN = "<!-- BEGIN:ai-guidelines-core -->";
const CORE_END = "<!-- END:ai-guidelines-core -->";

export function stripLegacyCoreBlock(content) {
  if (!content || !content.includes(CORE_BEGIN) || !content.includes(CORE_END)) {
    return content ?? "";
  }

  const start = content.indexOf(CORE_BEGIN);
  const end = content.indexOf(CORE_END) + CORE_END.length;

  return `${content.slice(0, start)}${content.slice(end)}`;
}
