import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CloseDispositionsDefinition } from "./closeDispositions.js";
import { DecisionGitOps } from "./model.js";
import { sealReview } from "../reviewSeal.js";
import { parseReview } from "../../infrastructure/yaml/reviewArtifactsReader.js";
import { makeDecisionSnapshot, makeFinding, makeLane } from "../../test-utils/decisionFixtures.js";

const def = new CloseDispositionsDefinition();

class FakeGit implements DecisionGitOps {
  added: string[] = [];
  commits: string[] = [];
  pushed = 0;
  constructor(
    private readonly dirty: string[] | null,
    private readonly pushFails = false
  ) {}
  porcelainPaths() {
    return this.dirty;
  }
  revParseShortHead() {
    return "deadbee";
  }
  add(f: string) {
    this.added.push(f);
  }
  commit(m: string) {
    this.commits.push(m);
  }
  push() {
    this.pushed++;
    if (this.pushFails) throw new Error("remote rejected");
  }
}

const OWNER = { name: "Rosana", email: "rosanarezende.com@gmail.com", handle: "@rosanarezende" };

describe("close-dispositions · elegibilidade [decide]", () => {
  it("[5][22] estado verificado (EV2 approved) torna a decisão disponível", () => {
    expect(def.detect(makeDecisionSnapshot()).status).toBe("available");
  });

  it("[7] nenhum finding aberto → not-applicable", () => {
    const s = makeDecisionSnapshot({ openFindings: [], lanes: [] });
    expect(def.detect(s).status).toBe("not-applicable");
  });

  it("[18] finding sem resolution fixed bloqueia", () => {
    const s = makeDecisionSnapshot({
      openFindings: [makeFinding({ resolution: null })],
    });
    expect(def.detect(s).status).toBe("blocked");
  });

  it("[19] verification ausente (não verificado) bloqueia", () => {
    const s = makeDecisionSnapshot({
      openFindings: [makeFinding({ verified: false })],
      lanes: [makeLane({ current: false })],
    });
    expect(def.detect(s).status).toBe("blocked");
  });

  it("[20] ref de correção inválida (stale) bloqueia", () => {
    const s = makeDecisionSnapshot({ openFindings: [makeFinding({ refValid: false })] });
    expect(def.detect(s).status).toBe("blocked");
  });

  it("[21] lane não-CURRENT bloqueia", () => {
    const s = makeDecisionSnapshot({ lanes: [makeLane({ current: false })] });
    expect(def.detect(s).status).toBe("blocked");
  });

  it("[32] evento posterior invalidante (não verificado) bloqueia", () => {
    const s = makeDecisionSnapshot({
      openFindings: [makeFinding({ verified: false })],
      lanes: [makeLane({ current: false })],
    });
    const av = def.detect(s);
    expect(av.status).toBe("blocked");
    expect(av.reasons.join(" ")).toMatch(/revalidad/i);
  });
});

describe("close-dispositions · briefing humano [decide]", () => {
  const brief = def.buildBrief(makeDecisionSnapshot(), { technical: false });
  const briefTech = def.buildBrief(makeDecisionSnapshot(), { technical: true });

  it("[8] responde as 8 perguntas humanas (todas com corpo)", () => {
    expect(brief.sections).toHaveLength(8);
    for (const s of brief.sections) expect(s.body.length).toBeGreaterThan(0);
  });

  it("[9] o resumo NÃO começa por SHA/ID/fingerprint", () => {
    expect(brief.summary).not.toMatch(/^[0-9a-f]{7,}/i);
    expect(brief.summary).not.toMatch(/^(F\d|technical_audit#)/);
  });

  it("[10][11] linguagem principal não expõe schema; detalhes técnicos ausentes por default", () => {
    const human = JSON.stringify({ summary: brief.summary, sections: brief.sections });
    expect(human).not.toMatch(/fingerprint|subject_ref|review_fingerprint/);
    expect(brief.technicalDetails).toHaveLength(0);
  });

  it("[12] --technical inclui IDs, fingerprints e refs", () => {
    const tech = JSON.stringify(briefTech.technicalDetails);
    expect(tech).toMatch(/fingerprint=/);
    expect(tech).toMatch(/technical_audit#F1/);
    expect(briefTech.technicalDetails.length).toBeGreaterThan(0);
  });

  it("[13][14][15][16] risco residual, consequências, não-autorizado e fontes presentes", () => {
    expect(brief.sections.find((s) => s.key === "residual_risks")!.body.length).toBeGreaterThan(0);
    expect(brief.consequences.length).toBeGreaterThan(0);
    expect(brief.notAuthorized.length).toBeGreaterThan(0);
    expect(brief.sources.length).toBeGreaterThan(0);
  });

  it("[17] narrativa humana (human_context) — 'o que estava errado' e 'o que foi feito' em linguagem humana", () => {
    const problems = brief.sections.find((s) => s.key === "problems")!.body.join(" ");
    const changes = brief.sections.find((s) => s.key === "changes")!.body.join(" ");
    expect(problems).toMatch(/Repositórios que usam o framework/);
    expect(changes).toMatch(/raízes distintas/);
  });

  it("[3-bug] o briefing principal NÃO expõe jargão técnico nem truncamento", () => {
    const main = JSON.stringify({
      summary: brief.summary,
      whyNow: brief.whyNow,
      sections: brief.sections,
    });
    for (const jargon of [
      "repoRoot",
      "ConstraintRoots",
      "source_ref",
      "includes(",
      "wired",
      "anchorExists",
      "packageRoot",
    ]) {
      expect(main).not.toContain(jargon);
    }
    expect(main).not.toContain("…"); // sem truncamento no principal
  });

  it("[3-bug] jargão técnico e descrição completa só em --technical", () => {
    const tech = JSON.stringify(briefTech.technicalDetails);
    expect(tech).toMatch(/wired end-to-end|anchorExists|source_ref/);
  });
});

describe("close-dispositions · plano [decide]", () => {
  it("[23] accept-all gera somente mudanças de disposition", () => {
    const plan = def.plan(makeDecisionSnapshot(), "accept-all");
    expect(plan.mutating).toBe(true);
    expect(plan.changes.every((c) => /open → accepted/.test(c.description))).toBe(true);
    expect(plan.preserved.join(" ")).toMatch(/fingerprint/);
    expect(plan.commitMessage).toMatch(/fecha findings do technical audit/);
  });

  it("[24] review-individually permite combinação accepted/open (subconjunto)", () => {
    const plan = def.plan(makeDecisionSnapshot(), "review-individually", {
      findings: ["technical_audit#F1"],
    });
    expect(plan.changes).toHaveLength(1);
    expect(plan.changes[0].description).toMatch(/F1/);
  });

  it("[25][26] cancel e request-explanation geram zero diff", () => {
    expect(def.plan(makeDecisionSnapshot(), "cancel").mutating).toBe(false);
    expect(def.plan(makeDecisionSnapshot(), "request-explanation").mutating).toBe(false);
  });

  it("[27] request-changes mantém open (sem escrita, sem resolution inventada)", () => {
    const plan = def.plan(makeDecisionSnapshot(), "request-changes");
    expect(plan.mutating).toBe(false);
    expect(plan.note.join(" ")).toMatch(/permanecem abertos/);
  });

  it("escolha desconhecida lança erro orientado", () => {
    expect(() => def.plan(makeDecisionSnapshot(), "nope")).toThrow(/desconhecida/);
  });
});

// ── apply: repo temporário com review SELADO (sem state.yml ⇒ topologia vazia) ──
function writeSealedReview(repoRoot: string): { rel: string; abs: string } {
  const rel = ".governance/specs/0099-decide-test/reviews/c-decide-test-technical_audit.yml";
  const abs = path.join(repoRoot, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(
    abs,
    `checkpoint: "checkpoint-decide-test"
role: technical_audit
executor:
  platform: codex-cli
  model: gpt-5
decision: changes_requested
findings_emitted: 1
review_fingerprint: x
findings:
  - id: F1
    severity: high
    location: "src/x.ts#L1-L2"
    description: "bug exemplo"
    disposition: open
    fingerprint: x
`
  );
  const silent = { info: () => {}, error: () => {} };
  expect(sealReview(abs, silent)).toBe(0);
  return { rel, abs };
}

function applySnapshot(repoRoot: string, rel: string) {
  return makeDecisionSnapshot({
    repoRoot,
    specId: "0099",
    specPath: ".governance/specs/0099-decide-test",
    checkpoint: "checkpoint-decide-test",
    openFindings: [
      makeFinding({
        localId: "F1",
        qualified: "technical_audit#F1",
        location: "src/x.ts#L1-L2",
        description: "bug exemplo",
      }),
    ],
    lanes: [makeLane({ reviewFile: rel })],
    steps: [],
  });
}

describe("close-dispositions · apply (efeito governado) [decide]", () => {
  let repoRoot: string;
  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "decide-cd-"));
  });
  afterEach(() => fs.rmSync(repoRoot, { recursive: true, force: true }));

  it("[23][28][29] flip open→accepted preserva fingerprints (seal no-op) e commita exclusivo", async () => {
    const { rel, abs } = writeSealedReview(repoRoot);
    const before = fs.readFileSync(abs, "utf8");
    const plan = def.plan(applySnapshot(repoRoot, rel), "accept-all");
    const git = new FakeGit([rel]);
    const result = await def.apply(plan, {
      repoRoot,
      logger: { info: () => {}, error: () => {} },
      actor: OWNER,
      git,
      authorization: "explicit-human-decision",
    });
    expect(result.ok).toBe(true);
    const after = fs.readFileSync(abs, "utf8");
    expect(after).toContain("disposition: accepted");
    // fingerprints intactos (disposition fora do hash): seal é no-op.
    expect(parseReview(after, rel).reviewFingerprint).toBe(
      parseReview(before, rel).reviewFingerprint
    );
    const silent = { info: () => {}, error: () => {} };
    expect(sealReview(abs, silent)).toBe(0);
    // [57][58] commit exclusivo + push normal.
    expect(git.added).toEqual([rel]);
    expect(git.commits).toHaveLength(1);
    expect(git.pushed).toBe(1);
  });

  it("[56] diff misto (mixed_diff) bloqueia antes do commit", async () => {
    const { rel } = writeSealedReview(repoRoot);
    const plan = def.plan(applySnapshot(repoRoot, rel), "accept-all");
    const git = new FakeGit([rel, "src/foo.ts"]);
    const result = await def.apply(plan, {
      repoRoot,
      logger: { info: () => {}, error: () => {} },
      actor: OWNER,
      git,
      authorization: "explicit-human-decision",
    });
    expect(result.ok).toBe(false);
    expect(result.messages.join(" ")).toMatch(/diff misto/);
    expect(git.commits).toHaveLength(0);
  });

  it("[59] push falho preserva o commit local", async () => {
    const { rel } = writeSealedReview(repoRoot);
    const plan = def.plan(applySnapshot(repoRoot, rel), "accept-all");
    const git = new FakeGit([rel], true);
    const result = await def.apply(plan, {
      repoRoot,
      logger: { info: () => {}, error: () => {} },
      actor: OWNER,
      git,
      authorization: "explicit-human-decision",
    });
    expect(result.ok).toBe(false);
    expect(result.committed).toBe("deadbee");
    expect(result.pushed).toBe(false);
    expect(result.messages.join(" ")).toMatch(/permanece LOCAL/);
  });
});
