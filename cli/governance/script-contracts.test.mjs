import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import YAML from "yaml";
import { check, sync, validateContract } from "./script-contracts.mjs";

function tempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "script-contracts-"));
  fs.mkdirSync(path.join(dir, ".core", "governance"), { recursive: true });
  fs.mkdirSync(path.join(dir, ".core", "rules", "top"), { recursive: true });
  fs.writeFileSync(path.join(dir, "AGENTS.md"), "sem cadeia antiga\n");
  fs.writeFileSync(
    path.join(dir, ".core", "rules", "top", "agents-core.md"),
    "sem cadeia antiga\n"
  );
  fs.writeFileSync(path.join(dir, "CONTRIBUTING.md"), "sem cadeia antiga\n");
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ name: "tmp", scripts: { stale: "echo stale" } }, null, 2) + "\n"
  );
  return dir;
}

function writeContract(repoRoot, overrides = {}) {
  const contract = {
    schema_version: 1,
    profiles: {
      maintainer: {
        package_scripts: [
          {
            name: "format",
            command: "prettier --write .",
            category: "format",
            mutates: true,
            consumers: ["human"],
            description: "Formata.",
          },
          {
            name: "validate",
            command: "yarn format",
            category: "aggregate",
            mutates: false,
            consumers: ["hook"],
            description: "Valida.",
          },
        ],
        hooks: {
          "pre-commit": { steps: [{ run: "format" }] },
          "pre-push": { steps: [{ run: "validate" }] },
        },
        workflows: [
          { file: ".github/workflows/repo-validation.yml", required_runs: ["yarn validate"] },
        ],
        docs: {
          generated_file: "docs/scripts.md",
          rule_sources: ["AGENTS.md", ".core/rules/top/agents-core.md", "CONTRIBUTING.md"],
          forbidden_phrases: ["cadeia proibida"],
        },
        hook_bootstrap: {
          node_path: "nvm",
        },
      },
      consumer: {
        package_scripts: [
          { name: "format", command: "prettier --write .", description: "Formata." },
          { name: "check", command: "prettier --check .", description: "Checa." },
        ],
        dev_dependencies: { prettier: "^3.0.0" },
        hooks: {
          "pre-commit": "{{package_manager_runner}} {{format_command}}",
          "pre-push": "{{package_manager_runner}} {{check_command}}",
        },
        workflow: {
          name: "{{ci_workflow_name}}",
          node_version: "{{node_version}}",
          install_command: "{{install_command}}",
          check_command: "{{check_command}}",
        },
      },
    },
    ...overrides,
  };
  fs.writeFileSync(
    path.join(repoRoot, ".core", "governance", "script-contracts.yml"),
    YAML.stringify(contract)
  );
  return contract;
}

test("DADO contrato valido QUANDO sync roda ENTÃO package.json, hooks, templates e docs sao projetados", () => {
  const repoRoot = tempRepo();
  writeContract(repoRoot);

  const written = sync(repoRoot);

  assert.ok(written.includes("package.json"));
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")).scripts.validate,
    "yarn format"
  );
  assert.equal(
    fs
      .readFileSync(path.join(repoRoot, ".husky", "pre-push"), "utf8")
      .includes("node .yarn/releases/yarn-4.1.1.cjs validate"),
    true
  );
  assert.match(fs.readFileSync(path.join(repoRoot, ".husky", "pre-push"), "utf8"), /nvm\.sh/);
  assert.match(
    fs.readFileSync(path.join(repoRoot, "docs", "scripts.md"), "utf8"),
    /script-contracts.yml/
  );
  assert.deepEqual(check(repoRoot), []);
});

test("DADO package.json alterado manualmente QUANDO check roda ENTÃO reporta drift", () => {
  const repoRoot = tempRepo();
  writeContract(repoRoot);
  sync(repoRoot);
  const pkgPath = path.join(repoRoot, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.scripts.validate = "echo bypass";
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  assert.match(check(repoRoot).join("\n"), /package\.json diverge/);
});

test("DADO hook com script inexistente QUANDO valida contrato ENTÃO retorna violacao", () => {
  const repoRoot = tempRepo();
  const contract = writeContract(repoRoot);
  contract.profiles.maintainer.hooks["pre-commit"].steps = [{ run: "missing" }];

  assert.match(validateContract(contract).join("\n"), /script inexistente: missing/);
});

test("DADO frase operacional antiga em fonte de regra QUANDO check roda ENTÃO reporta frase proibida", () => {
  const repoRoot = tempRepo();
  writeContract(repoRoot);
  sync(repoRoot);
  fs.writeFileSync(path.join(repoRoot, "AGENTS.md"), "cadeia proibida\n");

  assert.match(check(repoRoot).join("\n"), /AGENTS\.md contem frase proibida/);
});
