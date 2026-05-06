import fs from "fs/promises";
import { runAiCheck } from "../../commands/ai-check.mjs";

export async function runEvaluation(cwd, savePath = null) {
  const grouped = await runAiCheck(cwd);

  let totalViolations = 0;
  const violationsByRule = {};

  for (const ruleId in grouped) {
    const count = grouped[ruleId].length;
    violationsByRule[ruleId] = count;
    totalViolations += count;
  }

  const result = {
    totalViolations,
    violationsByRule,
  };

  if (savePath) {
    await fs.writeFile(savePath, JSON.stringify(result, null, 2), "utf-8");
  }

  return result;
}
