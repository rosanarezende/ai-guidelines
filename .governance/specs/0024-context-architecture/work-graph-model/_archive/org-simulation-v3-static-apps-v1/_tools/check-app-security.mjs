// check-app-security.mjs — bloco N da F5. Apps de decisão não carregam CDN em runtime:
// dependências UMD são vendorizadas, versionadas e conferidas por hash.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const apps = path.join(here, "..", "_apps");
const vendor = path.join(apps, "vendor");

const sha256 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

export function checkAppSecurity() {
  const issues = [];
  const manifest = JSON.parse(readFileSync(path.join(vendor, "manifest.json"), "utf8"));
  for (const f of manifest.files || []) {
    const actual = sha256(path.join(vendor, f.file));
    if (actual !== f.sha256)
      issues.push({
        rule: "vendor-hash",
        file: `vendor/${f.file}`,
        msg: `sha256 ${actual} != manifest ${f.sha256}`,
      });
  }
  for (const rel of ["owner/index.html", "company/index.html"]) {
    const body = readFileSync(path.join(apps, rel), "utf8");
    if (/https?:\/\//i.test(body))
      issues.push({ rule: "cdn-runtime", file: rel, msg: "HTML carrega http(s) em runtime" });
    if (!/Content-Security-Policy/i.test(body))
      issues.push({ rule: "csp", file: rel, msg: "HTML sem Content-Security-Policy" });
    if (!/connect-src 'none'/.test(body))
      issues.push({ rule: "csp", file: rel, msg: "CSP não bloqueia connect-src" });
  }
  return issues;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const issues = checkAppSecurity();
  for (const i of issues) console.log(`✗ [${i.rule}] ${i.file} — ${i.msg}`);
  if (issues.length === 0) console.log("✓ app-security — vendors locais + hashes + CSP ok");
  process.exit(issues.length ? 1 : 0);
}
