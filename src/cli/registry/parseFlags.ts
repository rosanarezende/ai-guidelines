/**
 * Tokenizador PURO de argv para os comandos do registry (Spec 0024, cutover).
 *
 * NÃO é dispatch central nem framework de CLI: cada comando decide o que fazer
 * com positionals/flags. Substitui, **por comando**, o que o `parseArgs`
 * monolítico de `args.mjs` fazia para todos — sem reificar um parser central.
 *
 * Compatível com as três formas suportadas pelo parser legado:
 *   - `--flag`          → boolean `true` (sse declarada em `spec.booleans`)
 *   - `--chave=valor`   → string (forma inline; vale para qualquer chave)
 *   - `--chave valor`   → string (consome o próximo token; chave NÃO booleana)
 *
 * O **mini-schema** (`spec.booleans`) é **detalhe local de quem chama** (o
 * `parse` de cada comando) — NÃO um campo do `Command` nem do `Registry`. É o
 * que permite distinguir `--dry-run` (boolean) de `--version 9.9.9` (consome
 * valor) sem ambiguidade. Chave sem `=`, sem valor e não-booleana → erro
 * narrativo `Valor ausente` (espelha o legado).
 */
export interface FlagSpec {
  /**
   * Flags que NÃO consomem valor (presença ⇒ `true`). Toda outra `--chave` sem
   * `=` consome o próximo token como valor. Default: nenhuma (tudo toma valor).
   */
  readonly booleans?: readonly string[];
}

export interface ParsedFlags {
  readonly positionals: readonly string[];
  readonly flags: ReadonlyMap<string, string | true>;
}

export function parseFlags(argv: readonly string[], spec: FlagSpec = {}): ParsedFlags {
  const booleans = new Set(spec.booleans ?? []);
  const positionals: string[] = [];
  const flags = new Map<string, string | true>();

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    const body = token.slice(2);
    const eq = body.indexOf("=");
    if (eq >= 0) {
      flags.set(body.slice(0, eq), body.slice(eq + 1));
      continue;
    }

    if (booleans.has(body)) {
      flags.set(body, true);
      continue;
    }

    // Flag de valor na forma com espaço: consome o próximo token.
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("-")) {
      throw new Error(`Valor ausente para --${body}.`);
    }
    flags.set(body, next);
    i += 1;
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
