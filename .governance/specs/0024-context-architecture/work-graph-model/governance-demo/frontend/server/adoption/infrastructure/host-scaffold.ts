// host-scaffold.ts — infraestrutura do governance host (QRD-08/09/21).
// Fit-check verifica caminho/escrita/manifesto/event-log e calcula a
// sourceRevision inicial; o scaffold cria o layout mínimo do host (host.yml
// na raiz do host — NUNCA .governance/, que é sidecar de fonte).
import { createHash } from "node:crypto";
import {
  accessSync,
  constants,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import type { GovernanceHostKind, HostFitCheck } from "@demo/backend/domain";

const HOST_DIRS = ["members", "sources", "business", "intents", "decisions", "outcomes", "events"];

export function resolveHostDir(kind: GovernanceHostKind, pathOrUrl: string): string {
  const base = path.resolve(pathOrUrl);
  // host embutido: o caminho aponta para o repo existente; o host mora em
  // .governance-host/ DENTRO dele (irmão do sidecar .governance/, nunca filho)
  return kind === "existing-repo-folder" ? path.join(base, ".governance-host") : base;
}

function hostRevision(hostDir: string): string {
  const entries: string[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else
        entries.push(
          `${path.relative(hostDir, full).replaceAll("\\", "/")}:${createHash("sha256").update(readFileSync(full)).digest("hex").slice(0, 8)}`
        );
    }
  };
  walk(hostDir);
  return createHash("sha256").update(entries.join("\n")).digest("hex").slice(0, 12);
}

function isWritable(dir: string): boolean {
  try {
    accessSync(dir, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export function runHostFitCheck(kind: GovernanceHostKind, pathOrUrl: string): HostFitCheck {
  const warnings: string[] = [];
  const hostDir = resolveHostDir(kind, pathOrUrl);
  const parent = kind === "existing-repo-folder" ? path.resolve(pathOrUrl) : path.dirname(hostDir);
  const pathExists = existsSync(hostDir);
  const writable = pathExists ? isWritable(hostDir) : existsSync(parent) && isWritable(parent);
  const manifestPresent = existsSync(path.join(hostDir, "host.yml"));
  const eventLogPresent = existsSync(path.join(hostDir, "events", "events.jsonl"));

  if (kind === "existing-repo-folder") {
    if (!existsSync(path.resolve(pathOrUrl))) warnings.push("repo base não existe");
    const codeowners = ["CODEOWNERS", ".github/CODEOWNERS", "docs/CODEOWNERS"].some((rel) =>
      existsSync(path.join(path.resolve(pathOrUrl), rel))
    );
    if (!codeowners)
      warnings.push(
        "sem CODEOWNERS detectado: .governance-host/ não tem review próprio — risco visível"
      );
    if (existsSync(path.join(hostDir, ".governance")))
      warnings.push(".governance/ dentro do host é inválido (sidecar deve ser irmão)");
  }
  if (kind === "local-folder") {
    const gitDir = existsSync(path.join(hostDir, ".git"));
    if (!gitDir) warnings.push("pasta local sem Git: colaboração, backup e auditoria rebaixadas");
  }
  if (kind === "dedicated-repo" && pathExists && !existsSync(path.join(hostDir, ".git"))) {
    warnings.push("repo dedicado sem .git: versione o host ou trate como pasta local");
  }

  const ok =
    writable && (!pathExists || manifestPresent === existsSync(path.join(hostDir, "host.yml")));
  return {
    checkedAt: new Date().toISOString(),
    pathExists,
    writable,
    manifestPresent,
    eventLogPresent,
    ...(pathExists && manifestPresent ? { sourceRevision: hostRevision(hostDir) } : {}),
    warnings,
    ok: ok && (manifestPresent ? eventLogPresent : true),
  };
}

export function scaffoldHost(input: {
  kind: GovernanceHostKind;
  pathOrUrl: string;
  workspaceId: string;
  workspaceName: string;
}): HostFitCheck {
  const hostDir = resolveHostDir(input.kind, input.pathOrUrl);
  mkdirSync(hostDir, { recursive: true });
  for (const dir of HOST_DIRS) mkdirSync(path.join(hostDir, dir), { recursive: true });
  const manifest = path.join(hostDir, "host.yml");
  if (!existsSync(manifest)) {
    writeFileSync(
      manifest,
      [
        "schema: governance.host/v1",
        `workspace: ${input.workspaceId}`,
        `name: ${JSON.stringify(input.workspaceName)}`,
        `distribution: ${input.kind}`,
        `created-at: ${new Date().toISOString()}`,
        "",
      ].join("\n")
    );
  }
  const eventLog = path.join(hostDir, "events", "events.jsonl");
  if (!existsSync(eventLog)) {
    writeFileSync(
      eventLog,
      `${JSON.stringify({
        schema: "governance.host-event/v1",
        type: "host.scaffolded",
        workspace: input.workspaceId,
        at: new Date().toISOString(),
      })}\n`
    );
  }
  return runHostFitCheck(input.kind, input.pathOrUrl);
}
