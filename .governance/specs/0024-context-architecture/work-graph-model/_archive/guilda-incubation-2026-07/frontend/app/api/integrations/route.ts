import { NextResponse } from "next/server";
import { handleIntegrationsList } from "@demo/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await handleIntegrationsList();
  return NextResponse.json(result.body, { status: result.status });
}
