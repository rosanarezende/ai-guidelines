import { NextResponse } from "next/server";
import { dryRunCommand } from "@/lib/governance-server.mjs";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const command = await request.json();
  const result = dryRunCommand(command);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
