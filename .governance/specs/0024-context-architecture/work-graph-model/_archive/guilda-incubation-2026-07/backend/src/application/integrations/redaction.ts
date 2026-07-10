// redaction.ts — redação mínima antes de qualquer conteúdo sair do processo
// (assistente local/cloud) ou entrar em log. Não substitui classificação de
// dados; remove padrões óbvios de segredo/identificador sensível.
import { SECRET_PATTERNS } from "@demo/domain/server";

const EXTRA_PATTERNS: RegExp[] = [
  // bearer/authorization tokens colados
  /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}\b/gi,
  // e-mails
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  // chaves privadas PEM
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
];

export type RedactionResult = {
  text: string;
  redactions: number;
};

export function redactSensitiveText(input: string): RedactionResult {
  let text = String(input ?? "");
  let redactions = 0;
  for (const pattern of [...SECRET_PATTERNS, ...EXTRA_PATTERNS]) {
    const global = new RegExp(
      pattern.source,
      pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`
    );
    text = text.replace(global, () => {
      redactions += 1;
      return "[REDACTED]";
    });
  }
  return { text, redactions };
}
