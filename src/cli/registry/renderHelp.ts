import { Command } from "./Command.js";

/**
 * Renderiza a seção de comandos do help A PARTIR do registry — projeção derivada
 * (renderer puro), não 2ª fonte. O `args.mjs` deixa de declarar os comandos
 * migrados; adicionar um comando = registrá-lo + declarar `description`, e o help
 * acompanha sozinho. Fecha o achado #2 da auditoria do #35 (help desacoplado da
 * extensibilidade) e é a 1ª projeção no estilo da Continuidade Operacional
 * (INV-4: projeção derivada, não autorada à mão).
 */
export function renderCommandsHelp(commands: readonly Command<unknown>[]): string {
  const lines: string[] = [];
  for (const command of commands) {
    const aliases = command.aliases ?? [];
    const aliasNote = aliases.length > 0 ? ` (alias: ${aliases.join(", ")})` : "";
    lines.push(`  ${command.name}${aliasNote}`);
    lines.push(`      ${command.description}`);
    for (const example of command.usage ?? []) {
      lines.push(`      Ex.: yarn guidelines ${example}`);
    }
  }
  return lines.join("\n");
}
