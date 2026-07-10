import { NextResponse, type NextRequest } from "next/server";
import { handleGraphAdjacency } from "@demo/backend";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const result = await handleGraphAdjacency(query);
  return NextResponse.json(result.body, { status: result.status });
}
