/**
 * Schema guard determinístico para `registry.yml`.
 *
 * Contrato:
 *  - Códigos de erro estáveis (`REGISTRY_YAML_*`) consumidos por testes e UI.
 *  - Função pura: recebe texto YAML, devolve `{ document, items }`.
 *  - `document` é o `yaml.Document` original (CST intacto → comentários preservados).
 *  - `items` é a projeção tipada (`WorkItem[]`) ordenada por id.
 *
 * Camada: `infrastructure/yaml/` — única autorizada a importar `yaml`.
 */
import { Document, isMap, isSeq, parseDocument, YAMLMap, YAMLSeq } from "yaml";
import { GovernanceError } from "../../domain/shared/errors.js";
import {
  DENSE_KINDS,
  isDenseKind,
  isVirtualKind,
  WorkItem,
} from "../../domain/work-item/WorkItem.js";
import {
  IncidentSeverity,
  LifecycleStatus,
  ResolutionMode,
  ValueStatus,
  WORK_ITEM_KINDS,
  WorkItemKind,
} from "../../domain/shared/types.js";

export const REGISTRY_SCHEMA_VERSION = 1;

/**
 * Ordem canônica de campos por item. Garante determinismo na serialização e
 * legibilidade humana (id e kind primeiro, timestamps no fim).
 */
export const REGISTRY_FIELD_ORDER: readonly string[] = [
  "id",
  "kind",
  "title",
  "status",
  "workspacePath",
  "hypothesis",
  "successMetrics",
  "severity",
  "outcome",
  "resolution",
  "sourceRefs",
  "createdAt",
  "updatedAt",
];

const LIFECYCLE_STATUSES: readonly LifecycleStatus[] = [
  "draft",
  "in-progress",
  "review",
  "done",
  "archived",
];
const VALUE_STATUSES: readonly ValueStatus[] = ["pending", "won", "lost", "inconclusive"];
const RESOLUTION_MODES: readonly ResolutionMode[] = ["pending", "cleaned-up", "kept"];
const INCIDENT_SEVERITIES: readonly IncidentSeverity[] = ["low", "medium", "high", "critical"];

export interface ParsedRegistry {
  readonly document: Document;
  readonly items: ReadonlyArray<WorkItem>;
}

/**
 * Cria um Document vazio canônico (sem nenhum item).
 * Usado quando `registry.yml` não existe ainda.
 */
export function buildEmptyDocument(): Document {
  const doc = new Document({ version: REGISTRY_SCHEMA_VERSION, items: [] });
  return doc;
}

/**
 * Parseia o texto YAML e valida estrutura.
 * Lança `GovernanceError` com código estável em qualquer divergência.
 */
export function parseRegistry(text: string): ParsedRegistry {
  let doc: Document;
  try {
    doc = parseDocument(text, { prettyErrors: false });
  } catch (err) {
    throw new GovernanceError(
      "REGISTRY_YAML_PARSE_ERROR",
      `YAML inválido: ${(err as Error).message}`
    );
  }
  if (doc.errors.length > 0) {
    throw new GovernanceError(
      "REGISTRY_YAML_PARSE_ERROR",
      `YAML inválido: ${doc.errors[0].message}`
    );
  }

  const root = doc.contents;
  if (!isMap(root)) {
    throw new GovernanceError(
      "REGISTRY_YAML_INVALID_ROOT",
      "Raiz do registry.yml deve ser um mapa YAML."
    );
  }

  const version = root.get("version");
  if (version !== REGISTRY_SCHEMA_VERSION) {
    throw new GovernanceError(
      "REGISTRY_YAML_INVALID_VERSION",
      `Campo 'version' deve ser ${REGISTRY_SCHEMA_VERSION} (recebido: ${JSON.stringify(version)}).`
    );
  }

  const itemsNode = root.get("items", true);
  if (itemsNode === undefined || itemsNode === null) {
    // items ausente → trata como lista vazia, mas força o campo a existir
    throw new GovernanceError(
      "REGISTRY_YAML_INVALID_ITEMS",
      "Campo 'items' é obrigatório (use lista vazia se não houver itens)."
    );
  }
  if (!isSeq(itemsNode)) {
    throw new GovernanceError(
      "REGISTRY_YAML_INVALID_ITEMS",
      "Campo 'items' deve ser uma sequência YAML."
    );
  }

  const items: WorkItem[] = [];
  const seenIds = new Set<string>();
  for (const itemNode of (itemsNode as YAMLSeq).items) {
    if (!isMap(itemNode)) {
      throw new GovernanceError(
        "REGISTRY_YAML_INVALID_ITEM_SHAPE",
        "Cada item de 'items' deve ser um mapa YAML."
      );
    }
    const wi = mapToWorkItem(itemNode);
    if (seenIds.has(wi.id)) {
      throw new GovernanceError(
        "REGISTRY_YAML_DUPLICATE_ID",
        `Item com id '${wi.id}' aparece mais de uma vez em registry.yml.`
      );
    }
    seenIds.add(wi.id);
    items.push(wi);
  }

  items.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { document: doc, items };
}

/** Converte um WorkItem em representação plana ordenada para serialização. */
export function workItemToPlain(item: WorkItem): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of REGISTRY_FIELD_ORDER) {
    const value = (item as unknown as Record<string, unknown>)[key];
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
}

/**
 * Aplica a ordem canônica de chaves a um YAMLMap mantendo nós (e seus comentários).
 * Necessário para garantir determinismo após updates que possam reordenar chaves.
 */
export function reorderItemMap(map: YAMLMap): void {
  const pairs = [...map.items];
  const indexOf = (key: unknown): number => {
    const i = REGISTRY_FIELD_ORDER.indexOf(String(key));
    return i === -1 ? REGISTRY_FIELD_ORDER.length : i;
  };
  pairs.sort(
    (a, b) =>
      indexOf((a.key as { value: unknown }).value) - indexOf((b.key as { value: unknown }).value)
  );
  map.items = pairs;
}

/**
 * Reordena a sequência de itens por id ascendente.
 * Como comentários no yaml@2 estão atrelados aos nós (não a índices),
 * a reordenação preserva a relação comentário↔item.
 */
export function sortItemsSeq(seq: YAMLSeq): void {
  const arr = [...seq.items] as YAMLMap[];
  arr.sort((a, b) => {
    const ida = String(a.get("id"));
    const idb = String(b.get("id"));
    return ida < idb ? -1 : ida > idb ? 1 : 0;
  });
  seq.items = arr;
}

function mapToWorkItem(map: YAMLMap): WorkItem {
  // Projeta o nó YAMLMap em valores JS planos (resolve scalars/seqs/maps recursivamente).
  // `toJSON()` retorna `null` para nós ausentes e arrays JS reais para YAMLSeq.
  const plain = (map.toJSON() ?? {}) as Record<string, unknown>;
  const get = (key: string): unknown => plain[key];
  const hasKey = (key: string): boolean =>
    Object.prototype.hasOwnProperty.call(plain, key) && plain[key] !== undefined;

  const id = requireString(get("id"), "id");
  const kind = requireKind(get("kind"));
  const title = requireString(get("title"), "title");
  const status = requireLifecycle(get("status"));
  const createdAt = requireString(get("createdAt"), "createdAt");
  const updatedAt = requireString(get("updatedAt"), "updatedAt");
  const sourceRefs = requireStringArray(get("sourceRefs"), "sourceRefs");

  if (isVirtualKind(kind)) {
    for (const denseField of [
      "workspacePath",
      "hypothesis",
      "successMetrics",
      "severity",
      "outcome",
      "resolution",
    ]) {
      if (hasKey(denseField)) {
        throw new GovernanceError(
          "REGISTRY_YAML_VIRTUAL_HAS_DENSE_FIELD",
          `Item virtual '${id}' (kind=${kind}) não pode declarar o campo '${denseField}'.`
        );
      }
    }
    return { id, kind, title, status, createdAt, updatedAt, sourceRefs };
  }

  // Dense
  if (!isDenseKind(kind)) {
    // Defensivo (já checado em requireKind), mas mantém narrow.
    throw new GovernanceError("REGISTRY_YAML_UNKNOWN_KIND", `Kind inesperado: ${String(kind)}.`);
  }
  const workspacePath = get("workspacePath");
  if (typeof workspacePath !== "string" || workspacePath.length === 0) {
    throw new GovernanceError(
      "REGISTRY_YAML_DENSE_MISSING_WORKSPACE",
      `Item denso '${id}' (kind=${kind}) deve declarar 'workspacePath' como string não-vazia.`
    );
  }

  const dense: WorkItem = {
    id,
    kind,
    title,
    status,
    createdAt,
    updatedAt,
    sourceRefs,
    workspacePath,
    ...(hasKey("hypothesis") ? { hypothesis: requireString(get("hypothesis"), "hypothesis") } : {}),
    ...(hasKey("successMetrics")
      ? { successMetrics: requireStringArray(get("successMetrics"), "successMetrics") }
      : {}),
    ...(hasKey("severity") ? { severity: requireSeverity(get("severity")) } : {}),
    ...(hasKey("outcome") ? { outcome: requireValueStatus(get("outcome")) } : {}),
    ...(hasKey("resolution") ? { resolution: requireResolution(get("resolution")) } : {}),
  };
  return dense;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new GovernanceError(
      "REGISTRY_YAML_INVALID_FIELD_TYPE",
      `Campo '${field}' deve ser string (recebido: ${describe(value)}).`
    );
  }
  if (value.length === 0) {
    throw new GovernanceError(
      "REGISTRY_YAML_MISSING_FIELD",
      `Campo '${field}' é obrigatório e não pode ser vazio.`
    );
  }
  return value;
}

function requireStringArray(value: unknown, field: string): ReadonlyArray<string> {
  if (!Array.isArray(value)) {
    throw new GovernanceError(
      "REGISTRY_YAML_INVALID_FIELD_TYPE",
      `Campo '${field}' deve ser lista de strings (recebido: ${describe(value)}).`
    );
  }
  for (const entry of value) {
    if (typeof entry !== "string") {
      throw new GovernanceError(
        "REGISTRY_YAML_INVALID_FIELD_TYPE",
        `Campo '${field}' deve conter apenas strings (encontrado: ${describe(entry)}).`
      );
    }
  }
  return [...(value as string[])];
}

function requireKind(value: unknown): WorkItemKind {
  if (typeof value !== "string" || !(WORK_ITEM_KINDS as readonly string[]).includes(value)) {
    throw new GovernanceError(
      "REGISTRY_YAML_UNKNOWN_KIND",
      `Campo 'kind' inválido: ${describe(value)}. Esperado um de ${WORK_ITEM_KINDS.join(", ")}.`
    );
  }
  return value as WorkItemKind;
}

function requireLifecycle(value: unknown): LifecycleStatus {
  if (typeof value !== "string" || !(LIFECYCLE_STATUSES as readonly string[]).includes(value)) {
    throw new GovernanceError(
      "REGISTRY_YAML_INVALID_FIELD_TYPE",
      `Campo 'status' inválido: ${describe(value)}. Esperado um de ${LIFECYCLE_STATUSES.join(", ")}.`
    );
  }
  return value as LifecycleStatus;
}

function requireSeverity(value: unknown): IncidentSeverity {
  if (typeof value !== "string" || !(INCIDENT_SEVERITIES as readonly string[]).includes(value)) {
    throw new GovernanceError(
      "REGISTRY_YAML_INVALID_FIELD_TYPE",
      `Campo 'severity' inválido: ${describe(value)}.`
    );
  }
  return value as IncidentSeverity;
}

function requireValueStatus(value: unknown): ValueStatus {
  if (typeof value !== "string" || !(VALUE_STATUSES as readonly string[]).includes(value)) {
    throw new GovernanceError(
      "REGISTRY_YAML_INVALID_FIELD_TYPE",
      `Campo 'outcome' inválido: ${describe(value)}.`
    );
  }
  return value as ValueStatus;
}

function requireResolution(value: unknown): ResolutionMode {
  if (typeof value !== "string" || !(RESOLUTION_MODES as readonly string[]).includes(value)) {
    throw new GovernanceError(
      "REGISTRY_YAML_INVALID_FIELD_TYPE",
      `Campo 'resolution' inválido: ${describe(value)}.`
    );
  }
  return value as ResolutionMode;
}

function describe(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return `array(${value.length})`;
  return typeof value;
}

// Util explícito (mantém set de kinds densos exposto para testes/utilitários futuros).
export const REGISTRY_DENSE_KINDS = DENSE_KINDS;
