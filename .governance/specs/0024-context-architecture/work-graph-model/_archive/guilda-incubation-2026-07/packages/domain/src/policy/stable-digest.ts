// stable-digest.ts — hashing determinístico compartilhado pela runtime.
// Duas variantes preservadas do legado: a pública (usada em revisão/hash de snapshot)
// descarta chaves internas `_*`; a estrutural mantém tudo.
import { createHash } from "node:crypto";

export function stableSorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableSorted);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, stableSorted(record[key])])
    );
  }
  return value;
}

export function stableSortedPublic(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableSortedPublic);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .filter((key) => !key.startsWith("_"))
        .sort()
        .map((key) => [key, stableSortedPublic(record[key])])
    );
  }
  return value;
}

export function digest12(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableSorted(value)))
    .digest("hex")
    .slice(0, 12);
}

export function digestPublic12(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableSortedPublic(value)))
    .digest("hex")
    .slice(0, 12);
}

export function digestText12(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 12);
}
