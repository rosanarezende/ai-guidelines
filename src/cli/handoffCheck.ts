/**
 * `handoff:check` — freshness/coerência da retomada derivada (CO-4, ADR 0021/0022).
 *
 * ADVISORY-FIRST: rederiva os fatos DIRETAMENTE das fontes (mesmo coletor do
 * comando `handoff`; nenhum Markdown persistido é lido nem exigido) e reporta:
 *   - status global (ok | advisory);
 *   - saúde de cada fonte (fresh/degraded/unavailable + origem + fingerprint);
 *   - próxima ação única derivada;
 *   - comando concreto de reconciliação quando conhecido;
 *   - selo determinístico de geração.
 *
 * Contrato de severidade:
 *   - incoerência factual reconciliável (drift de projeção) → WARNING (exit 0);
 *     o enforcement bloqueante dessa classe já vive em `active-specs:check`
 *     (branch/identidade) e `reconcile:check` (cursor/narrativa) — este check
 *     COMPÕE esses contratos, não os reimplementa nem os duplica;
 *   - fonte indisponível (gh fora etc.) → WARNING (exit 0);
 *   - erro de schema/estado impossível (state.yml ilegível, spec irresolvível)
 *     → exit 1.
 *
 * Zero LLM; zero persistência; stdout é a superfície.
 */
import { HandoffOptions, collectHandoffFacts, ghRemotePrCollector } from "./handoff.js";
import { HANDOFF_CONTRACT_VERSION, deriveHandoff } from "./handoffFacts.js";

export interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

export interface HandoffCheckArgs {
  readonly identifier?: string;
  readonly noRemote?: boolean;
}

export function parseArgs(argv: readonly string[]): HandoffCheckArgs {
  const args: { identifier?: string; noRemote?: boolean } = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--spec") {
      args.identifier = argv[++i];
    } else if (arg.startsWith("--spec=")) {
      args.identifier = arg.slice("--spec=".length);
    } else if (arg === "--no-remote") {
      args.noRemote = true;
    } else if (!arg.startsWith("--")) {
      args.identifier = arg;
    }
  }
  return args;
}

export function runHandoffCheck(
  repoRoot: string,
  args: HandoffCheckArgs,
  logger: Logger = defaultLogger,
  remoteOverride?: HandoffOptions["remote"]
): number {
  let collected;
  try {
    collected = collectHandoffFacts(repoRoot, {
      identifier: args.identifier,
      remote:
        remoteOverride !== undefined ? remoteOverride : args.noRemote ? null : ghRemotePrCollector,
    });
  } catch (error) {
    // Estado impossível (spec irresolvível / state.yml ilegível) — bloqueante.
    logger.error(
      `❌ handoff:check — estado irrecuperável: ${error instanceof Error ? error.message : String(error)}`
    );
    return 1;
  }

  const derived = deriveHandoff(collected.facts);
  const { facts } = collected;
  const degraded = facts.sources.filter((s) => s.status === "degraded");
  const unavailable = facts.sources.filter((s) => s.status === "unavailable");
  const warnings: string[] = [];

  for (const warning of facts.driftWarnings) {
    warnings.push(`drift: ${warning}`);
  }
  for (const source of degraded) {
    warnings.push(
      `fonte degradada: ${source.id} (${source.origin})${source.detail ? ` — ${source.detail}` : ""}`
    );
  }
  for (const source of unavailable) {
    warnings.push(
      `fonte indisponível: ${source.id} (${source.origin})${source.detail ? ` — ${source.detail}` : ""}`
    );
  }

  const fresh = facts.sources.length - degraded.length - unavailable.length;
  const status = warnings.length === 0 ? "ok" : "advisory";
  const headline =
    `${status === "ok" ? "✅" : "⚠️"} handoff:check (advisory) — ${facts.spec.label}: ` +
    `${fresh} fresh · ${degraded.length} degraded · ${unavailable.length} unavailable; ` +
    `selo ${derived.seal} (contrato v${HANDOFF_CONTRACT_VERSION}; HEAD ${facts.git.head ?? "-"}).`;
  logger.info(headline);

  if (warnings.length > 0) {
    logger.info("");
    for (const warning of warnings) logger.info(`  ⚠ ${warning}`);
    logger.info("");
    logger.info(
      "  Cobertura bloqueante composta (não duplicada aqui): active-specs:check (branch/identidade), " +
        "reconcile:check (cursor/narrativa), review:check (reviews/gates)."
    );
  }

  logger.info("");
  logger.info(`  próxima ação derivada: ${derived.nextAction.description}`);
  logger.info(`  bloqueante: ${derived.nextAction.blocking ? "sim" : "não"}`);
  return 0;
}

/** Composition root do bin físico. */
export function main(
  repoRoot: string,
  argv: readonly string[] = [],
  logger: Logger = defaultLogger
): number {
  return runHandoffCheck(repoRoot, parseArgs(argv), logger);
}
