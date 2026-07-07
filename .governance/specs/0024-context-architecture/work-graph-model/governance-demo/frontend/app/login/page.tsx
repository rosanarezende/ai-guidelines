import { redirect } from "next/navigation";
import { resolveAdoptionGate } from "@/server/adoption/gate";
import { portalAuthUiOptions } from "@/server/auth/portal-auth";
import LoginView from "./_view/LoginView";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const gate = await resolveAdoptionGate();
  if (gate.principal) redirect("/organizations");
  return <LoginView options={portalAuthUiOptions()} />;
}
