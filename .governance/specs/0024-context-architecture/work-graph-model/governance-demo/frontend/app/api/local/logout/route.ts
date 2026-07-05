// POST /api/local/logout — limpa apenas a sessão local.
// Não apaga estado de workspace nem event-log.
import { NextResponse } from "next/server";
import { clearSession } from "@/server/adoption/session";

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
