// repo-contracts.ts — contratos publicados pelo owner repo.
// contracts.yml continua a visão coordenada da org; o owner repo precisa publicar o
// contrato localmente em .governance/registry/contracts/<id>.yml.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse, stringify } from "yaml";
import type { GovernanceIssue, OrgSnapshot, RepoContract } from "@demo/domain/server";
import { deriveExpectedRepoContracts, type ExpectedRepoContract } from "@demo/domain/server";
import { stableSorted } from "@demo/domain/server";
import { REPOS_ROOT, SIM_ROOT } from "../fs/paths.ts";

const REPOS_DIR = REPOS_ROOT;
const GOVERNANCE_DIR = ".governance";

const readYaml = (file: string): RepoContract => parse(readFileSync(file, "utf8")) as RepoContract;

function repoDirs(): string[] {
  return readdirSync(REPOS_DIR)
    .map((name) => path.join(REPOS_DIR, name))
    .filter((full) => statSync(full).isDirectory() && existsSync(path.join(full, "package.json")))
    .sort();
}

function contractFile(repo: string, contractId: string): string {
  return path.join(REPOS_DIR, repo, GOVERNANCE_DIR, "registry", "contracts", `${contractId}.yml`);
}

export function loadPublishedRepoContracts(): RepoContract[] {
  const contracts: RepoContract[] = [];
  for (const repoDir of repoDirs()) {
    const repo = path.basename(repoDir);
    const dir = path.join(repoDir, GOVERNANCE_DIR, "registry", "contracts");
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)
      .filter((file) => file.endsWith(".yml"))
      .sort()) {
      const file = path.join(dir, name);
      contracts.push({ ...readYaml(file), _file: file, _repo: repo });
    }
  }
  return contracts.sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

export function publishRepoContracts(o: OrgSnapshot): ExpectedRepoContract[] {
  const contracts = deriveExpectedRepoContracts(o);
  for (const contract of contracts) {
    const out = contractFile(contract.ownerRepo, contract.id);
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, stringify(contract, { lineWidth: 100 }));
  }
  return contracts;
}

function sameList(a: unknown, b: unknown): boolean {
  return JSON.stringify(a || []) === JSON.stringify(b || []);
}

function checkClosedSchema(contract: RepoContract, node: string, issues: GovernanceIssue[]): void {
  const err = (rule: string, msg: string): void => {
    issues.push({ level: "error", rule, node, msg });
  };
  const topKeys = new Set([
    "schema",
    "id",
    "revision",
    "ownerRepo",
    "consumers",
    "compatibilityWindow",
    "interface",
    "revisionProposals",
    "source",
    "code",
    "_file",
    "_repo",
  ]);
  const sourceKeys = new Set(["kind", "file", "contractHash"]);
  const codeKeys = new Set(["touchpoints"]);
  for (const key of Object.keys(contract || {}))
    if (!topKeys.has(key)) err("repo-contract-schema", `chave desconhecida "${key}"`);
  for (const key of ["schema", "id", "revision", "ownerRepo"] as const)
    if (contract?.[key] === undefined || contract?.[key] === null || contract?.[key] === "")
      err("repo-contract-schema", `campo obrigatório "${key}" ausente`);
  if (!Array.isArray(contract?.consumers))
    err("repo-contract-schema", "consumers precisa ser lista");
  for (const key of Object.keys(contract?.source || {}))
    if (!sourceKeys.has(key)) err("repo-contract-schema", `source.${key} é chave desconhecida`);
  for (const key of ["kind", "file", "contractHash"] as const)
    if (!contract?.source?.[key]) err("repo-contract-schema", `source.${key} ausente`);
  for (const key of Object.keys(contract?.code || {}))
    if (!codeKeys.has(key)) err("repo-contract-schema", `code.${key} é chave desconhecida`);
  if (!Array.isArray(contract?.code?.touchpoints) || contract.code.touchpoints.length === 0)
    err("repo-contract-evidence", "code.touchpoints precisa apontar para código do owner repo");
}

export type ValidateRepoContractsOptions = {
  publishedContracts?: RepoContract[];
};

export function validateRepoContracts(
  o: OrgSnapshot,
  options: ValidateRepoContractsOptions = {}
): GovernanceIssue[] {
  const issues: GovernanceIssue[] = [];
  const err = (rule: string, node: string, msg: string): void => {
    issues.push({ level: "error", rule, node, msg });
  };
  const expected = deriveExpectedRepoContracts(o);
  const expectedById = new Map(expected.map((contract) => [contract.id, contract]));
  const publishedById = new Map<string, RepoContract>();

  let published: RepoContract[] = [];
  try {
    published = options.publishedContracts || loadPublishedRepoContracts();
  } catch (e) {
    err("repo-contract-parse", "repo-contracts", (e as Error).message);
    return issues;
  }

  for (const contract of published) {
    const node = contract.id || path.relative(SIM_ROOT, contract._file || "").replaceAll("\\", "/");
    if (publishedById.has(contract.id)) err("repo-contract-duplicate", node, "id duplicado");
    publishedById.set(contract.id, contract);
    checkClosedSchema(contract, node, issues);

    const expectedContract = expectedById.get(contract.id);
    if (!expectedContract) {
      err("repo-contract-orphan", node, "contrato local não existe em contracts.yml");
      continue;
    }
    for (const key of [
      "schema",
      "revision",
      "ownerRepo",
      "compatibilityWindow",
      "interface",
    ] as const) {
      const actual = contract[key] ?? null;
      const expectedValue = expectedContract[key] ?? null;
      if (JSON.stringify(stableSorted(actual)) !== JSON.stringify(stableSorted(expectedValue)))
        err("repo-contract-stale", node, `${key} diverge do contrato central`);
    }
    if (!sameList(contract.consumers, expectedContract.consumers))
      err("repo-contract-stale", node, "consumers divergem do contrato central");
    if (!sameList(contract.revisionProposals, expectedContract.revisionProposals))
      err("repo-contract-stale", node, "revisionProposals divergem do contrato central");
    if (contract.source?.kind !== "central-contract")
      err(
        "repo-contract-source",
        node,
        `source.kind "${contract.source?.kind}" não é central-contract`
      );
    if (contract.source?.file !== expectedContract.source.file)
      err(
        "repo-contract-source",
        node,
        `source.file "${contract.source?.file}" diverge de "${expectedContract.source.file}"`
      );
    if (contract.source?.contractHash !== expectedContract.source.contractHash)
      err(
        "repo-contract-stale",
        node,
        "contractHash diverge — contracts.yml mudou e o owner repo ainda não reconheceu"
      );
    if (contract._repo && contract._repo !== expectedContract.ownerRepo)
      err(
        "repo-contract-owner",
        node,
        `contrato publicado em "${contract._repo}", mas ownerRepo é "${expectedContract.ownerRepo}"`
      );
    for (const touchpoint of contract.code?.touchpoints || []) {
      const full = path.join(REPOS_DIR, contract.ownerRepo || "", touchpoint);
      if (!existsSync(full))
        err(
          "repo-contract-evidence",
          node,
          `touchpoint "${touchpoint}" não existe em ${contract.ownerRepo}`
        );
    }
  }

  for (const contract of expected) {
    if (!publishedById.has(contract.id))
      err(
        "repo-contract-missing",
        contract.id,
        `owner repo "${contract.ownerRepo}" não publicou registry/contracts/${contract.id}.yml`
      );
  }

  return issues;
}
