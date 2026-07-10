import { NextResponse } from "next/server";
import { handleAssistantAdvisory } from "@demo/backend";

export const dynamic = "force-dynamic";

// Advisory apenas: prompt sai do processo SOMENTE para endpoint permitido pela
// política de egress (loopback por padrão), após redação mínima; a resposta
// nunca vira mutação governada automaticamente.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = await handleAssistantAdvisory(body);
  return NextResponse.json(result.body, { status: result.status });
}
