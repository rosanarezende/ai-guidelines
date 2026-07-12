import { NextResponse } from "next/server";
import { loadGovernanceSnapshot } from "@demo/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await loadGovernanceSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
