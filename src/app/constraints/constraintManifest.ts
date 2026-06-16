/**
 * Serialização CANÔNICA do manifesto de constraints (CO-3.2 / Spec 0024).
 *
 * O compilador (`compileConstraints`, CO-3.1) produz um {@link CompiledConstraintManifest}
 * determinístico em memória; aqui ele vira BYTES estáveis para o artefato runtime
 * persistido (`.governance/runtime/constraints/manifest.json`) e volta a objeto
 * para a paridade derivada (`knowledge:check`).
 *
 * Forma OWNED pelo serializer (não pelo prettier): chaves ordenadas
 * recursivamente + 2 espaços + newline final. Mesma disciplina do ledger de
 * insights — o artefato é prettier-ignored para que a reformatação não quebre a
 * paridade raw↔canônica (existência/classe/sync). Puro: sem I/O, sem LLM.
 */
import { CompiledConstraintManifest } from "./compileConstraints.js";

/** Path runtime canônico do manifesto persistido (relativo ao repo root). */
export const CONSTRAINT_MANIFEST_PATH = ".governance/runtime/constraints/manifest.json";

/** Versão do CONTRATO do manifesto persistido (classe). Bump = quebra de paridade de classe. */
export const CONSTRAINT_MANIFEST_VERSION = 1;

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** Stringify determinístico: chaves de objeto ordenadas recursivamente (arrays preservam ordem). */
function canonicalize(value: unknown): Json {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const out: { [key: string]: Json } = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value as Json;
}

/** Bytes canônicos do manifesto (estáveis: mesmo manifesto ⇒ mesma string). */
export function serializeConstraintManifest(manifest: CompiledConstraintManifest): string {
  return `${JSON.stringify(canonicalize(manifest), null, 2)}\n`;
}

export interface ManifestClassError {
  readonly reason: string;
}

/**
 * Lê o artefato persistido validando a CLASSE (parse + versão + forma de topo).
 * Retorna o manifesto OU um erro de classe legível — nunca lança em conteúdo
 * inválido (o check reporta; não quebra). `null` de bytes ⟹ tratado pelo caller
 * como ausência (existência), não como classe.
 */
export function parseConstraintManifest(
  text: string
): { readonly manifest: CompiledConstraintManifest } | { readonly error: ManifestClassError } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { error: { reason: `JSON inválido: ${e instanceof Error ? e.message : String(e)}` } };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { error: { reason: "raiz não é um objeto de manifesto." } };
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.version !== CONSTRAINT_MANIFEST_VERSION) {
    return {
      error: {
        reason: `version "${String(obj.version)}" ≠ classe suportada ${CONSTRAINT_MANIFEST_VERSION}.`,
      },
    };
  }
  for (const key of ["constraints", "bindings", "edges"] as const) {
    if (!Array.isArray(obj[key])) {
      return { error: { reason: `campo "${key}" ausente ou não é lista.` } };
    }
  }
  const provenance = obj.provenance as Record<string, unknown> | undefined;
  if (!provenance || !Array.isArray(provenance.sources)) {
    return { error: { reason: 'campo "provenance.sources" ausente ou não é lista.' } };
  }
  return { manifest: parsed as CompiledConstraintManifest };
}
