// schema.ts — combinadores tipados mínimos com projeção JSON Schema.
// Escolha consciente: sem dependência externa (supply-chain local) e com o
// mesmo objeto servindo validação runtime + contrato verificável (/api/contract).
export type SchemaIssue = { path: string; message: string };

export class SchemaError extends Error {
  readonly issues: SchemaIssue[];

  constructor(issues: SchemaIssue[]) {
    super(issues.map((issue) => `${issue.path || "$"}: ${issue.message}`).join("; "));
    this.name = "SchemaError";
    this.issues = issues;
  }
}

export type Schema<T> = {
  parse(value: unknown, path?: string): T;
  jsonSchema(): Record<string, unknown>;
};

export type Infer<S> = S extends Schema<infer T> ? T : never;

function fail(path: string, message: string): never {
  throw new SchemaError([{ path, message }]);
}

export function string(
  options: { minLength?: number; enum?: readonly string[] } = {}
): Schema<string> {
  return {
    parse(value, path = "$") {
      if (typeof value !== "string") fail(path, "esperado string");
      if (options.minLength !== undefined && value.length < options.minLength)
        fail(path, `esperado string com pelo menos ${options.minLength} caractere(s)`);
      if (options.enum && !options.enum.includes(value))
        fail(path, `valor "${value}" fora do enum (${options.enum.join(" · ")})`);
      return value;
    },
    jsonSchema() {
      return {
        type: "string",
        ...(options.minLength !== undefined ? { minLength: options.minLength } : {}),
        ...(options.enum ? { enum: [...options.enum] } : {}),
      };
    },
  };
}

export function integer(options: { min?: number; max?: number } = {}): Schema<number> {
  return {
    parse(value, path = "$") {
      const parsed = typeof value === "string" && value !== "" ? Number(value) : value;
      if (typeof parsed !== "number" || !Number.isInteger(parsed)) fail(path, "esperado inteiro");
      if (options.min !== undefined && parsed < options.min)
        fail(path, `esperado inteiro >= ${options.min}`);
      if (options.max !== undefined && parsed > options.max)
        fail(path, `esperado inteiro <= ${options.max}`);
      return parsed;
    },
    jsonSchema() {
      return {
        type: "integer",
        ...(options.min !== undefined ? { minimum: options.min } : {}),
        ...(options.max !== undefined ? { maximum: options.max } : {}),
      };
    },
  };
}

export function boolean(): Schema<boolean> {
  return {
    parse(value, path = "$") {
      if (typeof value !== "boolean") fail(path, "esperado boolean");
      return value;
    },
    jsonSchema() {
      return { type: "boolean" };
    },
  };
}

export function record(): Schema<Record<string, unknown>> {
  return {
    parse(value, path = "$") {
      if (!value || typeof value !== "object" || Array.isArray(value))
        fail(path, "esperado objeto");
      return value as Record<string, unknown>;
    },
    jsonSchema() {
      return { type: "object" };
    },
  };
}

export function array<T>(item: Schema<T>): Schema<T[]> {
  return {
    parse(value, path = "$") {
      if (!Array.isArray(value)) fail(path, "esperado array");
      return value.map((entry, index) => item.parse(entry, `${path}[${index}]`));
    },
    jsonSchema() {
      return { type: "array", items: item.jsonSchema() };
    },
  };
}

export function optional<T>(schema: Schema<T>): Schema<T | undefined> {
  const marked = {
    parse(value: unknown, path = "$") {
      if (value === undefined || value === null) return undefined;
      return schema.parse(value, path);
    },
    jsonSchema() {
      return schema.jsonSchema();
    },
  };
  optionalSchemas.add(marked);
  return marked;
}

const optionalSchemas = new WeakSet<object>();

export function object<TShape extends Record<string, Schema<unknown>>>(
  shape: TShape,
  options: { additionalProperties?: boolean } = {}
): Schema<{ [K in keyof TShape]: Infer<TShape[K]> }> {
  return {
    parse(value, path = "$") {
      if (!value || typeof value !== "object" || Array.isArray(value))
        fail(path, "esperado objeto");
      const input = value as Record<string, unknown>;
      if (options.additionalProperties === false) {
        const allowed = new Set(Object.keys(shape));
        for (const key of Object.keys(input))
          if (!allowed.has(key)) fail(`${path}.${key}`, "chave desconhecida (schema fechado)");
      }
      const out: Record<string, unknown> = {};
      for (const [key, schema] of Object.entries(shape)) {
        const parsed = schema.parse(input[key], `${path}.${key}`);
        if (parsed !== undefined) out[key] = parsed;
      }
      return out as { [K in keyof TShape]: Infer<TShape[K]> };
    },
    jsonSchema() {
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [key, schema] of Object.entries(shape)) {
        properties[key] = schema.jsonSchema();
        if (!optionalSchemas.has(schema)) required.push(key);
      }
      return {
        type: "object",
        properties,
        ...(required.length ? { required } : {}),
        ...(options.additionalProperties === false ? { additionalProperties: false } : {}),
      };
    },
  };
}
