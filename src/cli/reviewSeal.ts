import { readFileSync, writeFileSync } from "node:fs";
import { parseDocument, parse, YAMLMap, YAMLSeq } from "yaml";
import {
  fingerprintOf,
  reviewFingerprintOf,
  AuditEvidence,
  ExecutorProvenance,
} from "../infrastructure/yaml/reviewArtifactsReader.js";

export interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

export function sealReview(file: string, logger: Logger = defaultLogger): number {
  let content: string;
  try {
    content = readFileSync(file, "utf-8");
  } catch (err) {
    logger.error(`❌ Falha ao ler arquivo: ${file} - ${err}`);
    return 1;
  }

  let raw: any;
  try {
    raw = parse(content);
  } catch (err) {
    logger.error(`❌ Falha ao fazer parse do YAML: ${err}`);
    return 1;
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    logger.error(`❌ Raiz do documento não é um objeto (mapping).`);
    return 1;
  }

  let doc: any;
  try {
    doc = parseDocument(content);
  } catch (err) {
    logger.error(`❌ Falha ao carregar AST do YAML: ${err}`);
    return 1;
  }

  const checkpoint = String(raw.checkpoint || "");
  const role = String(raw.role || "");
  const findings = Array.isArray(raw.findings) ? raw.findings : [];

  let changed = false;
  const ids: string[] = [];

  const findingsSeq = doc.get("findings") as YAMLSeq | undefined;

  for (let i = 0; i < findings.length; i++) {
    const f = findings[i];
    const id = String(f.id || "");
    ids.push(id);

    const expectedHash = fingerprintOf({
      checkpoint,
      role,
      id,
      severity: String(f.severity || ""),
      location: String(f.location || ""),
      description: String(f.description || ""),
    });

    const declared = String(f.fingerprint || "");
    if (declared !== expectedHash) {
      if (/^[a-f0-9]{12}$/i.test(declared)) {
        logger.error(
          `❌ Divergência no finding ${id}: selo atual (${declared}) não bate com calculado (${expectedHash}). Não será sobrescrito silenciosamente.`
        );
        return 1;
      }
      // Se não for hash hexadecimal válido de 12 chars, tratamos como placeholder.
      if (findingsSeq && findingsSeq.items[i]) {
        const item = findingsSeq.items[i] as YAMLMap;
        item.set("fingerprint", expectedHash);
        changed = true;
      }
    }
  }

  const expectedReviewHash = reviewFingerprintOf({
    checkpoint,
    role,
    findingsEmitted: Number(raw.findings_emitted || 0),
    ids,
    auditEvidence: raw.audit_evidence as AuditEvidence | undefined,
    executor: raw.executor as ExecutorProvenance | undefined,
    // subject_ref (CO-4): proveniência do objeto auditado — selada quando presente.
    subjectRef: typeof raw.subject_ref === "string" ? raw.subject_ref : undefined,
  });

  const declaredReview = String(raw.review_fingerprint || "");
  if (declaredReview !== expectedReviewHash) {
    if (/^[a-f0-9]{12}$/i.test(declaredReview)) {
      logger.error(
        `❌ Divergência no review_fingerprint: selo atual (${declaredReview}) não bate com calculado (${expectedReviewHash}). Não será sobrescrito silenciosamente.`
      );
      return 1;
    }
    doc.set("review_fingerprint", expectedReviewHash);
    changed = true;
  }

  if (!changed) {
    logger.info(`✅ Selos já estão corretos. Nenhuma alteração em ${file}`);
    return 0;
  }

  try {
    writeFileSync(file, String(doc));
    logger.info(`✅ Arquivo selado com sucesso: ${file}`);
    return 0;
  } catch (err) {
    logger.error(`❌ Falha ao salvar arquivo: ${err}`);
    return 1;
  }
}
