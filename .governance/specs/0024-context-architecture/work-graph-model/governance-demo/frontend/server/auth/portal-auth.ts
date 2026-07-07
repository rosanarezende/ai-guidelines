// portal-auth.ts — interface adapter: Better Auth for the portal/control plane.
//
// This authenticates the person using the app. It does not grant governance
// authority: roles, source ownership and sensitive actions are still derived by
// the governance reducer and command handlers.
import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { magicLink, organization } from "better-auth/plugins";
import Database from "better-sqlite3";
import { SqliteDialect } from "kysely";
import { localStateDir } from "@/server/adoption/infrastructure/paths";

type PortalAuthRuntime = {
  handler: (request: Request) => Promise<Response>;
};

export type PortalAuthUiOptions = {
  password: false;
  magicLink: {
    enabled: true;
    delivery: "dev-outbox" | "webhook" | "not-configured";
  };
  socialProviders: {
    github: boolean;
    google: boolean;
  };
  anonymousDemo: true;
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

export function portalMagicLinkOutboxPath(): string {
  return path.join(localStateDir(), "portal-magic-links.jsonl");
}

export function portalAuthUiOptions(): PortalAuthUiOptions {
  return {
    password: false,
    magicLink: {
      enabled: true,
      delivery: magicLinkDeliveryMode(),
    },
    socialProviders: {
      github: Boolean(
        readEnvPair("GOVERNANCE_AUTH_GITHUB_CLIENT_ID", "GOVERNANCE_AUTH_GITHUB_CLIENT_SECRET")
      ),
      google: Boolean(
        readEnvPair("GOVERNANCE_AUTH_GOOGLE_CLIENT_ID", "GOVERNANCE_AUTH_GOOGLE_CLIENT_SECRET")
      ),
    },
    anonymousDemo: true,
  };
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
    emailAndPassword: { enabled: false },
    socialProviders: portalSocialProviders(),
    plugins: [
      organization({ allowUserToCreateOrganization: true }),
      magicLink({
        storeToken: "hashed",
        expiresIn: 10 * 60,
        sendMagicLink: async ({ email, url, metadata }) => {
          await deliverMagicLink({ email, url, metadata });
        },
      }),
    ],
  });

  await (await getMigrations(auth.options)).runMigrations();
  return auth;
}

function readEnvPair(
  idKey: string,
  secretKey: string
): { clientId: string; clientSecret: string } | null {
  const clientId = process.env[idKey]?.trim();
  const clientSecret = process.env[secretKey]?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

function portalSocialProviders() {
  const github = readEnvPair(
    "GOVERNANCE_AUTH_GITHUB_CLIENT_ID",
    "GOVERNANCE_AUTH_GITHUB_CLIENT_SECRET"
  );
  const google = readEnvPair(
    "GOVERNANCE_AUTH_GOOGLE_CLIENT_ID",
    "GOVERNANCE_AUTH_GOOGLE_CLIENT_SECRET"
  );
  return {
    ...(github ? { github } : {}),
    ...(google ? { google } : {}),
  };
}

function magicLinkDeliveryMode(): PortalAuthUiOptions["magicLink"]["delivery"] {
  if (process.env.GOVERNANCE_AUTH_MAGIC_LINK_WEBHOOK_URL?.trim()) return "webhook";
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.GOVERNANCE_AUTH_MAGIC_LINK_DELIVERY === "dev-outbox"
  ) {
    return "dev-outbox";
  }
  return "not-configured";
}

async function deliverMagicLink(input: {
  email: string;
  url: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const mode = magicLinkDeliveryMode();
  if (mode === "webhook") {
    const webhookUrl = process.env.GOVERNANCE_AUTH_MAGIC_LINK_WEBHOOK_URL?.trim();
    if (!webhookUrl) throw new Error("magic-link-webhook-missing");
    const headers: Record<string, string> = { "content-type": "application/json" };
    const token = process.env.GOVERNANCE_AUTH_MAGIC_LINK_WEBHOOK_TOKEN?.trim();
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: input.email,
        url: input.url,
        metadata: input.metadata || {},
      }),
    });
    if (!response.ok) throw new Error(`magic-link-webhook-failed:${response.status}`);
    return;
  }
  if (mode === "dev-outbox") {
    const outboxPath = portalMagicLinkOutboxPath();
    mkdirSync(path.dirname(outboxPath), { recursive: true });
    appendFileSync(
      outboxPath,
      `${JSON.stringify({
        email: input.email,
        url: input.url,
        metadata: input.metadata || {},
        recordedAt: new Date().toISOString(),
      })}\n`,
      "utf8"
    );
    return;
  }
  throw new Error("magic-link-delivery-not-configured");
}
