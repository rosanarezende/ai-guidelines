// source-scan.ts — varredura local de fonte de trabalho (QRD-22).
// Evidência honesta: conta arquivos (limitado), hash do inventário, detecta
// Git (revision id real) e heurística de pasta sincronizada em nuvem. Falha
// vira erro no scan — nunca sucesso fabricado.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { WorkSourceScan } from "@demo/backend/domain";

const MAX_FILES = 2000;
const CLOUD_MARKERS: Array<{ pattern: RegExp; provider: string }> = [
  { pattern: /onedrive/i, provider: "onedrive" },
  { pattern: /google\s?drive|meu\s?drive|my\s?drive/i, provider: "google-drive" },
  { pattern: /dropbox/i, provider: "dropbox" },
  { pattern: /icloud/i, provider: "icloud" },
  { pattern: /\bbox\b/i, provider: "box" },
];

function detectCloudSync(dir: string): string | undefined {
  for (const marker of CLOUD_MARKERS) {
    if (marker.pattern.test(dir)) return marker.provider;
  }
  if (existsSync(path.join(dir, ".dropbox"))) return "dropbox";
  return undefined;
}

function gitHead(dir: string): { head?: string; dirtyFiles?: number } {
  if (!existsSync(path.join(dir, ".git"))) return {};
  const head = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: dir,
    encoding: "utf8",
    shell: false,
    timeout: 10_000,
  });
  if (head.status !== 0) return {};
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: dir,
    encoding: "utf8",
    shell: false,
    timeout: 10_000,
  });
  const dirtyFiles =
    status.status === 0 ? status.stdout.split(/\r?\n/).filter(Boolean).length : undefined;
  return {
    head: head.stdout.trim(),
    ...(dirtyFiles !== undefined ? { dirtyFiles } : {}),
  };
}

export function scanLocalSource(pathOrUrl: string): WorkSourceScan {
  const scannedAt = new Date().toISOString();
  const dir = path.resolve(pathOrUrl);
  if (!existsSync(dir)) {
    return { scannedAt, errors: [`caminho não existe: ${pathOrUrl}`] };
  }
  if (!statSync(dir).isDirectory()) {
    return { scannedAt, errors: ["caminho não é um diretório"] };
  }
  const inventory: string[] = [];
  let truncated = false;
  const walk = (current: string): void => {
    if (inventory.length >= MAX_FILES) {
      truncated = true;
      return;
    }
    for (const name of readdirSync(current).sort()) {
      if (name === ".git" || name === "node_modules") continue;
      const full = path.join(current, name);
      const stats = statSync(full);
      if (stats.isDirectory()) walk(full);
      else {
        inventory.push(`${path.relative(dir, full).replaceAll("\\", "/")}:${stats.size}`);
        if (inventory.length >= MAX_FILES) {
          truncated = true;
          return;
        }
      }
    }
  };
  try {
    walk(dir);
  } catch (error) {
    return { scannedAt, errors: [String((error as Error).message)] };
  }
  const git = gitHead(dir);
  const cloud = detectCloudSync(dir);
  return {
    scannedAt,
    fileCount: inventory.length,
    contentHash: `${createHash("sha256").update(inventory.join("\n")).digest("hex").slice(0, 12)}${truncated ? "+trunc" : ""}`,
    ...(git.head ? { gitHead: git.head } : {}),
    ...(git.dirtyFiles !== undefined ? { gitDirtyFiles: git.dirtyFiles } : {}),
    ...(cloud ? { cloudSyncProvider: cloud } : {}),
    errors: [],
  };
}
