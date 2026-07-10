import { NextResponse } from "next/server";
import { handleGraphConflicts } from "@demo/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await handleGraphConflicts();
  return NextResponse.json(result.body, { status: result.status });
}
