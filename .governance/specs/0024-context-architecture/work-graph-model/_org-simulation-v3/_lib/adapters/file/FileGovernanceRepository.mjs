// FileGovernanceRepository.mjs — adapter file-first da runtime v3.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse, stringify } from "yaml";
import {
  expectedRepoContract,
  expectedRepoWorkClaim,
  REPO_WORK_LIFECYCLE_KEYS,
  REPO_WORK_SCHEMA,
} from "../../domain/repo-projections.mjs";
import { GOVERNANCE_ROOT, REPOS_ROOT } from "../../paths.mjs";

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => !key.startsWith("_"))
        .sort()
        .map((key) => [key, stable(value[key])])
    );
  }
  return value;
}

function digest(value) {
  return createHash("sha256")
    .update(JSON.stringify(stable(value)))
    .digest("hex")
    .slice(0, 12);
}

function readJsonl(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function safeYamlId(id) {
  const value = String(id || "");
  if (!/^[A-Za-z0-9_.-]+$/.test(value)) {
    throw new Error(`id "${value}" não é seguro para path YAML`);
  }
  return value;
}

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

  loadTriages() {
    const triageDir = path.join(this.governanceRoot, "intake", "triage");
    if (!existsSync(triageDir)) return [];
    return readdirSync(triageDir)
      .filter((file) => file.endsWith(".yml"))
      .sort()
      .map((file) => this.readGovernanceYaml(`intake/triage/${file}`));
  }

  loadRepoWorkClaims() {
    const claims = [];
    if (!existsSync(this.reposRoot)) return claims;
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
        if (doc?.schema !== REPO_WORK_SCHEMA && doc?.source?.kind !== "central-breakdown") {
          continue;
        }
        claims.push({ ...doc, _file: file, _repo: repo });
      }
    }
    return claims.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }

  loadRepoContracts() {
    const contracts = [];
    if (!existsSync(this.reposRoot)) return contracts;
    for (const entry of readdirSync(this.reposRoot, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    )) {
      if (!entry.isDirectory()) continue;
      const repo = entry.name;
      const contractsDir = path.join(this.reposRoot, repo, ".governance", "registry", "contracts");
      if (!existsSync(contractsDir)) continue;
      for (const fileName of readdirSync(contractsDir)
        .filter((file) => file.endsWith(".yml"))
        .sort()) {
        const file = path.join(contractsDir, fileName);
        contracts.push({ ...parse(readFileSync(file, "utf8")), _file: file, _repo: repo });
      }
    }
    return contracts.sort((a, b) => String(a.id).localeCompare(String(b.id)));
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
      triages: this.loadTriages(),
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
      repoWorkClaims: this.loadRepoWorkClaims(),
      repoContracts: this.loadRepoContracts(),
      outcomes: this.readGovernanceYaml("outcomes/outcomes.yml").outcomes || [],
    };
  }

  currentRevision() {
    return digest(this.loadOrg());
  }

  loadCommandHistory() {
    return readJsonl(path.join(this.governanceRoot, "events", "events.jsonl")).map(
      (event) => event.command
    );
  }

  appendEvent(event) {
    const file = path.join(this.governanceRoot, "events", "events.jsonl");
    mkdirSync(path.dirname(file), { recursive: true });
    const previous = existsSync(file) ? readFileSync(file, "utf8").trimEnd() : "";
    const next = `${previous ? previous + "\n" : ""}${JSON.stringify(event)}\n`;
    writeFileSync(file, next);
  }

  appendGovernanceList(relativePath, rootKey, item) {
    const file = path.join(this.governanceRoot, relativePath);
    const doc = parse(readFileSync(file, "utf8")) || {};
    const items = Array.isArray(doc[rootKey]) ? doc[rootKey] : [];
    if (items.some((existing) => existing.id === item.id)) {
      throw new Error(`${rootKey} já contém id "${item.id}"`);
    }
    doc[rootKey] = [...items, item];
    writeFileSync(file, stringify(doc, { lineWidth: 100 }));
    return { path: relativePath, id: item.id };
  }

  updateGovernanceListItem(relativePath, rootKey, id, patch) {
    const file = path.join(this.governanceRoot, relativePath);
    const doc = parse(readFileSync(file, "utf8")) || {};
    const items = Array.isArray(doc[rootKey]) ? doc[rootKey] : [];
    let changed = false;
    doc[rootKey] = items.map((item) => {
      if (item.id !== id) return item;
      changed = true;
      return { ...item, ...patch };
    });
    if (!changed) throw new Error(`${rootKey} não contém id "${id}"`);
    writeFileSync(file, stringify(doc, { lineWidth: 100 }));
    return { path: relativePath, id };
  }

  writeIntent(intent) {
    const relativePath = `intents/${safeYamlId(intent.id)}.yml`;
    const file = path.join(this.governanceRoot, relativePath);
    if (existsSync(file)) throw new Error(`intent "${intent.id}" já existe`);
    writeFileSync(file, stringify(intent, { lineWidth: 100 }));
    return { path: relativePath, id: intent.id };
  }

  updateIntent(intentId, patch) {
    const relativePath = `intents/${safeYamlId(intentId)}.yml`;
    const file = path.join(this.governanceRoot, relativePath);
    if (!existsSync(file)) throw new Error(`intent "${intentId}" não existe`);
    const intent = parse(readFileSync(file, "utf8")) || {};
    writeFileSync(file, stringify({ ...intent, ...patch }, { lineWidth: 100 }));
    return { path: relativePath, id: intentId };
  }

  writeTriage(triage) {
    const relativePath = `intake/triage/${safeYamlId(triage.proposal)}.yml`;
    const file = path.join(this.governanceRoot, relativePath);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, stringify(triage, { lineWidth: 100 }));
    return { path: relativePath, id: triage.proposal };
  }

  findIntentWork(intentId, workId) {
    const intent = this.loadIntents().find((item) => item.id === intentId);
    const work = (intent?.works || []).find((item) => item.id === workId);
    return { intent, work };
  }

  writeRepoWorkAck(ack) {
    const { intent, work } = this.findIntentWork(ack.intent, ack.work);
    if (!intent || !work) throw new Error(`repo-work "${ack.intent}::${ack.work}" não existe`);
    const file = path.join(
      this.reposRoot,
      work.repo,
      ".governance",
      "works",
      `${safeYamlId(intent.id)}--${safeYamlId(work.id)}.yml`
    );
    const existing = existsSync(file) ? parse(readFileSync(file, "utf8")) || {} : {};
    const claim = expectedRepoWorkClaim(intent, work);
    for (const key of REPO_WORK_LIFECYCLE_KEYS) {
      if (existing[key] !== undefined) claim[key] = existing[key];
      if (ack[key] !== undefined) claim[key] = ack[key];
    }
    claim.status = ack.status || existing.status || claim.status;
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, stringify(claim, { lineWidth: 100 }));
    return {
      path: path.relative(this.reposRoot, file).replaceAll("\\", "/"),
      id: claim.id,
    };
  }

  appendContractRevisionProposal(contractId, proposal) {
    const relativePath = "contracts/contracts.yml";
    const file = path.join(this.governanceRoot, relativePath);
    const doc = parse(readFileSync(file, "utf8")) || {};
    const contracts = Array.isArray(doc.contracts) ? doc.contracts : [];
    let updatedContract = null;
    doc.contracts = contracts.map((contract) => {
      if (contract.id !== contractId) return contract;
      updatedContract = {
        ...contract,
        "revision-proposals": [...(contract["revision-proposals"] || []), proposal],
      };
      return updatedContract;
    });
    if (!updatedContract) throw new Error(`contract "${contractId}" não existe`);
    writeFileSync(file, stringify(doc, { lineWidth: 100 }));

    const repoContract = expectedRepoContract(updatedContract);
    const registryFile = path.join(
      this.reposRoot,
      repoContract.ownerRepo,
      ".governance",
      "registry",
      "contracts",
      `${safeYamlId(repoContract.id)}.yml`
    );
    mkdirSync(path.dirname(registryFile), { recursive: true });
    writeFileSync(registryFile, stringify(repoContract, { lineWidth: 100 }));

    return {
      path: relativePath,
      id: `${contractId}::${proposal.id}`,
      registryPath: path.relative(this.reposRoot, registryFile).replaceAll("\\", "/"),
    };
  }

  applyCommand(command) {
    if (command.type === "triage.save") {
      return this.writeTriage(command.payload.triage);
    }
    if (command.type === "repo-work.ack") {
      return this.writeRepoWorkAck(command.payload.ack);
    }
    if (command.type === "contract.propose-revision") {
      return this.appendContractRevisionProposal(
        command.payload.contract,
        command.payload.proposal
      );
    }
    if (command.type === "gate.decide") {
      const gate = command.payload.gate;
      if (gate.decision === "discard") {
        return this.updateGovernanceListItem("intake/proposals.yml", "proposals", gate.proposal, {
          status: "dropped",
        });
      }
      return this.updateGovernanceListItem("intake/proposals.yml", "proposals", gate.proposal, {
        status: "active",
      });
    }
    if (command.type === "intent.activate") {
      const write = this.writeIntent(command.payload.intent);
      if (command.payload.proposal) {
        this.updateGovernanceListItem(
          "intake/proposals.yml",
          "proposals",
          command.payload.proposal,
          {
            status: "closed",
          }
        );
      }
      return write;
    }
    if (command.type === "breakdown.apply") {
      return this.updateIntent(command.payload.breakdown.intent, {
        works: command.payload.breakdown.works,
      });
    }
    if (command.type === "proposal.create") {
      return this.appendGovernanceList(
        "intake/proposals.yml",
        "proposals",
        command.payload.proposal
      );
    }
    if (command.type === "outcome.publish") {
      return this.appendGovernanceList(
        "outcomes/outcomes.yml",
        "outcomes",
        command.payload.outcome
      );
    }
    if (command.type === "read-model.rebuild") {
      return { path: null, id: command.id };
    }
    throw new Error(`command.type "${command.type}" sem writer no FileGovernanceRepository`);
  }
}
