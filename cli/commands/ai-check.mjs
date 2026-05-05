import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { runQualityGates } from "../governance/quality-gates/engine.mjs";

async function checkTokenLint(cwd, files) {
  const violations = [];

  // 1. Ausência de ignore files
  let hasIgnore = false;
  const ignores = [".geminiignore", ".claudeignore", ".gitignore", ".cursorignore"];
  for (const file of ignores) {
    try {
      await fs.access(path.join(cwd, file));
      hasIgnore = true;
      break;
    } catch {}
  }

  if (!hasIgnore) {
    violations.push({
      ruleId: "TOKEN-LINT-01",
      file: cwd,
      message: "Ausência de arquivos de ignore (.geminiignore, .claudeignore, etc)",
    });
  }

  // 2. Presença de node_modules
  try {
    await fs.access(path.join(cwd, "node_modules"));
    violations.push({
      ruleId: "TOKEN-LINT-02",
      file: path.join(cwd, "node_modules"),
      message: "Presença de node_modules detectada. Certifique-se de que está ignorado.",
    });
  } catch {}

  // 3. Arquivos > 2k linhas
  for (const file of files) {
    try {
      const content = await fs.readFile(file, "utf-8");
      const lines = content.split("\n").length;
      if (lines > 2000) {
        violations.push({
          ruleId: "TOKEN-LINT-03",
          file,
          message: `Arquivo excede o limite de tokens (> 2k linhas): ${lines} linhas`,
        });
      }
    } catch {
      // Ignorar erros de leitura
    }
  }

  return violations;
}

async function walkDir(dir, fileList = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const res = path.resolve(dir, entry.name);
      if (entry.isDirectory()) {
        await walkDir(res, fileList);
      } else {
        fileList.push(res);
      }
    }
  } catch (err) {
    // fallback if dir unreadable
  }
  return fileList;
}

export async function runAiCheck(cwd) {
  const files = await walkDir(cwd);

  const catalogPath = path.join(cwd, ".core", "rules", "_meta", "rules.json");

  let qgViolations = [];
  try {
    const result = await runQualityGates(files, catalogPath);
    qgViolations = result.violations;
  } catch (err) {
    // If catalog not found or other error, return empty for QG but print warn
    console.warn(`[WARN] Quality Gates bypassed: ${err.message}`);
  }

  const tlViolations = await checkTokenLint(cwd, files);

  const allViolations = [...qgViolations, ...tlViolations];

  const grouped = {};
  for (const v of allViolations) {
    const key = v.ruleId || "UNKNOWN";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(v);
  }

  return grouped;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cwd = process.cwd();
  runAiCheck(cwd)
    .then((grouped) => {
      console.log("=== AI Governance Check ===");
      const ruleIds = Object.keys(grouped);
      if (ruleIds.length === 0) {
        console.log("✅ Nenhuma violação detectada.");
        process.exit(0);
      }

      for (const ruleId of ruleIds) {
        console.log(`\n🔴 Regra: ${ruleId}`);
        for (const v of grouped[ruleId]) {
          console.log(`   - ${path.relative(cwd, v.file)}: ${v.message}`);
        }
      }
      console.log("\n⚠️  Este comando não falha o build (warnings only).");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Erro interno no ai-check:", err);
      process.exit(0); // non-blocking
    });
}
