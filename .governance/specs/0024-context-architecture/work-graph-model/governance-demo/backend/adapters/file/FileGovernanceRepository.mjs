// FileGovernanceRepository.mjs — adapter file-first da runtime v3.
import { createHash, randomUUID } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
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

function readJson(file, fallback = null) {
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, "utf8"));
}

function writeTextAtomic(file, content) {
  mkdirSync(path.dirname(file), { recursive: true });
  const temp = path.join(
    path.dirname(file),
    `.${path.basename(file)}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`
  );
  try {
    writeFileSync(temp, content, { encoding: "utf8", flag: "wx" });
    renameSync(temp, file);
  } catch (error) {
    rmSync(temp, { force: true });
    throw error;
  }
}

function writeYamlAtomic(file, doc) {
  writeTextAtomic(file, stringify(doc, { lineWidth: 100 }));
}

function writeJsonAtomic(file, doc) {
  writeTextAtomic(file, `${JSON.stringify(doc, null, 2)}\n`);
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

  runtimeRoot() {
    return path.join(this.governanceRoot, ".runtime");
  }

  lockDir() {
    return path.join(this.runtimeRoot(), "command.lock");
  }

  transactionDir() {
    return path.join(this.runtimeRoot(), "transactions");
  }

  acquireCommandLock({ owner = "unknown", ttlMs = 30_000 } = {}) {
    mkdirSync(this.runtimeRoot(), { recursive: true });
    const lockDir = this.lockDir();
    const now = Date.now();
    try {
      mkdirSync(lockDir);
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      const current = readJson(path.join(lockDir, "lock.json"), {});
      const expiresAt = Date.parse(current?.expiresAt || "");
      if (Number.isFinite(expiresAt) && expiresAt < now) {
        rmSync(lockDir, { recursive: true, force: true });
        mkdirSync(lockDir);
      } else {
        throw new Error(
          `command lock ativo por "${current?.owner || "unknown"}" até ${current?.expiresAt || "unknown"}`
        );
      }
    }
    const token = randomUUID();
    const acquiredAt = new Date(now).toISOString();
    writeJsonAtomic(path.join(lockDir, "lock.json"), {
      schema: "acme.file-command-lock/v1",
      owner,
      token,
      acquiredAt,
      expiresAt: new Date(now + ttlMs).toISOString(),
    });
    return { dir: lockDir, token, owner };
  }

  releaseCommandLock(lock) {
    const lockFile = path.join(lock.dir, "lock.json");
    const current = readJson(lockFile, {});
    if (current?.token && current.token !== lock.token) {
      throw new Error(`command lock mudou de dono; esperado token ${lock.token}`);
    }
    rmSync(lock.dir, { recursive: true, force: true });
  }

  withCommandLock(command, fn, options = {}) {
    const lock = this.acquireCommandLock({
      owner: command?.id || command?.type || "unknown-command",
      ttlMs: options.lockTtlMs,
    });
    try {
      return fn();
    } finally {
      this.releaseCommandLock(lock);
    }
  }

  listRuntimeIssues() {
    const issues = [];
    const lockFile = path.join(this.lockDir(), "lock.json");
    if (existsSync(lockFile)) {
      const lock = readJson(lockFile, {});
      issues.push({
        level: "error",
        rule: "file-command-lock-present",
        node: lock.owner || "command.lock",
        msg: `lock de comando presente em .runtime; owner=${lock.owner || "unknown"} expiresAt=${lock.expiresAt || "unknown"}`,
      });
    }
    for (const transaction of this.listPendingTransactions()) {
      issues.push({
        level: "error",
        rule: "file-transaction-pending",
        node: transaction.id || "transaction",
        msg: `transação file-first pendente (${transaction.status || "unknown"}) precisa de recovery antes de novas mutações`,
      });
    }
    return issues;
  }

  listPendingTransactions() {
    const dir = this.transactionDir();
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map((file) => ({ ...readJson(path.join(dir, file), {}), _file: path.join(dir, file) }));
  }

  assertNoPendingTransactions() {
    const pending = this.listPendingTransactions();
    if (pending.length) {
      const first = pending[0];
      throw new Error(
        `file transaction pendente "${first.id || path.basename(first._file)}" (${first.status || "unknown"}); recovery obrigatório antes de nova mutação`
      );
    }
  }

  beginTransaction(command, previousRevision) {
    mkdirSync(this.transactionDir(), { recursive: true });
    const id = safeYamlId(command.id || `${command.type}-${Date.now()}`);
    const file = path.join(this.transactionDir(), `${id}.json`);
    if (existsSync(file)) throw new Error(`transação "${id}" já existe`);
    const transaction = {
      schema: "acme.file-transaction/v1",
      id,
      status: "applying",
      startedAt: new Date().toISOString(),
      previousRevision,
      command: {
        id: command.id,
        type: command.type,
        envelope: command.envelope,
      },
    };
    writeJsonAtomic(file, transaction);
    return { id, file };
  }

  updateTransaction(transaction, patch) {
    const current = readJson(transaction.file, {});
    writeJsonAtomic(transaction.file, {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  }

  markTransactionApplied(transaction, write, newRevision) {
    this.updateTransaction(transaction, {
      status: "applied-pending-event",
      write,
      newRevision,
    });
  }

  markTransactionFailed(transaction, error, revisionAfterError) {
    this.updateTransaction(transaction, {
      status: "failed",
      error: String(error?.message || error),
      revisionAfterError,
    });
  }

  abortTransaction(transaction) {
    unlinkSync(transaction.file);
  }

  commitTransaction(transaction, event) {
    this.appendEvent(event);
    unlinkSync(transaction.file);
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
        "break-glass": [],
      }),
      intents: this.loadIntents(),
      verdicts: this.readOptionalGovernanceYaml("decisions/verdicts.yml", {
        verdicts: [],
      }).verdicts,
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
    appendFileSync(file, `${JSON.stringify(event)}\n`, "utf8");
  }

  appendGovernanceList(relativePath, rootKey, item) {
    const file = path.join(this.governanceRoot, relativePath);
    const doc = parse(readFileSync(file, "utf8")) || {};
    const items = Array.isArray(doc[rootKey]) ? doc[rootKey] : [];
    if (items.some((existing) => existing.id === item.id)) {
      throw new Error(`${rootKey} já contém id "${item.id}"`);
    }
    doc[rootKey] = [...items, item];
    writeYamlAtomic(file, doc);
    return { path: relativePath, id: item.id };
  }

  appendOptionalGovernanceList(relativePath, rootKey, item) {
    const file = path.join(this.governanceRoot, relativePath);
    mkdirSync(path.dirname(file), { recursive: true });
    const doc = existsSync(file) ? parse(readFileSync(file, "utf8")) || {} : {};
    const items = Array.isArray(doc[rootKey]) ? doc[rootKey] : [];
    if (items.some((existing) => existing.id === item.id)) {
      throw new Error(`${rootKey} já contém id "${item.id}"`);
    }
    doc[rootKey] = [...items, item];
    writeYamlAtomic(file, doc);
    return { path: relativePath, id: item.id };
  }

  appendPolicyList(rootKey, item) {
    const relativePath = "trust-policy.yml";
    const file = path.join(this.governanceRoot, relativePath);
    const doc = existsSync(file) ? parse(readFileSync(file, "utf8")) || {} : {};
    const items = Array.isArray(doc[rootKey]) ? doc[rootKey] : [];
    if (items.some((existing) => existing.id === item.id)) {
      throw new Error(`${rootKey} já contém id "${item.id}"`);
    }
    doc[rootKey] = [...items, item];
    writeYamlAtomic(file, doc);
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
    writeYamlAtomic(file, doc);
    return { path: relativePath, id };
  }

  writeIntent(intent) {
    const relativePath = `intents/${safeYamlId(intent.id)}.yml`;
    const file = path.join(this.governanceRoot, relativePath);
    if (existsSync(file)) throw new Error(`intent "${intent.id}" já existe`);
    writeYamlAtomic(file, intent);
    return { path: relativePath, id: intent.id };
  }

  updateIntent(intentId, patch) {
    const relativePath = `intents/${safeYamlId(intentId)}.yml`;
    const file = path.join(this.governanceRoot, relativePath);
    if (!existsSync(file)) throw new Error(`intent "${intentId}" não existe`);
    const intent = parse(readFileSync(file, "utf8")) || {};
    writeYamlAtomic(file, { ...intent, ...patch });
    return { path: relativePath, id: intentId };
  }

  writeTriage(triage) {
    const relativePath = `intake/triage/${safeYamlId(triage.proposal)}.yml`;
    const file = path.join(this.governanceRoot, relativePath);
    mkdirSync(path.dirname(file), { recursive: true });
    writeYamlAtomic(file, triage);
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
    writeYamlAtomic(file, claim);
    return {
      path: path.relative(this.reposRoot, file).replaceAll("\\", "/"),
      id: claim.id,
    };
  }

  writeStandaloneCompletion(standalone) {
    const existing = this.loadRepoStandaloneWorks().find((item) => item.id === standalone.id);
    if (!existing) throw new Error(`standalone "${standalone.id}" não existe`);
    const file = path.isAbsolute(existing._file)
      ? existing._file
      : path.join(this.reposRoot, existing._file);
    const doc = existsSync(file) ? parse(readFileSync(file, "utf8")) || {} : {};
    const next = { ...doc };
    for (const key of REPO_WORK_LIFECYCLE_KEYS) {
      if (standalone[key] !== undefined) next[key] = standalone[key];
    }
    next.status = standalone.status || doc.status || "done";
    writeYamlAtomic(file, next);
    return {
      path: path.relative(this.reposRoot, file).replaceAll("\\", "/"),
      id: standalone.id,
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
    writeYamlAtomic(file, doc);

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
    writeYamlAtomic(registryFile, repoContract);

    return {
      path: relativePath,
      id: `${contractId}::${proposal.id}`,
      registryPath: path.relative(this.reposRoot, registryFile).replaceAll("\\", "/"),
    };
  }

  applyCommand(command) {
    if (command.type === "verdict.accept") {
      return this.appendOptionalGovernanceList(
        "decisions/verdicts.yml",
        "verdicts",
        command.payload.verdict
      );
    }
    if (command.type === "incident.declare") {
      return this.appendGovernanceList(
        "incidents/incidents.yml",
        "incidents",
        command.payload.incident
      );
    }
    if (command.type === "policy.break-glass") {
      return this.appendPolicyList("break-glass", command.payload["break-glass"]);
    }
    if (command.type === "triage.save") {
      return this.writeTriage(command.payload.triage);
    }
    if (command.type === "repo-work.ack") {
      return this.writeRepoWorkAck(command.payload.ack);
    }
    if (command.type === "standalone.complete") {
      return this.writeStandaloneCompletion(command.payload.standalone);
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
