import { readFileSync, writeFileSync } from "node:fs";
import { parseDocument, parse, YAMLMap, YAMLSeq } from "yaml";
import {
  fingerprintOf,
  reviewFingerprintOf,
  reviewEventFingerprintOf,
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

  // POLIMÓRFICO (CO-4, rodada 6): `event_id` presente ⇒ ReviewEventArtifact
  // (sela `event_fingerprint`); ausente ⇒ ReviewArtifact (fluxo abaixo).
  // Antes disto o agente revisor precisou reproduzir o algoritmo num script
  // temporário — exatamente o ritual manual que o contrato situado proíbe.
  if (raw.event_id !== undefined && raw.event_id !== null) {
    return sealEvent(file, raw, doc, checkpoint, role, logger);
  }
  if (raw.review_fingerprint === undefined && raw.findings_emitted === undefined) {
    logger.error(
      `❌ Artefato desconhecido em ${file}: nem review (findings_emitted/review_fingerprint) nem event (event_id).`
    );
    return 1;
  }

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

/** Sela um ReviewEventArtifact (`event_fingerprint`) — mesma UX/contrato do review. */
function sealEvent(
  file: string,
  raw: any,
  doc: any,
  checkpoint: string,
  role: string,
  logger: Logger
): number {
  const scope = raw.scope === "review" ? "review" : "findings";
  const verifies: string[] = Array.isArray(raw.verifies) ? raw.verifies.map(String) : [];
  const auditEvidence = raw.audit_evidence as AuditEvidence | undefined;
  const executor = raw.executor as ExecutorProvenance | undefined;
  if (!auditEvidence || !executor) {
    logger.error(`❌ Evento em ${file} sem audit_evidence/executor — complete antes de selar.`);
    return 1;
  }
  const expected = reviewEventFingerprintOf({
    checkpoint,
    role,
    eventId: String(raw.event_id || ""),
    kind: String(raw.kind || ""),
    decision: String(raw.decision || ""),
    verifies,
    auditEvidence,
    executor,
    subjectRef: typeof raw.subject_ref === "string" ? raw.subject_ref : undefined,
    scope,
    reviewFingerprint:
      typeof raw.review_fingerprint === "string" ? raw.review_fingerprint : undefined,
    previousSubjectRef:
      typeof raw.previous_subject_ref === "string" ? raw.previous_subject_ref : undefined,
  });

  const declared = String(raw.event_fingerprint || "");
  if (declared === expected) {
    logger.info(`✅ Selos já estão corretos. Nenhuma alteração em ${file}`);
    return 0;
  }
  if (/^[a-f0-9]{12}$/i.test(declared)) {
    logger.error(
      `❌ Divergência no event_fingerprint: selo atual (${declared}) não bate com calculado (${expected}). Não será sobrescrito silenciosamente.`
    );
    return 1;
  }
  doc.set("event_fingerprint", expected);
  try {
    writeFileSync(file, String(doc));
    logger.info(`✅ Arquivo selado com sucesso: ${file}`);
    return 0;
  } catch (err) {
    logger.error(`❌ Falha ao salvar arquivo: ${err}`);
    return 1;
  }
}
