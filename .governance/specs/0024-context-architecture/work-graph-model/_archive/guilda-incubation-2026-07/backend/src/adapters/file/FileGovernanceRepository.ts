// FileGovernanceRepository.ts — adapter file-first da runtime v3.
import { randomUUID } from "node:crypto";
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
import type {
  Contract,
  GovernedCommand,
  GovernanceIssue,
  IntentDef,
  IntentWork,
  OrgSnapshot,
  RepoContract,
  RepoWorkClaim,
  StandaloneWork,
  Triage,
} from "@demo/domain/server";
import {
  expectedRepoContract,
  expectedRepoWorkClaim,
  REPO_WORK_LIFECYCLE_KEYS,
  REPO_WORK_SCHEMA,
} from "@demo/domain/server";
import type {
  CommandLockOptions,
  GovernanceEvent,
  GovernanceRepository,
  TransactionHandle,
  WriteReceipt,
} from "../../ports/GovernanceRepository.ts";
import { digestPublic12 } from "@demo/domain/server";
import { GOVERNANCE_ROOT, REPOS_ROOT } from "../fs/paths.ts";

type YamlDoc = Record<string, unknown>;

function readJsonl(file: string): Array<Record<string, unknown>> {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

function readJson<T>(file: string, fallback: T): T {
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

function writeTextAtomic(file: string, content: string): void {
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

function writeYamlAtomic(file: string, doc: unknown): void {
  writeTextAtomic(file, stringify(doc, { lineWidth: 100 }));
}

function writeJsonAtomic(file: string, doc: unknown): void {
  writeTextAtomic(file, `${JSON.stringify(doc, null, 2)}\n`);
}

function safeYamlId(id: unknown): string {
  const value = String(id || "");
  if (!/^[A-Za-z0-9_.-]+$/.test(value)) {
    throw new Error(`id "${value}" não é seguro para path YAML`);
  }
  return value;
}

type LockHandle = { dir: string; token: string; owner: string };

type PendingTransaction = Record<string, unknown> & { _file: string };

export type FileGovernanceRepositoryOptions = {
  governanceRoot?: string;
  reposRoot?: string;
};

export class FileGovernanceRepository implements GovernanceRepository {
  readonly governanceRoot: string;
  readonly reposRoot: string;

  constructor({
    governanceRoot = GOVERNANCE_ROOT,
    reposRoot = REPOS_ROOT,
  }: FileGovernanceRepositoryOptions = {}) {
    this.governanceRoot = governanceRoot;
    this.reposRoot = reposRoot;
  }

  runtimeRoot(): string {
    return path.join(this.governanceRoot, ".runtime");
  }

  lockDir(): string {
    return path.join(this.runtimeRoot(), "command.lock");
  }

  transactionDir(): string {
    return path.join(this.runtimeRoot(), "transactions");
  }

  acquireCommandLock({ owner = "unknown", ttlMs = 30_000 } = {}): LockHandle {
    mkdirSync(this.runtimeRoot(), { recursive: true });
    const lockDir = this.lockDir();
    const now = Date.now();
    try {
      mkdirSync(lockDir);
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code !== "EEXIST") throw error;
      const current = readJson<Record<string, unknown>>(path.join(lockDir, "lock.json"), {});
      const expiresAt = Date.parse(String(current?.["expiresAt"] || ""));
      if (Number.isFinite(expiresAt) && expiresAt < now) {
        rmSync(lockDir, { recursive: true, force: true });
        mkdirSync(lockDir);
      } else {
        throw new Error(
          `command lock ativo por "${current?.["owner"] || "unknown"}" até ${current?.["expiresAt"] || "unknown"}`
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

  releaseCommandLock(lock: LockHandle): void {
    const lockFile = path.join(lock.dir, "lock.json");
    const current = readJson<Record<string, unknown>>(lockFile, {});
    if (current?.["token"] && current["token"] !== lock.token) {
      throw new Error(`command lock mudou de dono; esperado token ${lock.token}`);
    }
    rmSync(lock.dir, { recursive: true, force: true });
  }

  withCommandLock<T>(command: GovernedCommand, fn: () => T, options: CommandLockOptions = {}): T {
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

  listRuntimeIssues(): GovernanceIssue[] {
    const issues: GovernanceIssue[] = [];
    const lockFile = path.join(this.lockDir(), "lock.json");
    if (existsSync(lockFile)) {
      const lock = readJson<Record<string, unknown>>(lockFile, {});
      issues.push({
        level: "error",
        rule: "file-command-lock-present",
        node: String(lock["owner"] || "command.lock"),
        msg: `lock de comando presente em .runtime; owner=${lock["owner"] || "unknown"} expiresAt=${lock["expiresAt"] || "unknown"}`,
      });
    }
    for (const transaction of this.listPendingTransactions()) {
      issues.push({
        level: "error",
        rule: "file-transaction-pending",
        node: String(transaction["id"] || "transaction"),
        msg: `transação file-first pendente (${transaction["status"] || "unknown"}) precisa de recovery antes de novas mutações`,
      });
    }
    return issues;
  }

  listPendingTransactions(): PendingTransaction[] {
    const dir = this.transactionDir();
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map((file) => ({
        ...readJson<Record<string, unknown>>(path.join(dir, file), {}),
        _file: path.join(dir, file),
      }));
  }

  assertNoPendingTransactions(): void {
    const pending = this.listPendingTransactions();
    if (pending.length) {
      const first = pending[0];
      throw new Error(
        `file transaction pendente "${first["id"] || path.basename(first._file)}" (${first["status"] || "unknown"}); recovery obrigatório antes de nova mutação`
      );
    }
  }

  beginTransaction(command: GovernedCommand, previousRevision: string): TransactionHandle {
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

  updateTransaction(transaction: TransactionHandle, patch: Record<string, unknown>): void {
    const current = readJson<Record<string, unknown>>(transaction.file, {});
    writeJsonAtomic(transaction.file, {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  }

  markTransactionApplied(
    transaction: TransactionHandle,
    write: WriteReceipt,
    newRevision: string
  ): void {
    this.updateTransaction(transaction, {
      status: "applied-pending-event",
      write,
      newRevision,
    });
  }

  markTransactionFailed(
    transaction: TransactionHandle,
    error: unknown,
    revisionAfterError: string
  ): void {
    this.updateTransaction(transaction, {
      status: "failed",
      error: String((error as Error)?.message || error),
      revisionAfterError,
    });
  }

  abortTransaction(transaction: TransactionHandle): void {
    unlinkSync(transaction.file);
  }

  commitTransaction(transaction: TransactionHandle, event: GovernanceEvent): void {
    this.appendEvent(event);
    unlinkSync(transaction.file);
  }

  readGovernanceYaml(relativePath: string): YamlDoc {
    return parse(readFileSync(path.join(this.governanceRoot, relativePath), "utf8")) as YamlDoc;
  }

  readOptionalGovernanceYaml<T>(relativePath: string, fallback: T): T {
    const file = path.join(this.governanceRoot, relativePath);
    return existsSync(file) ? (this.readGovernanceYaml(relativePath) as T) : fallback;
  }

  loadRepoStandaloneWorks(): StandaloneWork[] {
    const out: StandaloneWork[] = [];
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
        const doc = parse(readFileSync(file, "utf8")) as StandaloneWork | null;
        if (doc?.schema !== "acme.standalone-work/v1" && doc?.source?.kind !== "standalone") {
          continue;
        }
        out.push({ ...(doc as StandaloneWork), _file: file, _repo: repo });
      }
    }
    return out.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }

  loadIntents(): IntentDef[] {
    return readdirSync(path.join(this.governanceRoot, "intents"))
      .filter((file) => file.endsWith(".yml"))
      .sort()
      .map((file) => this.readGovernanceYaml("intents/" + file) as unknown as IntentDef);
  }

  loadTriages(): Triage[] {
    const triageDir = path.join(this.governanceRoot, "intake", "triage");
    if (!existsSync(triageDir)) return [];
    return readdirSync(triageDir)
      .filter((file) => file.endsWith(".yml"))
      .sort()
      .map((file) => this.readGovernanceYaml(`intake/triage/${file}`) as unknown as Triage);
  }

  loadRepoWorkClaims(): RepoWorkClaim[] {
    const claims: RepoWorkClaim[] = [];
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
        const doc = parse(readFileSync(file, "utf8")) as RepoWorkClaim | null;
        if (doc?.schema !== REPO_WORK_SCHEMA && doc?.source?.kind !== "central-breakdown") {
          continue;
        }
        claims.push({ ...(doc as RepoWorkClaim), _file: file, _repo: repo });
      }
    }
    return claims.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }

  loadRepoContracts(): RepoContract[] {
    const contracts: RepoContract[] = [];
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
        contracts.push({
          ...(parse(readFileSync(file, "utf8")) as RepoContract),
          _file: file,
          _repo: repo,
        });
      }
    }
    return contracts.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }

  loadOrg(): OrgSnapshot {
    return {
      org: this.readGovernanceYaml("org.yml") as unknown as OrgSnapshot["org"],
      authorities: this.readGovernanceYaml("authorities.yml")[
        "authorities"
      ] as OrgSnapshot["authorities"],
      objectives: this.readGovernanceYaml("business/objectives.yml")[
        "objectives"
      ] as OrgSnapshot["objectives"],
      areas: this.readGovernanceYaml("business/areas.yml")["areas"] as OrgSnapshot["areas"],
      teams: this.readGovernanceYaml("business/teams.yml")["teams"] as OrgSnapshot["teams"],
      theses: this.readGovernanceYaml("business/theses.yml")["theses"] as OrgSnapshot["theses"],
      metrics: this.readGovernanceYaml("business/metrics.yml")["metrics"] as OrgSnapshot["metrics"],
      targets: this.readGovernanceYaml("business/targets.yml")["targets"] as OrgSnapshot["targets"],
      repos: this.readGovernanceYaml("repos.yml")["repos"] as OrgSnapshot["repos"],
      contracts: this.readGovernanceYaml("contracts/contracts.yml")[
        "contracts"
      ] as OrgSnapshot["contracts"],
      proposals: this.readGovernanceYaml("intake/proposals.yml")[
        "proposals"
      ] as OrgSnapshot["proposals"],
      triages: this.loadTriages(),
      incidents: this.readOptionalGovernanceYaml("incidents/incidents.yml", {
        incidents: [] as OrgSnapshot["incidents"],
      }).incidents,
      policy: this.readOptionalGovernanceYaml("trust-policy.yml", {
        "access-requests": [],
        "authority-revocations": [],
        "secret-quarantine": [],
        "break-glass": [],
      }) as OrgSnapshot["policy"],
      intents: this.loadIntents(),
      verdicts: this.readOptionalGovernanceYaml("decisions/verdicts.yml", {
        verdicts: [] as OrgSnapshot["verdicts"],
      }).verdicts,
      standalone: this.loadRepoStandaloneWorks(),
      repoWorkClaims: this.loadRepoWorkClaims(),
      repoContracts: this.loadRepoContracts(),
      outcomes: (this.readGovernanceYaml("outcomes/outcomes.yml")["outcomes"] ||
        []) as OrgSnapshot["outcomes"],
    };
  }

  currentRevision(): string {
    return digestPublic12(this.loadOrg());
  }

  loadCommandHistory(): GovernedCommand[] {
    return readJsonl(path.join(this.governanceRoot, "events", "events.jsonl")).map(
      (event) => event["command"] as GovernedCommand
    );
  }

  appendEvent(event: GovernanceEvent): void {
    const file = path.join(this.governanceRoot, "events", "events.jsonl");
    mkdirSync(path.dirname(file), { recursive: true });
    appendFileSync(file, `${JSON.stringify(event)}\n`, "utf8");
  }

  appendGovernanceList(
    relativePath: string,
    rootKey: string,
    item: { id: string } & Record<string, unknown>
  ): WriteReceipt {
    const file = path.join(this.governanceRoot, relativePath);
    const doc = (parse(readFileSync(file, "utf8")) as YamlDoc) || {};
    const items = Array.isArray(doc[rootKey]) ? (doc[rootKey] as Array<{ id: string }>) : [];
    if (items.some((existing) => existing.id === item.id)) {
      throw new Error(`${rootKey} já contém id "${item.id}"`);
    }
    doc[rootKey] = [...items, item];
    writeYamlAtomic(file, doc);
    return { path: relativePath, id: item.id };
  }

  appendOptionalGovernanceList(
    relativePath: string,
    rootKey: string,
    item: { id: string } & Record<string, unknown>
  ): WriteReceipt {
    const file = path.join(this.governanceRoot, relativePath);
    mkdirSync(path.dirname(file), { recursive: true });
    const doc = existsSync(file) ? (parse(readFileSync(file, "utf8")) as YamlDoc) || {} : {};
    const items = Array.isArray(doc[rootKey]) ? (doc[rootKey] as Array<{ id: string }>) : [];
    if (items.some((existing) => existing.id === item.id)) {
      throw new Error(`${rootKey} já contém id "${item.id}"`);
    }
    doc[rootKey] = [...items, item];
    writeYamlAtomic(file, doc);
    return { path: relativePath, id: item.id };
  }

  appendPolicyList(rootKey: string, item: { id: string } & Record<string, unknown>): WriteReceipt {
    const relativePath = "trust-policy.yml";
    const file = path.join(this.governanceRoot, relativePath);
    const doc = existsSync(file) ? (parse(readFileSync(file, "utf8")) as YamlDoc) || {} : {};
    const items = Array.isArray(doc[rootKey]) ? (doc[rootKey] as Array<{ id: string }>) : [];
    if (items.some((existing) => existing.id === item.id)) {
      throw new Error(`${rootKey} já contém id "${item.id}"`);
    }
    doc[rootKey] = [...items, item];
    writeYamlAtomic(file, doc);
    return { path: relativePath, id: item.id };
  }

  updateGovernanceListItem(
    relativePath: string,
    rootKey: string,
    id: string,
    patch: Record<string, unknown>
  ): WriteReceipt {
    const file = path.join(this.governanceRoot, relativePath);
    const doc = (parse(readFileSync(file, "utf8")) as YamlDoc) || {};
    const items = Array.isArray(doc[rootKey])
      ? (doc[rootKey] as Array<{ id: string } & Record<string, unknown>>)
      : [];
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

  writeIntent(intent: IntentDef): WriteReceipt {
    const relativePath = `intents/${safeYamlId(intent.id)}.yml`;
    const file = path.join(this.governanceRoot, relativePath);
    if (existsSync(file)) throw new Error(`intent "${intent.id}" já existe`);
    writeYamlAtomic(file, intent);
    return { path: relativePath, id: intent.id };
  }

  updateIntent(intentId: string, patch: Record<string, unknown>): WriteReceipt {
    const relativePath = `intents/${safeYamlId(intentId)}.yml`;
    const file = path.join(this.governanceRoot, relativePath);
    if (!existsSync(file)) throw new Error(`intent "${intentId}" não existe`);
    const intent = (parse(readFileSync(file, "utf8")) as YamlDoc) || {};
    writeYamlAtomic(file, { ...intent, ...patch });
    return { path: relativePath, id: intentId };
  }

  writeTriage(triage: Triage): WriteReceipt {
    const relativePath = `intake/triage/${safeYamlId(triage.proposal)}.yml`;
    const file = path.join(this.governanceRoot, relativePath);
    mkdirSync(path.dirname(file), { recursive: true });
    writeYamlAtomic(file, triage);
    return { path: relativePath, id: triage.proposal };
  }

  findIntentWork(
    intentId: string | undefined,
    workId: string | undefined
  ): { intent: IntentDef | undefined; work: IntentWork | undefined } {
    const intent = this.loadIntents().find((item) => item.id === intentId);
    const work = (intent?.works || []).find((item) => item.id === workId);
    return { intent, work };
  }

  writeRepoWorkAck(ack: RepoWorkClaim): WriteReceipt {
    const { intent, work } = this.findIntentWork(ack.intent, ack.work);
    if (!intent || !work) throw new Error(`repo-work "${ack.intent}::${ack.work}" não existe`);
    const file = path.join(
      this.reposRoot,
      work.repo,
      ".governance",
      "works",
      `${safeYamlId(intent.id)}--${safeYamlId(work.id)}.yml`
    );
    const existing = existsSync(file)
      ? ((parse(readFileSync(file, "utf8")) as RepoWorkClaim) ?? ({} as RepoWorkClaim))
      : ({} as RepoWorkClaim);
    const claim = expectedRepoWorkClaim(intent, work);
    for (const key of REPO_WORK_LIFECYCLE_KEYS) {
      if (existing[key] !== undefined)
        (claim as Record<string, unknown>)[key] = existing[key] as unknown;
      if (ack[key] !== undefined) (claim as Record<string, unknown>)[key] = ack[key] as unknown;
    }
    claim.status = ack.status || existing.status || claim.status;
    mkdirSync(path.dirname(file), { recursive: true });
    writeYamlAtomic(file, claim);
    return {
      path: path.relative(this.reposRoot, file).replaceAll("\\", "/"),
      id: claim.id,
    };
  }

  writeStandaloneCompletion(standalone: Partial<StandaloneWork> & { id: string }): WriteReceipt {
    const existing = this.loadRepoStandaloneWorks().find((item) => item.id === standalone.id);
    if (!existing) throw new Error(`standalone "${standalone.id}" não existe`);
    const file = path.isAbsolute(existing._file || "")
      ? (existing._file as string)
      : path.join(this.reposRoot, existing._file || "");
    const doc = existsSync(file) ? (parse(readFileSync(file, "utf8")) as YamlDoc) || {} : {};
    const next: YamlDoc = { ...doc };
    for (const key of REPO_WORK_LIFECYCLE_KEYS) {
      if (standalone[key] !== undefined) next[key] = standalone[key] as unknown;
    }
    next["status"] = standalone.status || doc["status"] || "done";
    writeYamlAtomic(file, next);
    return {
      path: path.relative(this.reposRoot, file).replaceAll("\\", "/"),
      id: standalone.id,
    };
  }

  appendContractRevisionProposal(
    contractId: string,
    proposal: { id: string } & Record<string, unknown>
  ): WriteReceipt {
    const relativePath = "contracts/contracts.yml";
    const file = path.join(this.governanceRoot, relativePath);
    const doc = (parse(readFileSync(file, "utf8")) as YamlDoc) || {};
    const contracts = Array.isArray(doc["contracts"]) ? (doc["contracts"] as Contract[]) : [];
    let updatedContract: Contract | null = null;
    doc["contracts"] = contracts.map((contract) => {
      if (contract.id !== contractId) return contract;
      updatedContract = {
        ...contract,
        "revision-proposals": [
          ...(contract["revision-proposals"] || []),
          proposal as unknown as NonNullable<Contract["revision-proposals"]>[number],
        ],
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

  applyCommand(command: GovernedCommand): WriteReceipt {
    const payload = command.payload as Record<string, never>;
    if (command.type === "verdict.accept") {
      return this.appendOptionalGovernanceList(
        "decisions/verdicts.yml",
        "verdicts",
        payload["verdict"]
      );
    }
    if (command.type === "incident.declare") {
      return this.appendGovernanceList("incidents/incidents.yml", "incidents", payload["incident"]);
    }
    if (command.type === "policy.break-glass") {
      return this.appendPolicyList("break-glass", payload["break-glass"]);
    }
    if (command.type === "triage.save") {
      return this.writeTriage(payload["triage"]);
    }
    if (command.type === "repo-work.ack") {
      return this.writeRepoWorkAck(payload["ack"]);
    }
    if (command.type === "standalone.complete") {
      return this.writeStandaloneCompletion(payload["standalone"]);
    }
    if (command.type === "contract.propose-revision") {
      return this.appendContractRevisionProposal(payload["contract"], payload["proposal"]);
    }
    if (command.type === "gate.decide") {
      const gate = payload["gate"] as { proposal: string; decision: string };
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
      const write = this.writeIntent(payload["intent"]);
      if (payload["proposal"]) {
        this.updateGovernanceListItem("intake/proposals.yml", "proposals", payload["proposal"], {
          status: "closed",
        });
      }
      return write;
    }
    if (command.type === "breakdown.apply") {
      const breakdown = payload["breakdown"] as { intent: string; works: IntentWork[] };
      return this.updateIntent(breakdown.intent, {
        works: breakdown.works,
      });
    }
    if (command.type === "proposal.create") {
      return this.appendGovernanceList("intake/proposals.yml", "proposals", payload["proposal"]);
    }
    if (command.type === "outcome.publish") {
      return this.appendGovernanceList("outcomes/outcomes.yml", "outcomes", payload["outcome"]);
    }
    if ((command.type as string) === "read-model.rebuild") {
      return { path: null, id: command.id };
    }
    throw new Error(`command.type "${command.type}" sem writer no FileGovernanceRepository`);
  }
}
