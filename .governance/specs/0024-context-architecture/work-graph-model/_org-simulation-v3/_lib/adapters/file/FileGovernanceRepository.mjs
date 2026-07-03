// FileGovernanceRepository.mjs — adapter file-first da runtime v3.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { GOVERNANCE_ROOT, REPOS_ROOT } from "../../paths.mjs";

export class FileGovernanceRepository {
  constructor({ governanceRoot = GOVERNANCE_ROOT, reposRoot = REPOS_ROOT } = {}) {
    this.governanceRoot = governanceRoot;
    this.reposRoot = reposRoot;
  }

  readGovernanceYaml(relativePath) {
    return parse(readFileSync(path.join(this.governanceRoot, relativePath), "utf8"));
  }

  readOptionalGovernanceYaml(relativePath, fallback) {
    const file = path.join(this.governanceRoot, relativePath);
    return existsSync(file) ? this.readGovernanceYaml(relativePath) : fallback;
  }

  loadRepoStandaloneWorks() {
    const out = [];
    if (!existsSync(this.reposRoot)) return out;
    for (const entry of readdirSync(this.reposRoot, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    )) {
      if (!entry.isDirectory()) continue;
      const repo = entry.name;
      const worksDir = path.join(this.reposRoot, repo, ".governance", "works");
      if (!existsSync(worksDir)) continue;
      for (const fileName of readdirSync(worksDir)
        .filter((file) => file.endsWith(".yml"))
        .sort()) {
        const file = path.join(worksDir, fileName);
        const doc = parse(readFileSync(file, "utf8"));
        if (doc?.schema !== "acme.standalone-work/v1" && doc?.source?.kind !== "standalone") {
          continue;
        }
        out.push({ ...doc, _file: file, _repo: repo });
      }
    }
    return out.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }

  loadIntents() {
    return readdirSync(path.join(this.governanceRoot, "intents"))
      .filter((file) => file.endsWith(".yml"))
      .sort()
      .map((file) => this.readGovernanceYaml("intents/" + file));
  }

  loadOrg() {
    return {
      org: this.readGovernanceYaml("org.yml"),
      authorities: this.readGovernanceYaml("authorities.yml").authorities,
      objectives: this.readGovernanceYaml("business/objectives.yml").objectives,
      areas: this.readGovernanceYaml("business/areas.yml").areas,
      teams: this.readGovernanceYaml("business/teams.yml").teams,
      theses: this.readGovernanceYaml("business/theses.yml").theses,
      metrics: this.readGovernanceYaml("business/metrics.yml").metrics,
      targets: this.readGovernanceYaml("business/targets.yml").targets,
      repos: this.readGovernanceYaml("repos.yml").repos,
      contracts: this.readGovernanceYaml("contracts/contracts.yml").contracts,
      proposals: this.readGovernanceYaml("intake/proposals.yml").proposals,
      incidents: this.readOptionalGovernanceYaml("incidents/incidents.yml", {
        incidents: [],
      }).incidents,
      policy: this.readOptionalGovernanceYaml("trust-policy.yml", {
        "access-requests": [],
        "authority-revocations": [],
        "secret-quarantine": [],
      }),
      intents: this.loadIntents(),
      standalone: this.loadRepoStandaloneWorks(),
      outcomes: this.readGovernanceYaml("outcomes/outcomes.yml").outcomes || [],
    };
  }
}
