import { redirect } from "next/navigation";
import { resolveAdoptionGate } from "@/server/adoption/gate";
import SignupView from "./_view/SignupView";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const gate = await resolveAdoptionGate();
  if (gate.principal) redirect("/organizations");
  return <SignupView />;
}
