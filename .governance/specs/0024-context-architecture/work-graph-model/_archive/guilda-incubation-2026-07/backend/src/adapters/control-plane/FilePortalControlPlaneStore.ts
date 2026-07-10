import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  projectPersistedControlPlaneState,
  type PortalControlPlaneState,
  type PortalPersistedSnapshot,
} from "@demo/domain/server";

export type PortalControlPlaneEvent = {
  id: string;
  type:
    | "portal.snapshot.persisted"
    | "portal.invite.accepted"
    | "portal.proposal.created"
    | "portal.github-bridge.dry-run";
  workspaceId: string;
  sourceRevision?: string;
  writesToRemote: false;
};

export type PortalPersistenceReceipt = {
  snapshotPath: string;
  eventLogPath: string;
  eventCount: number;
  snapshot: PortalPersistedSnapshot;
};

export class FilePortalControlPlaneStore {
  readonly rootDir: string;
  readonly snapshotPath: string;
  readonly eventLogPath: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.snapshotPath = join(rootDir, "portal-control-plane.json");
    this.eventLogPath = join(rootDir, "events.jsonl");
  }

  async persistState(input: {
    state: PortalControlPlaneState;
    events: PortalControlPlaneEvent[];
  }): Promise<PortalPersistenceReceipt> {
    const snapshot = projectPersistedControlPlaneState(input.state);
    await atomicWriteJson(this.snapshotPath, snapshot);
    await atomicWriteText(
      this.eventLogPath,
      input.events.map((event) => JSON.stringify(event)).join("\n") + "\n"
    );

    return {
      snapshotPath: this.snapshotPath,
      eventLogPath: this.eventLogPath,
      eventCount: input.events.length,
      snapshot,
    };
  }

  async readSnapshot(): Promise<PortalPersistedSnapshot> {
    return JSON.parse(await readFile(this.snapshotPath, "utf8")) as PortalPersistedSnapshot;
  }

  async readEvents(): Promise<PortalControlPlaneEvent[]> {
    const body = await readFile(this.eventLogPath, "utf8");
    return body
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as PortalControlPlaneEvent);
  }
}

export function buildPortalSpikeEvents(input: {
  workspaceId: string;
  sourceRevision: string;
}): PortalControlPlaneEvent[] {
  return [
    {
      id: "evt-portal-snapshot-1",
      type: "portal.snapshot.persisted",
      workspaceId: input.workspaceId,
      sourceRevision: input.sourceRevision,
      writesToRemote: false,
    },
    {
      id: "evt-portal-invite-accepted-1",
      type: "portal.invite.accepted",
      workspaceId: input.workspaceId,
      sourceRevision: input.sourceRevision,
      writesToRemote: false,
    },
    {
      id: "evt-portal-proposal-created-1",
      type: "portal.proposal.created",
      workspaceId: input.workspaceId,
      sourceRevision: input.sourceRevision,
      writesToRemote: false,
    },
    {
      id: "evt-portal-github-dry-run-1",
      type: "portal.github-bridge.dry-run",
      workspaceId: input.workspaceId,
      sourceRevision: input.sourceRevision,
      writesToRemote: false,
    },
  ];
}

async function atomicWriteJson(path: string, value: unknown): Promise<void> {
  await atomicWriteText(path, JSON.stringify(value, null, 2) + "\n");
}

async function atomicWriteText(path: string, value: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, value, "utf8");
  await rename(temporaryPath, path);
}
