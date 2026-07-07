// portal-auth.ts — interface adapter: Better Auth for the portal/control plane.
//
// This authenticates the person using the app. It does not grant governance
// authority: roles, source ownership and sensitive actions are still derived by
// the governance reducer and command handlers.
import { mkdirSync } from "node:fs";
import path from "node:path";
import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { organization } from "better-auth/plugins";
import Database from "better-sqlite3";
import { SqliteDialect } from "kysely";
import { localStateDir } from "@/server/adoption/infrastructure/paths";

type PortalAuthRuntime = {
  handler: (request: Request) => Promise<Response>;
};

let runtime: Promise<PortalAuthRuntime> | null = null;

export async function portalAuthHandler(request: Request): Promise<Response> {
  const auth = await portalAuthRuntime();
  return auth.handler(request);
}

export function portalAuthDatabasePath(): string {
  const override = process.env.GOVERNANCE_PORTAL_SQLITE_PATH;
  if (override && override.trim()) return path.resolve(override);
  return path.join(localStateDir(), "portal-auth.sqlite");
}

export function portalAuthBaseUrl(): string {
  return (
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    "http://127.0.0.1:3024/api/auth"
  );
}

function portalAuthRuntime(): Promise<PortalAuthRuntime> {
  runtime ??= createPortalAuthRuntime();
  return runtime;
}

async function createPortalAuthRuntime(): Promise<PortalAuthRuntime> {
  const databasePath = portalAuthDatabasePath();
  mkdirSync(path.dirname(databasePath), { recursive: true });

  const secret = process.env.BETTER_AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && !secret) {
    throw new Error("BETTER_AUTH_SECRET is required for the governance portal in production");
  }

  const sqlite = new Database(databasePath);
  const baseURL = portalAuthBaseUrl();
  const trustedOrigin = new URL(baseURL).origin;
  const auth = betterAuth({
    secret: secret || "0123456789abcdef0123456789abcdef",
    baseURL,
    trustedOrigins: [trustedOrigin],
    database: new SqliteDialect({ database: sqlite }),
    emailAndPassword: { enabled: true },
    plugins: [organization({ allowUserToCreateOrganization: true })],
  });

  await (await getMigrations(auth.options)).runMigrations();
  return auth;
}
