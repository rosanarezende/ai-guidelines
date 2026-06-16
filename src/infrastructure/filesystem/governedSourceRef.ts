import * as fs from "node:fs";
import * as path from "node:path";

/**
 * F2 — containment canônico de um `source_ref` na raiz governada do repositório
 * correspondente (CO-3.1 / Spec 0024).
 *
 * Um `source_ref` aponta o corpo humano (`<path>#<anchor>`) e DEVE viver dentro
 * da raiz governada da sua fonte (core → raiz do pacote; overlay → raiz do
 * consumidor). Esta função normaliza e verifica o containment de forma canônica
 * — NUNCA por `resolved.startsWith(root)` (falha em prefixos semelhantes e em
 * diferenças de separador/case). Separadores Windows (`\`) são normalizados e
 * qualquer segmento `..` é rejeitado antes de qualquer I/O, de modo que um alvo
 * externo jamais é lido antes da rejeição. Quando o arquivo existe, o realpath
 * reconfere o containment após resolução de symlink (link interno → externo é
 * rejeitado sem ler o conteúdo do alvo).
 */
export interface GovernedSourceResolution {
  /** O path está contido na raiz governada (após normalização e realpath)? */
  readonly contained: boolean;
  /** O arquivo existe (só consultado quando `contained`). */
  readonly exists: boolean;
  /** Caminho absoluto resolvido dentro da raiz (null quando rejeitado). */
  readonly absPath: string | null;
  /** Raiz governada resolvida (para mensagens de diagnóstico). */
  readonly root: string;
  /** Motivo da rejeição quando `!contained` (não expõe conteúdo externo). */
  readonly reason?: string;
}

function isInside(root: string, target: string): boolean {
  if (target === root) return false; // a própria raiz não é um arquivo-fonte
  const rel = path.relative(root, target);
  return rel.length > 0 && !rel.startsWith("..") && !path.isAbsolute(rel);
}

export function resolveGovernedSourcePath(root: string, relPath: string): GovernedSourceResolution {
  const rootResolved = path.resolve(root);
  const reject = (reason: string): GovernedSourceResolution => ({
    contained: false,
    exists: false,
    absPath: null,
    root: rootResolved,
    reason,
  });

  const raw = relPath.trim();
  if (raw.length === 0) return reject("path vazio");

  // `source_ref` é POSIX por convenção; normalizamos separadores Windows para
  // que `..\\` seja analisado como traversal em qualquer SO.
  const normalized = raw.replace(/\\/g, "/");
  if (path.isAbsolute(raw) || path.posix.isAbsolute(normalized) || /^[A-Za-z]:/.test(normalized)) {
    return reject("path absoluto");
  }
  if (normalized.split("/").some((segment) => segment === "..")) {
    return reject("segmento `..` escapa a raiz governada");
  }

  const abs = path.resolve(rootResolved, normalized);
  if (!isInside(rootResolved, abs)) {
    return reject("resolução escapa a raiz governada");
  }

  if (!fs.existsSync(abs)) {
    return { contained: true, exists: false, absPath: abs, root: rootResolved };
  }

  // Reconfere containment sobre realpaths: um symlink interno apontando para
  // fora da raiz é rejeitado sem ler o conteúdo do alvo.
  let realRoot: string;
  let realAbs: string;
  try {
    realRoot = fs.realpathSync(rootResolved);
    realAbs = fs.realpathSync(abs);
  } catch {
    return { contained: true, exists: false, absPath: abs, root: rootResolved };
  }
  if (!isInside(realRoot, realAbs)) {
    return reject("symlink resolve para fora da raiz governada");
  }
  return { contained: true, exists: true, absPath: abs, root: rootResolved };
}
