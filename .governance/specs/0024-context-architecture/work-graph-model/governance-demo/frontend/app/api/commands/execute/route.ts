import { NextResponse } from "next/server";
import { executeCommand } from "@/lib/governance-server";
import type { GovernedCommand } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const command = (await request.json()) as GovernedCommand;
  const result = executeCommand(command);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
