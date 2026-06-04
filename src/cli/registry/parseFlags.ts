/**
 * Tokenizador PURO de argv para os comandos do registry (Spec 0024, cutover).
 *
 * NÃO é dispatch central: cada comando decide o que fazer com positionals/flags.
 * Substitui, **por comando**, o que o `parseArgs` monolítico de `args.mjs` fazia
 * para todos — sem reificar um parser central. É utilitário compartilhado de
 * tokenização, não ponto de decisão.
 *
 * Suporta `--chave=valor` (string) e `--flag` (boolean `true`) — forma canônica
 * do repo (cf. help do `publish-state`). Posicionais preservam ordem.
 */
export interface ParsedFlags {
  readonly positionals: readonly string[];
  readonly flags: ReadonlyMap<string, string | true>;
}

export function parseFlags(argv: readonly string[]): ParsedFlags {
  const positionals: string[] = [];
  const flags = new Map<string, string | true>();
  for (const token of argv) {
    if (token.startsWith("--")) {
      const body = token.slice(2);
      const eq = body.indexOf("=");
      if (eq >= 0) {
        flags.set(body.slice(0, eq), body.slice(eq + 1));
      } else {
        flags.set(body, true);
      }
    } else {
      positionals.push(token);
    }
  }
  return { positionals, flags };
}

/** Valor string de uma flag (ou `undefined` se ausente ou booleana). */
export function stringFlag(
  flags: ReadonlyMap<string, string | true>,
  key: string
): string | undefined {
  const value = flags.get(key);
  return typeof value === "string" ? value : undefined;
}

/** Flag booleana — presente como `--flag` ⇒ `true`. */
export function boolFlag(flags: ReadonlyMap<string, string | true>, key: string): boolean {
  return flags.get(key) === true;
}
