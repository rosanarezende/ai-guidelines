// routing-check.ts — DOGFOOD do roteamento vertical (v1, léxico): roda no intent `login_1` e confere que o matcher
// REPRODUZ as escolhas humanas (onde as explorations/works de fato caíram na sim). É o critério de aceite do v1.
import { FileHostRepository } from "./adapters/file/FileHostRepository.ts";
import { deriveRouting, LexicalMatcher } from "./domain/routing.ts";

const host = new FileHostRepository();
const manifests = await host.listManifests();
const intent = await host.getIntent("login_1");
if (!intent) throw new Error("intent login_1 não encontrada");

const suggestions = await deriveRouting(intent, manifests, new LexicalMatcher());
const top = (need: string): string | undefined =>
  suggestions.find((s) => s.need === need || s.need === `contrato: ${need}`)?.ranked[0]?.repo;

// o ESPERADO = onde o humano de fato pôs cada coisa na sim (form-validation/proactive-support/form-component)
const subjectOf = (id: string): string => intent.explores.find((e) => e.id === id)?.subject ?? "";
const expect = [
  { label: "e1 (form validado)", need: subjectOf("e1"), want: "acme-design-system" },
  { label: "e2 (suporte proativo)", need: subjectOf("e2"), want: "acme-mfe-support" },
  { label: "contrato form-component", need: "form-component", want: "acme-design-system" },
  { label: "contrato failure-event", need: "failure-event", want: "acme-mfe-identity" },
];

console.log("— roteamento sugerido (top-1) vs a escolha humana —");
let failed = 0;
for (const e of expect) {
  const got = top(e.need);
  const ok = got === e.want;
  if (!ok) failed++;
  console.log(`  ${ok ? "✅" : "❌"} ${e.label}: sugeriu ${got ?? "—"} (esperado ${e.want})`);
}

console.log("\n— ranking completo (score · porquê) —");
for (const s of suggestions) {
  console.log(`  ${s.kind} «${s.need.slice(0, 52)}»`);
  for (const r of s.ranked)
    console.log(`      ${String(r.score).padStart(2)}  ${r.repo} — ${r.why}`);
}

if (failed > 0) {
  console.error(`\n❌ dogfood: ${failed} sugestão(ões) NÃO reproduziu(ram) a escolha humana.`);
  process.exit(1);
}
console.log("\n✅ dogfood: o léxico REPRODUZIU todas as escolhas humanas (v1 aceito).");
