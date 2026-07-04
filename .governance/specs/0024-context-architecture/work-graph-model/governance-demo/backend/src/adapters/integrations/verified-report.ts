// verified-report.ts — leitor comum de relatórios locais de evidência.
// Um relatório é utilizável apenas se o contentHash bater com o corpo
// (tamper-evidence); relatório ausente é not-configured, corpo adulterado
// é fail-closed. Fixtures de desenvolvimento seguem o MESMO contrato.
import { existsSync, readFileSync } from "node:fs";
import { digest12 } from "../../shared/stable-digest.ts";

export type VerifiedReport<TBody> = {
  schema: string;
  source: string;
  generatedAt: string;
  body: TBody;
  contentHash: string;
};

export type ReportReadResult<TBody> =
  | { status: "ok"; report: VerifiedReport<TBody> }
  | { status: "missing" }
  | { status: "invalid"; error: string };

export function reportBodyHash(body: unknown): string {
  return digest12(body);
}

export function readVerifiedReport<TBody>(
  file: string,
  expectedSchema: string
): ReportReadResult<TBody> {
  if (!existsSync(file)) return { status: "missing" };
  let report: VerifiedReport<TBody>;
  try {
    report = JSON.parse(readFileSync(file, "utf8")) as VerifiedReport<TBody>;
  } catch (error) {
    return { status: "invalid", error: `JSON inválido: ${(error as Error).message}` };
  }
  if (report.schema !== expectedSchema) {
    return {
      status: "invalid",
      error: `schema "${report.schema}" ≠ esperado "${expectedSchema}"`,
    };
  }
  const actual = reportBodyHash(report.body);
  if (report.contentHash !== actual) {
    return {
      status: "invalid",
      error: `contentHash "${report.contentHash}" não bate com o corpo (${actual}) — evidência adulterada/stale`,
    };
  }
  return { status: "ok", report };
}
