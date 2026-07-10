import { NextResponse } from "next/server";
import { handleCommandExecute } from "@demo/backend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = await handleCommandExecute(body);
  return NextResponse.json(result.body, { status: result.status });
}
