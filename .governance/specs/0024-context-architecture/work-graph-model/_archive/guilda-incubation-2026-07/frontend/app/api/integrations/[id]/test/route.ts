import { NextResponse } from "next/server";
import { handleIntegrationTest } from "@demo/backend";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const result = await handleIntegrationTest(id, body);
  return NextResponse.json(result.body, { status: result.status });
}
