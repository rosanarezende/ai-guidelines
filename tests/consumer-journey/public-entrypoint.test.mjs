import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import {
  exists,
  installInTempDir,
  packLocal,
  runInstalledCli,
  runInstalledCliRaw,
  SMOKE_TIMEOUT_MS,
} from "../smoke/helpers/tarball.mjs";

const FIXTURES_DIR = new URL("./fixtures/", import.meta.url);

const SCENARIOS = [
  "consumer-empty",
  "consumer-existing-package",
  "consumer-existing-formatter-conflict",
  "consumer-governed-solo",
  "consumer-governed-team",
  "consumer-governed-multiple-specs",
  "consumer-peer-review",
];

async function readScenario(id) {
  const scenarioPath = new URL(`${id}/scenario.json`, FIXTURES_DIR);
  return JSON.parse(await fs.readFile(scenarioPath, "utf8"));
}

async function prepareConsumerRoot(installation, id) {
  const targetDir = path.join(installation.sandboxDir, "consumer-journey", id);
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });

  const filesDir = new URL(`${id}/files/`, FIXTURES_DIR);
  try {
    await fs.access(filesDir);
    await fs.cp(filesDir, targetDir, { recursive: true });
  } catch {
    // Cenário realmente vazio: sem árvore de files.
  }

  return targetDir;
}

async function runScenarioCommand(installation, targetDir, args, expectFailure = false) {
  if (expectFailure) {
    const result = await runInstalledCliRaw(installation.packageDir, args, { cwd: targetDir });
    assert.notEqual(result.code, 0, `comando deveria falhar: npx ai-guidelines ${args.join(" ")}`);
    return result;
  }
  return runInstalledCli(installation.packageDir, args, { cwd: targetDir });
}

function assertTextContract(result, contract, label) {
  const output = `${result.stdout}\n${result.stderr}`;
  for (const expected of contract?.contains ?? []) {
    assert.match(output, new RegExp(escapeRegExp(expected)), `${label}: esperado "${expected}"`);
  }
  for (const forbidden of contract?.notContains ?? []) {
    assert.doesNotMatch(
      output,
      new RegExp(escapeRegExp(forbidden)),
      `${label}: proibido "${forbidden}"`
    );
  }
}

async function assertAbsent(targetDir, relPaths = []) {
  for (const relPath of relPaths) {
    assert.equal(await exists(path.join(targetDir, relPath)), false, `${relPath} não deve existir`);
  }
}

async function assertExists(targetDir, relPaths = []) {
  for (const relPath of relPaths) {
    assert.equal(await exists(path.join(targetDir, relPath)), true, `${relPath} deve existir`);
  }
}

async function readPreservedText(targetDir, relPaths = []) {
  const contents = new Map();
  for (const relPath of relPaths) {
    const text = await fs.readFile(path.join(targetDir, relPath), "utf8");
    assert.ok(text.length > 0, `${relPath} deve ter conteúdo inicial`);
    contents.set(relPath, text);
  }
  return contents;
}

async function assertPreservedText(targetDir, expectedContents) {
  for (const [relPath, expected] of expectedContents) {
    const actual = await fs.readFile(path.join(targetDir, relPath), "utf8");
    assert.equal(actual, expected, `${relPath} deve preservar conteúdo existente`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("Consumer Journey: npx ai-guidelines em consumidores simulados", () => {
  let packedTarball;
  let installation;

  before(async () => {
    packedTarball = await packLocal();
    installation = await installInTempDir(packedTarball.tarballPath);
  });

  after(async () => {
    await installation?.cleanup?.();
    await packedTarball?.cleanup?.();
  });

  for (const id of SCENARIOS) {
    it(
      `DADO ${id} QUANDO roda a CLI pública instalada ENTÃO o fluxo é contextual e falsificável`,
      { timeout: SMOKE_TIMEOUT_MS },
      async () => {
        const scenario = await readScenario(id);
        const targetDir = await prepareConsumerRoot(installation, id);

        const entryArgs = scenario.entrypoint?.args ?? [];
        const entryResult = await runScenarioCommand(
          installation,
          targetDir,
          entryArgs,
          Boolean(scenario.entrypoint?.expectFailure)
        );
        assertTextContract(entryResult, scenario.entrypoint, `${id}: entrypoint`);

        if (scenario.dryRun) {
          const dryRun = await runScenarioCommand(installation, targetDir, scenario.dryRun.args);
          assertTextContract(dryRun, scenario.dryRun, `${id}: dry-run`);
          await assertAbsent(targetDir, scenario.dryRun.absentAfter);
        }

        if (scenario.direct) {
          const direct = await runScenarioCommand(
            installation,
            targetDir,
            scenario.direct.args,
            Boolean(scenario.direct.expectFailure)
          );
          assertTextContract(direct, scenario.direct, `${id}: direct`);
        }

        if (scenario.apply) {
          const preservedText = await readPreservedText(targetDir, scenario.apply.preserveText);
          const applied = await runScenarioCommand(installation, targetDir, scenario.apply.args);
          assertTextContract(applied, scenario.apply, `${id}: apply`);
          await assertExists(targetDir, scenario.apply.existsAfter);
          await assertPreservedText(targetDir, preservedText);
        }
      }
    );
  }
});
