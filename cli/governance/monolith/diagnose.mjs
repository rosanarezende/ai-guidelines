import { parseRuleFile, validateRule } from "./rules-parser.mjs";

// Test 1: Simple YAML parsing
console.log("\n=== Test 1: Simple YAML ===");
const content1 = `#### [GR-0001] Test

\`\`\`yaml
id: GR-0001
scope: universal
category: correctness
evidence_strength: strong
sources:
  - "CWE-1"
applicable_languages: []
tags: []
\`\`\``;

const result1 = parseRuleFile("test.md", content1);
console.log("Rules found:", result1.rules.length);
console.log("Errors:", result1.errors);
if (result1.rules[0]) {
  console.log("Rule:", result1.rules[0]);
}

// Test 2: Array inline
console.log("\n=== Test 2: Array inline ===");
const content2 = `#### [GR-0002] Test

\`\`\`yaml
id: GR-0002
scope: universal
category: correctness
evidence_strength: strong
sources: ["CWE-1", "CWE-2"]
applicable_languages: []
tags: []
\`\`\``;

const result2 = parseRuleFile("test.md", content2);
console.log("Rules found:", result2.rules.length);
console.log("Sources:", result2.rules[0]?.sources);

// Test 3: Invalid evidence_strength
console.log("\n=== Test 3: Invalid evidence_strength ===");
const rule3 = {
  id: "GR-0003",
  scope: "universal",
  category: "correctness",
  evidence_strength: "INVALID",
  sources: ["CWE-1"],
  applicable_languages: [],
  tags: [],
};
const validation3 = validateRule(rule3);
console.log("Valid:", validation3.valid);
console.log("Errors:", validation3.errors);
