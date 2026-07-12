// Banco do CICLO DA APP: lê _viewer/db.json (as Iniciativas autoradas pela app) → DERIVA o board → escreve
// _viewer/public/snapshot.json. Fecha o ciclo: autoria (INPUT) → banco (deriva) → board.
//   node _banks/derive-app.ts [--watch]
// DERIVADO/regenerável, NÃO autoridade. (O simulador YAML — run.ts — é outra frente, retomada depois.)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DB = path.resolve(HERE, "../_viewer/db.json");
const OUT = path.resolve(HERE, "../_viewer/public/snapshot.json");

type DecisionStatus = "accepted" | "rejected" | "pending" | "none";
interface AppIntent {
  id: string;
  title: string;
  objective: string;
  questions: { id: string; question: string; verdict?: string }[];
  decisions: {
    id: string;
    decides: string[];
    status: "accepted" | "rejected";
    supersedes?: string[];
  }[];
}
interface BoardQuestion {
  id: string;
  question: string;
  verdict?: string;
  answered: boolean;
  decision: DecisionStatus;
  resolved: boolean;
}
interface BoardIntent {
  id: string;
  title: string;
  objective: string;
  questions: BoardQuestion[];
  resolved: number;
  total: number;
}
interface Snapshot {
  intents: BoardIntent[];
}

// o GATE: respondida (tem verdict) ≠ resolvida (decisão aceita)
function deriveQuestion(intent: AppIntent, q: AppIntent["questions"][number]): BoardQuestion {
  const dead = new Set<string>();
  for (const d of intent.decisions)
    if (d.status === "accepted" && d.supersedes) for (const id of d.supersedes) dead.add(id);
  const dec = intent.decisions.find((d) => !dead.has(d.id) && d.decides.includes(q.id));
  const answered = Boolean(q.verdict);
  const decision: DecisionStatus = dec ? dec.status : answered ? "pending" : "none";
  return {
    id: q.id,
    question: q.question,
    verdict: q.verdict,
    answered,
    decision,
    resolved: decision === "accepted",
  };
}

function derive(): Snapshot {
  const db = fs.existsSync(DB)
    ? (JSON.parse(fs.readFileSync(DB, "utf8")) as { intents?: AppIntent[] })
    : { intents: [] };
  const intents: BoardIntent[] = (db.intents ?? []).map((i) => {
    const questions = (i.questions ?? []).map((q) => deriveQuestion(i, q));
    return {
      id: i.id,
      title: i.title,
      objective: i.objective,
      questions,
      resolved: questions.filter((q) => q.resolved).length,
      total: questions.length,
    };
  });
  return { intents };
}

function build(): void {
  try {
    const snap = derive();
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(snap, null, 2) + "\n");
    console.log(`[derive-app] ${snap.intents.length} iniciativa(s) → _viewer/public/snapshot.json`);
  } catch (e) {
    console.error("[derive-app] erro ao derivar:", e);
  }
}

build();

if (process.argv.includes("--watch")) {
  console.log("[derive-app] observando _viewer/db.json…");
  let timer: ReturnType<typeof setTimeout> | null = null;
  fs.watch(path.dirname(DB), (_event, file) => {
    if (file !== "db.json") return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(build, 150); // debounce
  });
}
