#!/usr/bin/env node
import path from "node:path";
import { parseArgs } from "node:util";

import { main as buildRules } from "./buildRules.js";
import { main as runActiveSpecsCheck } from "./activeSpecsConsistencyCheck.js";
import { main as runCoKnowledgeCheck } from "./coKnowledgeCheck.js";
import { main as runCoKnowledgeInventory } from "./coKnowledgeInventoryCheck.js";
import { main as runConstraintsCheck } from "./constraintsCheck.js";
import { main as runDisclosure } from "./disclosureRender.js";
import { main as runGateDecidability } from "./gateDecidabilityCheck.js";
import { main as runHandoffCheck } from "./handoffCheck.js";
import { main as runInsightsCheck } from "./insightsCheck.js";
import { main as runIntentCheck } from "./intentCheck.js";
import { main as runKnowledgeCompile } from "./knowledgeCompile.js";
import {
  runCheck as runLivingDocsCheck,
  runGenerate as runLivingDocsGenerate,
} from "./livingDocs.js";
import { main as runPrBodyUpdate } from "./prBodyUpdate.js";
import { main as runPrReadyCheck } from "./prReadyCheck.js";
import { main as runReconcileCheck } from "./reconcileCheck.js";
import { main as runReviewCheck } from "./reviewCheck.js";
import { main as runReviewPublish } from "./reviewPublish.js";
import { sealReview } from "./reviewSeal.js";
import { main as runRulesetCheck } from "./rulesetCheck.js";
import { main as runRuntimeBootstrap } from "./runtimeBootstrap.js";
import { main as runScriptContracts } from "./scriptContracts.js";
import { main as runSiteFlowCopy } from "./siteFlowCopy.js";
import { main as runSitePromptFlows } from "./sitePromptFlows.js";
import { main as runSiteScenarios } from "./siteScenarios.js";
import { main as runStateYmlCheck } from "./stateYmlCheck.js";
import { runConsumerJourney } from "./consumerJourney.js";

function packageRoot(): string {
  return path.resolve(__dirname, "../..");
}

function usage(): string {
  return [
    "Uso: node dist/cli/bin.js <script> [args]",
    "",
    "Scripts: build-rules, living-docs, state-yml-check, active-specs-check,",
    "reconcile-check, handoff-check, co-knowledge-check, co-knowledge-inventory,",
    "constraints-check, knowledge-compile, script-contracts, runtime-bootstrap,",
    "gate-decidability-check, ruleset-check, review-check, insights-check,",
    "intent-check, disclosure-render, review-publish, review-seal,",
    "pr-body-update, pr-ready-check, site-flow-copy, site-scenarios,",
    "site-prompts, consumer-journey",
  ].join("\n");
}

async function dispatch(script: string | undefined, args: readonly string[]): Promise<number> {
  const root = packageRoot();

  switch (script) {
    case "build-rules":
      return buildRules(root);
    case "living-docs":
      if (args[0] === "generate") return runLivingDocsGenerate({ repoRoot: root });
      if (args[0] === "check") return runLivingDocsCheck({ repoRoot: root });
      process.stderr.write("Usage: living-docs <generate|check>\n");
      return 2;
    case "state-yml-check": {
      const invalidArgs = args.filter((arg) => arg !== "--all");
      if (invalidArgs.length > 0) {
        process.stderr.write(
          `❌ Uso inválido: ${invalidArgs.join(" ")}\n` +
            `   Use: npm run state-yml:check [-- --all]\n`
        );
        return 2;
      }
      return runStateYmlCheck(root, undefined, {
        scope: args.includes("--all") ? "all" : "operational",
      });
    }
    case "active-specs-check":
      return runActiveSpecsCheck(root);
    case "reconcile-check":
      return runReconcileCheck(root);
    case "handoff-check":
      return runHandoffCheck(root, args);
    case "co-knowledge-check":
      return runCoKnowledgeCheck(root);
    case "co-knowledge-inventory":
      return runCoKnowledgeInventory(root);
    case "constraints-check":
      return runConstraintsCheck({ packageRoot: root, consumerRoot: process.cwd() });
    case "knowledge-compile":
      return runKnowledgeCompile(args, { packageRoot: root, consumerRoot: process.cwd() });
    case "script-contracts":
      return runScriptContracts(args, root);
    case "site-flow-copy":
      return runSiteFlowCopy(args, root);
    case "site-scenarios":
      return runSiteScenarios(args, root);
    case "site-prompts":
      return runSitePromptFlows(args, root);
    case "consumer-journey":
      return runConsumerJourney(args, { repoRoot: root });
    case "runtime-bootstrap":
      return runRuntimeBootstrap([...args], root);
    case "gate-decidability-check":
      return runGateDecidability(root);
    case "ruleset-check": {
      const mode = args.includes("--parity") ? "parity" : "producibility";
      const liveIdx = args.indexOf("--live");
      const livePath = liveIdx >= 0 ? args[liveIdx + 1] : undefined;
      if (liveIdx >= 0 && !livePath) {
        process.stderr.write("❌ --live exige um caminho de arquivo.\n");
        return 2;
      }
      return runRulesetCheck(root, { mode, livePath });
    }
    case "review-check":
      return runReviewCheck(root);
    case "insights-check":
      return runInsightsCheck(root);
    case "intent-check":
      return runIntentCheck(root);
    case "disclosure-render": {
      const prNumber = process.env.PR_NUMBER ? Number(process.env.PR_NUMBER) : undefined;
      return runDisclosure(root, prNumber ? { prNumber } : {});
    }
    case "review-publish":
      return runReviewPublish(root, args);
    case "review-seal": {
      try {
        const { values } = parseArgs({
          args: [...args],
          options: { file: { type: "string" } },
          strict: true,
        });
        if (!values.file) {
          process.stderr.write(
            "❌ [review:seal] Argumento obrigatório --file ausente.\n" +
              "   Exemplo: npm run review:seal -- --file .governance/specs/.../reviews/c-foo-technical_audit.yml\n"
          );
          return 2;
        }
        return sealReview(path.resolve(process.cwd(), values.file));
      } catch (error) {
        process.stderr.write(
          `❌ [review:seal] Erro de execução: ${
            error instanceof Error ? error.message : String(error)
          }\n`
        );
        return 2;
      }
    }
    case "pr-body-update":
      return runPrBodyUpdate(args);
    case "pr-ready-check":
      return runPrReadyCheck(args, { repoRoot: root });
    default:
      process.stderr.write(`${usage()}\n`);
      return 2;
  }
}

async function main(): Promise<void> {
  const [script, ...args] = process.argv.slice(2);
  try {
    const exitCode = await dispatch(script, args);
    if (exitCode !== 0) process.exitCode = exitCode;
  } catch (error) {
    process.stderr.write(`Erro: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

void main();
