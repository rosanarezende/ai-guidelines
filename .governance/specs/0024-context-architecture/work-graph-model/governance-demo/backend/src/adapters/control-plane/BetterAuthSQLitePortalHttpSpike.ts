import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { organization } from "better-auth/plugins";
import Database from "better-sqlite3";
import { SqliteDialect } from "kysely";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type BetterAuthSQLitePortalHttpSpikeReport = {
  generatedFor: "control-plane-portal-spike";
  id: "S1d";
  store: "sqlite";
  ok: boolean;
  databasePath: string | null;
  migration: {
    createdTables: string[];
    requiredTablesPresent: boolean;
  };
  http: {
    signUpEmailStatus: number;
    createOrganizationStatus: number;
    listOrganizationsStatus: number;
    sessionCookieIssued: boolean;
  };
  persisted: {
    userCount: number;
    sessionCount: number;
    organizationCount: number;
    memberCount: number;
    createdOrganizationSlug: string | null;
    creatorRole: string | null;
  };
  boundary: {
    governanceAuthorityGrantedByPortal: false;
    neo4jUsedAsAccountStore: false;
    contentPlaneRead: false;
  };
  error?: string;
};

const BASE_URL = "http://127.0.0.1:3024/api/auth";
const TRUSTED_ORIGIN = "http://127.0.0.1:3024";
const REQUIRED_TABLES = ["account", "invitation", "member", "organization", "session", "user"];

export async function runBetterAuthSQLitePortalHttpSpike(options?: {
  keepDatabase?: boolean;
}): Promise<BetterAuthSQLitePortalHttpSpikeReport> {
  const rootDir = await mkdtemp(join(tmpdir(), "better-auth-sqlite-portal-"));
  const databasePath = join(rootDir, "portal.sqlite");
  const sqlite = new Database(databasePath);

  try {
    const auth = betterAuth({
      secret: "0123456789abcdef0123456789abcdef",
      baseURL: BASE_URL,
      trustedOrigins: [TRUSTED_ORIGIN],
      database: new SqliteDialect({ database: sqlite }),
      emailAndPassword: { enabled: true },
      plugins: [organization({ allowUserToCreateOrganization: true })],
    });

    await (await getMigrations(auth.options)).runMigrations();

    const signUp = await postAuth(auth, "/sign-up/email", {
      email: "ana.portal@example.com",
      password: "correct horse battery staple",
      name: "Ana Portal",
    });
    const sessionCookie = extractCookie(signUp.setCookie);
    const createOrganization = await postAuth(
      auth,
      "/organization/create",
      {
        name: "Mundo da Mel Governance",
        slug: "mundo-da-mel",
      },
      sessionCookie
    );
    const listOrganizations = await getAuth(auth, "/organization/list", sessionCookie);

    const tables = listTables(sqlite);
    const persisted = readPersistedState(sqlite);
    const requiredTablesPresent = REQUIRED_TABLES.every((table) => tables.includes(table));
    const createdOrganizationSlug = extractOrganizationSlug(createOrganization.body);
    const ok =
      requiredTablesPresent &&
      signUp.status === 200 &&
      createOrganization.status === 200 &&
      listOrganizations.status === 200 &&
      Boolean(sessionCookie) &&
      persisted.userCount === 1 &&
      persisted.sessionCount === 1 &&
      persisted.organizationCount === 1 &&
      persisted.memberCount === 1 &&
      createdOrganizationSlug === "mundo-da-mel" &&
      persisted.creatorRole === "owner";

    return {
      generatedFor: "control-plane-portal-spike",
      id: "S1d",
      store: "sqlite",
      ok,
      databasePath: options?.keepDatabase ? databasePath : null,
      migration: {
        createdTables: tables,
        requiredTablesPresent,
      },
      http: {
        signUpEmailStatus: signUp.status,
        createOrganizationStatus: createOrganization.status,
        listOrganizationsStatus: listOrganizations.status,
        sessionCookieIssued: Boolean(sessionCookie),
      },
      persisted: {
        ...persisted,
        createdOrganizationSlug,
      },
      boundary: {
        governanceAuthorityGrantedByPortal: false,
        neo4jUsedAsAccountStore: false,
        contentPlaneRead: false,
      },
    };
  } catch (error) {
    return {
      generatedFor: "control-plane-portal-spike",
      id: "S1d",
      store: "sqlite",
      ok: false,
      databasePath: options?.keepDatabase ? databasePath : null,
      migration: {
        createdTables: listTables(sqlite),
        requiredTablesPresent: false,
      },
      http: {
        signUpEmailStatus: 0,
        createOrganizationStatus: 0,
        listOrganizationsStatus: 0,
        sessionCookieIssued: false,
      },
      persisted: {
        userCount: safeCount(sqlite, "user"),
        sessionCount: safeCount(sqlite, "session"),
        organizationCount: safeCount(sqlite, "organization"),
        memberCount: safeCount(sqlite, "member"),
        createdOrganizationSlug: null,
        creatorRole: null,
      },
      boundary: {
        governanceAuthorityGrantedByPortal: false,
        neo4jUsedAsAccountStore: false,
        contentPlaneRead: false,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    sqlite.close();
    if (!options?.keepDatabase) {
      await rm(rootDir, { recursive: true, force: true });
    }
  }
}

async function postAuth(
  auth: { handler: (request: Request) => Promise<Response> },
  path: string,
  body: Record<string, unknown>,
  cookie?: string | null
): Promise<{ status: number; setCookie: string | null; body: string }> {
  const headers = new Headers({
    "content-type": "application/json",
    origin: TRUSTED_ORIGIN,
  });
  if (cookie) headers.set("cookie", cookie);

  const response = await auth.handler(
    new Request(`${BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })
  );
  return {
    status: response.status,
    setCookie: response.headers.get("set-cookie"),
    body: await response.text(),
  };
}

async function getAuth(
  auth: { handler: (request: Request) => Promise<Response> },
  path: string,
  cookie?: string | null
): Promise<{ status: number; setCookie: string | null; body: string }> {
  const headers = new Headers({ origin: TRUSTED_ORIGIN });
  if (cookie) headers.set("cookie", cookie);

  const response = await auth.handler(
    new Request(`${BASE_URL}${path}`, {
      method: "GET",
      headers,
    })
  );
  return {
    status: response.status,
    setCookie: response.headers.get("set-cookie"),
    body: await response.text(),
  };
}

function extractCookie(setCookie: string | null): string | null {
  if (!setCookie) return null;
  return setCookie.split(";")[0] ?? null;
}

function listTables(sqlite: Database.Database): string[] {
  return sqlite
    .prepare("select name from sqlite_master where type = 'table' order by name")
    .all()
    .map((row) => String((row as { name: string }).name));
}

function readPersistedState(sqlite: Database.Database): {
  userCount: number;
  sessionCount: number;
  organizationCount: number;
  memberCount: number;
  creatorRole: string | null;
} {
  return {
    userCount: safeCount(sqlite, "user"),
    sessionCount: safeCount(sqlite, "session"),
    organizationCount: safeCount(sqlite, "organization"),
    memberCount: safeCount(sqlite, "member"),
    creatorRole: readFirstMemberRole(sqlite),
  };
}

function safeCount(sqlite: Database.Database, table: string): number {
  if (!listTables(sqlite).includes(table)) return 0;
  return Number(
    (sqlite.prepare(`select count(*) as count from ${table}`).get() as { count: number }).count
  );
}

function readFirstMemberRole(sqlite: Database.Database): string | null {
  if (!listTables(sqlite).includes("member")) return null;
  const row = sqlite.prepare("select role from member limit 1").get() as
    | { role?: string }
    | undefined;
  return row?.role ?? null;
}

function extractOrganizationSlug(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as { slug?: unknown };
    return typeof parsed.slug === "string" ? parsed.slug : null;
  } catch {
    return null;
  }
}
