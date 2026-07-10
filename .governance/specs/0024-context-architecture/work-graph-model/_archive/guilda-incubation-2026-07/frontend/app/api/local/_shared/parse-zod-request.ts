import { NextResponse } from "next/server";

type SafeParseSchema<T> = {
  safeParse(input: unknown):
    | { success: true; data: T }
    | {
        success: false;
        error: {
          issues: Array<{ path: PropertyKey[]; code: string; message: string }>;
        };
      };
};

const INVALID_JSON = Symbol("invalid-json");

export async function parseZodJson<T>(
  request: Request,
  schema: SafeParseSchema<T>
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  const body = await request.json().catch(() => INVALID_JSON);
  if (body === INVALID_JSON) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: "schema-invalid",
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.map((segment) => String(segment)).join("."),
            code: issue.code,
            message: issue.message,
          })),
        },
        { status: 400 }
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
