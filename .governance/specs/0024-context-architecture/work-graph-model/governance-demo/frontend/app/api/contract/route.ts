import { NextResponse } from "next/server";
import { handleApiContract } from "@demo/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = handleApiContract();
  return NextResponse.json(result.body, { status: result.status });
}
