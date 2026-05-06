import fs from "fs/promises";
import { tagDetectors } from "./detectors.mjs";

export async function loadRules(catalogPath) {
  try {
    const raw = await fs.readFile(catalogPath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to load rules catalog from ${catalogPath}: ${error.message}`);
  }
}

export function buildRuleDetectorsMap(catalog) {
  const map = [];
  if (!catalog || !catalog.rules) return map;

  for (const rule of catalog.rules) {
    if (!rule.tags) continue;
    for (const tag of rule.tags) {
      if (tagDetectors[tag]) {
        map.push({
          ruleId: rule.id,
          detector: tagDetectors[tag],
        });
      }
    }
  }
  return map;
}

export async function runQualityGates(files, catalogPath) {
  const catalog = await loadRules(catalogPath);
  const ruleDetectors = buildRuleDetectorsMap(catalog);

  const violations = [];

  for (const file of files) {
    let content;
    try {
      content = await fs.readFile(file, "utf-8");
    } catch (err) {
      continue; // Skip files that cannot be read
    }

    for (const { ruleId, detector } of ruleDetectors) {
      const message = detector(content);
      if (message) {
        violations.push({ ruleId, file, message });
      }
    }
  }

  return { violations };
}
