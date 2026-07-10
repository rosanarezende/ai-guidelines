import {
  comparePortalStoreCandidates,
  type PortalStoreCandidate,
  type PortalStoreKind,
} from "@demo/domain";

export type PortalStoreDriverStatus = {
  packageName: string;
  available: boolean;
};

export type PortalStoreProfileStatus = {
  id: PortalStoreKind;
  label: string;
  role: PortalStoreCandidate["role"];
  betterAuthSupported: boolean;
  decision: PortalStoreCandidate["decision"];
  driverStatus: PortalStoreDriverStatus[];
  readyForSpike: boolean;
  liveCheck:
    | { status: "not-required" }
    | { status: "skipped-without-database-url" }
    | { status: "not-portal-store" };
};

export type BetterAuthPortalStoreReport = {
  generatedFor: "control-plane-portal-spike";
  profiles: PortalStoreProfileStatus[];
  summary: {
    sqliteReady: boolean;
    postgresReady: boolean;
    neo4jRejectedAsPortalStore: boolean;
    postgresLiveConnectionRequiredForThisSpike: false;
  };
};

const PROFILE_DRIVER_REQUIREMENTS: Record<PortalStoreKind, string[]> = {
  sqlite: ["better-auth", "@better-auth/kysely-adapter", "kysely", "better-sqlite3"],
  postgres: ["better-auth", "@better-auth/kysely-adapter", "kysely", "pg"],
  neo4j: [],
};

export async function evaluateBetterAuthPortalStoreProfiles(): Promise<BetterAuthPortalStoreReport> {
  const candidates = comparePortalStoreCandidates();
  const profiles = await Promise.all(
    candidates.map(async (candidate): Promise<PortalStoreProfileStatus> => {
      const driverStatus = await Promise.all(
        PROFILE_DRIVER_REQUIREMENTS[candidate.id].map(async (packageName) => ({
          packageName,
          available: await canImport(packageName),
        }))
      );
      const readyForSpike =
        candidate.betterAuthSupported && driverStatus.every((driver) => driver.available);

      return {
        id: candidate.id,
        label: candidate.label,
        role: candidate.role,
        betterAuthSupported: candidate.betterAuthSupported,
        decision: candidate.decision,
        driverStatus,
        readyForSpike,
        liveCheck: liveCheckFor(candidate.id),
      };
    })
  );

  return {
    generatedFor: "control-plane-portal-spike",
    profiles,
    summary: {
      sqliteReady: profiles.some((profile) => profile.id === "sqlite" && profile.readyForSpike),
      postgresReady: profiles.some((profile) => profile.id === "postgres" && profile.readyForSpike),
      neo4jRejectedAsPortalStore: profiles.some(
        (profile) =>
          profile.id === "neo4j" &&
          profile.role === "governance-graph-read-model" &&
          profile.betterAuthSupported === false &&
          profile.liveCheck.status === "not-portal-store"
      ),
      postgresLiveConnectionRequiredForThisSpike: false,
    },
  };
}

async function canImport(packageName: string): Promise<boolean> {
  try {
    switch (packageName) {
      case "better-auth":
        await import("better-auth");
        break;
      case "@better-auth/kysely-adapter":
        await import("@better-auth/kysely-adapter");
        break;
      case "kysely":
        await import("kysely");
        break;
      case "better-sqlite3":
        await import("better-sqlite3");
        break;
      case "pg":
        await import("pg");
        break;
      default:
        return false;
    }
    return true;
  } catch {
    return false;
  }
}

function liveCheckFor(id: PortalStoreKind): PortalStoreProfileStatus["liveCheck"] {
  if (id === "sqlite") return { status: "not-required" };
  if (id === "postgres") return { status: "skipped-without-database-url" };
  return { status: "not-portal-store" };
}
