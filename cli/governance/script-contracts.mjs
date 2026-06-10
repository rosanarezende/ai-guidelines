#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, "..", "..");
const CONTRACT_PATH = ".core/governance/script-contracts.yml";

function repoPath(repoRoot, relativePath) {
  return path.join(repoRoot, relativePath);
}

function readText(repoRoot, relativePath) {
  return fs.readFileSync(repoPath(repoRoot, relativePath), "utf8");
}

function writeText(repoRoot, relativePath, content, mode) {
  const target = repoPath(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  if (mode) fs.chmodSync(target, mode);
}

function parseContract(repoRoot = REPO_ROOT) {
  const contract = YAML.parse(readText(repoRoot, CONTRACT_PATH));
  if (contract?.schema_version !== 1) {
    throw new Error("script-contracts.yml deve declarar schema_version: 1");
  }
  return contract;
}

function maintainerScripts(contract) {
  return contract.profiles.maintainer.package_scripts;
}

function scriptNames(contract) {
  return new Set(maintainerScripts(contract).map((script) => script.name));
}

function sortedJson(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function generatePackageJson(repoRoot, contract) {
  const current = JSON.parse(readText(repoRoot, "package.json"));
  const scripts = {};
  for (const script of maintainerScripts(contract)) {
    scripts[script.name] = script.command;
  }
  return sortedJson({ ...current, scripts });
}

function renderHook(contract, hookName) {
  const hook = contract.profiles.maintainer.hooks[hookName];
  const lines = [];
  if (contract.profiles.maintainer.hook_bootstrap?.node_path === "nvm") {
    lines.push(
      "#!/bin/sh",
      "",
      "if ! command -v node >/dev/null 2>&1; then",
      '  export NVM_DIR="${NVM_DIR:-${HOME:-}/.nvm}"',
      '  if [ -s "$NVM_DIR/nvm.sh" ]; then',
      '    . "$NVM_DIR/nvm.sh"',
      '    if [ -f ".nvmrc" ]; then',
      "      nvm use --silent >/dev/null 2>&1 || true",
      "    else",
      "      nvm use --silent default >/dev/null 2>&1 || true",
      "    fi",
      "  fi",
      "fi",
      "",
      "if ! command -v node >/dev/null 2>&1; then",
      '  echo "ai-guidelines hook: node não encontrado no PATH e nvm não pôde ser carregado." >&2',
      '  echo "Restaure o ambiente (ex.: nvm install && nvm use) e rode npm run setup; não use --no-verify." >&2',
      "  exit 127",
      "fi",
      ""
    );
  }
  for (const step of hook.steps) {
    if (step.run) {
      lines.push(`npm run ${step.run}`);
    } else if (step.git_add) {
      lines.push(`git add ${step.git_add.join(" ")}`);
    } else {
      throw new Error(`Passo invalido em hook ${hookName}`);
    }
  }
  return lines.join("\n") + "\n";
}

function consumerPackageFragment(contract) {
  const consumer = contract.profiles.consumer;
  const scripts = {};
  for (const script of consumer.package_scripts) {
    scripts[script.name] = script.command;
  }
  return sortedJson({
    scripts,
    devDependencies: consumer.dev_dependencies,
  });
}

function consumerWorkflowTemplate() {
  return `name: {{ci_workflow_name}}

on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main

jobs:
  ai-guidelines-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "{{node_version}}"

      - name: Enable Corepack
        run: corepack enable

      - name: Install dependencies
        run: {{install_command}}

      - name: Validate AI-first baseline
        run: {{check_command}}
`;
}

function categoryLabel(category) {
  const labels = {
    setup: "Setup inicial / build",
    build: "Setup inicial / build",
    format: "Format",
    test: "Tests",
    docs: "Living docs",
    governance: "Guards de governanca",
    aggregate: "Aggregate (gates)",
    cli: "CLI (dogfooding)",
    lifecycle: "Lifecycle npm",
  };
  return labels[category] ?? category;
}

function mutatesLabel(mutates) {
  return mutates ? "sim" : "nao";
}

function consumersLabel(consumers = []) {
  return consumers.map((consumer) => `\`${consumer}\``).join(", ");
}

function markdownTable(headers, rows, alignments = []) {
  const widths = headers.map((header, index) =>
    Math.max(
      header.length,
      ...rows.map((row) => String(row[index]).length),
      alignments[index] === "center" ? 3 : 2
    )
  );
  const pad = (value, index) => {
    const text = String(value);
    if (alignments[index] === "center") {
      const total = widths[index] - text.length;
      const left = Math.floor(total / 2);
      const right = total - left;
      return `${" ".repeat(left)}${text}${" ".repeat(right)}`;
    }
    return text.padEnd(widths[index], " ");
  };
  const separator = widths.map((width, index) => {
    if (alignments[index] === "center") {
      return `:${"-".repeat(Math.max(width - 2, 1))}:`;
    }
    return `:${"-".repeat(Math.max(width - 1, 1))}`;
  });
  const renderRow = (row) => `| ${row.map((cell, index) => pad(cell, index)).join(" | ")} |`;
  return [renderRow(headers), renderRow(separator), ...rows.map(renderRow)].join("\n");
}

function scriptTable(contract) {
  const rows = maintainerScripts(contract).map((script) => [
    `\`${script.name}\``,
    `\`${script.command}\``,
    categoryLabel(script.category),
    mutatesLabel(script.mutates),
    consumersLabel(script.consumers),
    script.description,
  ]);
  return markdownTable(
    ["Script", "Comando", "Categoria", "Modifica arquivos?", "Consumidores", "Descricao"],
    rows,
    ["left", "left", "left", "center", "left", "left"]
  );
}

function categoryTable(contract) {
  const groups = new Map();
  for (const script of maintainerScripts(contract)) {
    const label = categoryLabel(script.category);
    const current = groups.get(label) ?? [];
    current.push(`\`${script.name}\``);
    groups.set(label, current);
  }
  return markdownTable(
    ["Intencao", "Scripts"],
    [...groups.entries()].map(([label, scripts]) => [label, scripts.join(", ")])
  );
}

function hookBlock(contract, hookName) {
  return `### \`${hookName}\`\n\n\`\`\`bash\n${renderHook(contract, hookName)}\`\`\``;
}

function workflowTable(contract) {
  return markdownTable(
    ["Workflow", "Runs contratados"],
    contract.profiles.maintainer.workflows.map((workflow) => [
      `\`${workflow.file}\``,
      workflow.required_runs.map((run) => `\`${run}\``).join("<br>"),
    ])
  );
}

function docsScripts(contract) {
  return `# Scripts canonicos do \`ai-guidelines\`

> Arquivo gerado por \`.core/governance/script-contracts.yml\`.
> Nao edite manualmente: rode \`npm run script-contracts:sync\`.

Este documento e a referencia humana do contrato operacional que tambem projeta
\`package.json#scripts\`, \`.husky/*\` e templates de consumidores, alem de
verificar os comandos obrigatorios em workflows reais. O check
\`npm run script-contracts:check\` falha quando alguma projecao diverge ou workflow
perde um run contratado.

## Visao por categoria

${categoryTable(contract)}

## Tabela completa

${scriptTable(contract)}

## Hooks de git

Os hooks versionados em \`.husky/\` sao projecoes do contrato. Eles devem estar
instalados no clone local via \`npm run setup\` ou \`npm run prepare\`. Se um agente
perceber que hooks nao estao instalados, deve parar e restaurar o setup; nao deve
usar \`--no-verify\` nem inventar uma cadeia manual paralela.

${hookBlock(contract, "pre-commit")}

${hookBlock(contract, "pre-push")}

## Workflows de CI

${workflowTable(contract)}

## Contrato de commit

O metodo operacional interno e: scripts declarados em
\`.core/governance/script-contracts.yml\` projetam hooks e docs; o \`pre-commit\`
executa sincronizacao, build e testes rapidos; o \`pre-push\` executa
\`npm run validate\`; e o CI acrescenta a varredura historica quando aplicavel.

Antes de commitar, nao existe mais uma cadeia textual duplicada para copiar. A
regra e garantir que os hooks estejam instalados e deixar o contrato rodar. Para
checagem manual ou diagnostico, use:

\`\`\`bash
npm run script-contracts:sync
npm run validate
\`\`\`

## Consumidores

O baseline de consumidor tambem e projetado daqui:

- \`.core/templates/package.json.fragment.json\`
- \`.core/templates/.husky/pre-commit.tmpl\`
- \`.core/templates/.husky/pre-push.tmpl\`
- \`.core/templates/.github/workflows/ai-guidelines-ci.yml.tmpl\`
`;
}

export function generateProjections(repoRoot = REPO_ROOT, contract = parseContract(repoRoot)) {
  const consumer = contract.profiles.consumer;
  return new Map([
    ["package.json", generatePackageJson(repoRoot, contract)],
    [".husky/pre-commit", renderHook(contract, "pre-commit")],
    [".husky/pre-push", renderHook(contract, "pre-push")],
    [".core/templates/package.json.fragment.json", consumerPackageFragment(contract)],
    [".core/templates/.husky/pre-commit.tmpl", consumer.hooks["pre-commit"] + "\n"],
    [".core/templates/.husky/pre-push.tmpl", consumer.hooks["pre-push"] + "\n"],
    [".core/templates/.github/workflows/ai-guidelines-ci.yml.tmpl", consumerWorkflowTemplate()],
    [contract.profiles.maintainer.docs.generated_file, docsScripts(contract)],
  ]);
}

export function validateContract(contract) {
  const violations = [];
  const names = scriptNames(contract);
  const bootstrap = contract.profiles.maintainer.hook_bootstrap;

  if (bootstrap && bootstrap.node_path !== "nvm") {
    violations.push(`hook_bootstrap.node_path invalido: ${bootstrap.node_path}`);
  }

  for (const [hookName, hook] of Object.entries(contract.profiles.maintainer.hooks)) {
    for (const step of hook.steps) {
      if (step.run && !names.has(step.run)) {
        violations.push(`hook ${hookName} referencia script inexistente: ${step.run}`);
      }
    }
  }

  for (const script of maintainerScripts(contract)) {
    // `npm run <script>` referencia outro script do contrato; `npm ci`/`npm
    // install` etc. são builtins do npm e não passam por aqui.
    const matches = script.command.matchAll(/\bnpm run\s+([a-zA-Z0-9:_-]+)/g);
    for (const match of matches) {
      if (!names.has(match[1])) {
        violations.push(`script ${script.name} referencia script inexistente: ${match[1]}`);
      }
    }
  }

  return violations;
}

function validateForbiddenPhrases(repoRoot, contract) {
  const violations = [];
  const { rule_sources: ruleSources, forbidden_phrases: forbiddenPhrases } =
    contract.profiles.maintainer.docs;
  for (const source of ruleSources) {
    const content = readText(repoRoot, source);
    for (const phrase of forbiddenPhrases) {
      if (content.includes(phrase)) {
        violations.push(`${source} contem frase proibida: ${phrase}`);
      }
    }
  }
  return violations;
}

function countIndent(line) {
  const match = line.match(/^\s*/);
  return match ? match[0].length : 0;
}

function unquoteYamlScalar(value) {
  const text = value.trim();
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
}

function runLineMatchesRequiredRun(line, requiredRun) {
  const text = unquoteYamlScalar(line);
  if (!text || text.startsWith("#")) return false;
  return (
    text === requiredRun ||
    text.startsWith(`${requiredRun} &&`) ||
    text.startsWith(`${requiredRun} ||`) ||
    text.startsWith(`${requiredRun};`)
  );
}

function workflowDeclaresRun(content, requiredRun) {
  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(/^(\s*)(?:-\s*)?run:\s*(.*)$/);
    if (!match) continue;

    const indent = match[1].length;
    const runValue = match[2].trim();
    if (!runValue) continue;

    if (/^[|>]/.test(runValue)) {
      for (let blockIndex = index + 1; blockIndex < lines.length; blockIndex += 1) {
        const blockLine = lines[blockIndex];
        if (blockLine.trim() && countIndent(blockLine) <= indent) break;
        if (runLineMatchesRequiredRun(blockLine.trim(), requiredRun)) return true;
      }
      continue;
    }

    if (runLineMatchesRequiredRun(runValue, requiredRun)) return true;
  }

  return false;
}

function validateWorkflowRuns(repoRoot, contract) {
  const violations = [];
  const workflows = contract.profiles.maintainer.workflows ?? [];

  for (const workflow of workflows) {
    const workflowPath = workflow.file;
    const absolutePath = repoPath(repoRoot, workflowPath);
    if (!fs.existsSync(absolutePath)) {
      violations.push(`workflow ${workflowPath} nao existe`);
      continue;
    }

    const content = readText(repoRoot, workflowPath);
    for (const requiredRun of workflow.required_runs ?? []) {
      if (!workflowDeclaresRun(content, requiredRun)) {
        violations.push(`workflow ${workflowPath} nao contem run contratado: ${requiredRun}`);
      }
    }
  }

  return violations;
}

export function check(repoRoot = REPO_ROOT) {
  const contract = parseContract(repoRoot);
  const violations = [
    ...validateContract(contract),
    ...validateForbiddenPhrases(repoRoot, contract),
    ...validateWorkflowRuns(repoRoot, contract),
  ];
  for (const [relativePath, expected] of generateProjections(repoRoot, contract)) {
    const actual = fs.existsSync(repoPath(repoRoot, relativePath))
      ? readText(repoRoot, relativePath)
      : null;
    if (actual !== expected) {
      violations.push(
        `${relativePath} diverge de ${CONTRACT_PATH}; rode yarn script-contracts:sync`
      );
    }
  }
  return violations;
}

export function sync(repoRoot = REPO_ROOT) {
  const contract = parseContract(repoRoot);
  const projections = generateProjections(repoRoot, contract);
  for (const [relativePath, content] of projections) {
    const mode = relativePath.startsWith(".husky/") ? 0o755 : undefined;
    writeText(repoRoot, relativePath, content, mode);
  }
  return [...projections.keys()];
}

export async function main(argv = [], repoRoot = REPO_ROOT) {
  const command = argv[0] ?? "check";
  if (command === "sync") {
    const written = sync(repoRoot);
    process.stdout.write(
      `✅ script-contracts:sync — ${written.length} projecao(oes) sincronizada(s).\n`
    );
    return 0;
  }
  if (command === "check") {
    const violations = check(repoRoot);
    if (violations.length > 0) {
      process.stderr.write(
        "❌ script-contracts:check encontrou drift operacional:\n" +
          violations.map((violation) => `  - ${violation}`).join("\n") +
          "\n"
      );
      return 1;
    }
    process.stdout.write(
      "✅ script-contracts:check — scripts/hooks/docs/templates sincronizados; workflows verificados.\n"
    );
    return 0;
  }
  process.stderr.write("Uso: node cli/script-contracts.mjs [check|sync]\n");
  return 2;
}

const isCli = (() => {
  try {
    return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();

if (isCli) {
  process.exit(await main(process.argv.slice(2)));
}
