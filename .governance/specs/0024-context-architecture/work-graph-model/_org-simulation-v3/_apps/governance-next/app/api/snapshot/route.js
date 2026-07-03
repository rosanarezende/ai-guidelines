import { NextResponse } from "next/server";
import { loadGovernanceSnapshot } from "@/lib/governance-server.mjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await loadGovernanceSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
