/**
 * Workflow CLI entrypoint.
 *
 * Comandos:
 *   `ai-guidelines workflow`   — wizard interativo (REPL).
 *   `ai-guidelines continue`   — atalho: imprime briefing e a
 *                                próxima ação registrada em `state.next`
 *                                (sem REPL; não executa ações).
 *
 * Princípio (cf. decision-brief.md § DEC-0023-A03):
 *   - texto livre vira **context bundle** copy-paste para sessão IA;
 *   - **não** chamamos LLM internamente; AI-as-Channel preservado.
 */
import * as readline from "node:readline";
import { DetectActiveSpec } from "../app/workflow/DetectActiveSpec.js";
import { ReadWorkflowState } from "../app/workflow/ReadWorkflowState.js";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";
import {
  SpecHeaders,
  assembleBriefing,
  extractSpecHeaders,
} from "../app/workflow/AssembleBriefing.js";
import { SpecLocation } from "../domain/workflow/SpecLocation.js";
import { WorkflowState } from "../domain/workflow/WorkflowState.js";
import { NodeWorkflowFileSystem } from "../infrastructure/filesystem/NodeWorkflowFileSystem.js";
import { WorkflowFileSystem } from "../app/ports/WorkflowFileSystem.js";

export interface Logger {
  info(msg: string): void;
  error(msg: string): void;
}

export interface InputReader {
  question(prompt: string): Promise<string>;
  close(): void;
}

export interface ClipboardWriter {
  copy(text: string): Promise<boolean>;
}

const stdoutLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

class StdinReader implements InputReader {
  private rl: readline.Interface;
  constructor() {
    this.rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }
  question(prompt: string): Promise<string> {
    return new Promise((resolve) => this.rl.question(prompt, resolve));
  }
  close(): void {
    this.rl.close();
  }
}

class NoopClipboard implements ClipboardWriter {
  async copy(): Promise<boolean> {
    return false;
  }
}

export interface RunOptions {
  readonly repoRoot: string;
  readonly logger?: Logger;
  readonly reader?: InputReader;
  readonly clipboard?: ClipboardWriter;
  readonly fs?: WorkflowFileSystem;
}

interface ResolvedContext {
  readonly location: SpecLocation;
  readonly state: WorkflowState;
  readonly defaulted: boolean;
  readonly headers: SpecHeaders;
}

function resolveContext(fs: WorkflowFileSystem, logger: Logger): ResolvedContext | null {
  const detect = new DetectActiveSpec(fs);
  const detected = detect.run();
  if (!detected.location) {
    logger.error(`Não foi possível detectar spec ativa: ${detected.reason}`);
    logger.error(`Dica: confira o branch (esperado: feat/spec-NNNN-slug) ou a pasta da spec.`);
    return null;
  }
  const reader = new ReadWorkflowState(fs, parseWorkflowState);
  const { state, defaulted } = reader.run(detected.location);
  const specPrefix =
    detected.location.source === "governance" ? ".governance/specs" : ".specify/specs";
  const specPath = `${specPrefix}/${detected.location.slug}`;
  const specMd = safeRead(fs, `${specPath}/spec.md`);
  const researchMd = safeRead(fs, `${specPath}/research.md`);
  const headers = extractSpecHeaders(specMd, researchMd);
  return { location: detected.location, state, defaulted, headers };
}

function safeRead(fs: WorkflowFileSystem, relPath: string): string | null {
  if (!fs.fileExists(relPath)) return null;
  try {
    return fs.readTextFile(relPath);
  } catch {
    return null;
  }
}

export function buildMenu(state: WorkflowState): ReadonlyArray<{ key: string; label: string }> {
  const items: { key: string; label: string }[] = [];
  items.push({ key: "1", label: "ver briefing novamente" });
  items.push({ key: "2", label: "ver lacunas do gate (research §8)" });
  if (state.gate.status !== "closed") {
    items.push({ key: "3", label: "ver lacunas e critérios do gate" });
  }
  if (state.next.length > 0) {
    items.push({ key: "4", label: `executar próxima ação (${state.next[0]})` });
  }
  items.push({ key: "q", label: "sair" });
  return items;
}
