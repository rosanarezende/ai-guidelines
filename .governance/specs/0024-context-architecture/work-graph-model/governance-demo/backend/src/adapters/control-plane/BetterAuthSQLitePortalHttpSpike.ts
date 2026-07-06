import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { organization } from "better-auth/plugins";
import Database from "better-sqlite3";
import { PostgresDialect, SqliteDialect } from "kysely";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

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

export type BetterAuthSQLiteInviteAcceptHttpSpikeReport = {
  generatedFor: "control-plane-portal-spike";
  id: "S1e";
  store: "sqlite";
  ok: boolean;
  databasePath: string | null;
  http: {
    creatorSignUpStatus: number;
    createOrganizationStatus: number;
    inviteMemberStatus: number;
    inviteeSignUpStatus: number;
    acceptInvitationStatus: number;
    creatorCookieIssued: boolean;
    inviteeCookieIssued: boolean;
  };
  persisted: {
    userCount: number;
    sessionCount: number;
    organizationCount: number;
    memberCount: number;
    invitationCount: number;
    acceptedInvitationCount: number;
    ownerMemberCount: number;
    invitedMemberCount: number;
    organizationSlug: string | null;
  };
  boundary: {
    invitedUserOperatedGitHub: false;
    governanceAuthorityGrantedByPortal: false;
    contentPlaneRead: false;
  };
  error?: string;
};

export type BetterAuthPostgresPortalLiveSpikeReport = {
  generatedFor: "control-plane-portal-spike";
  id: "S1e-postgres";
  store: "postgres";
  status: "skipped-without-database-url" | "skipped-without-explicit-apply" | "passed" | "failed";
  ok: boolean;
  env: {
    databaseUrlProvided: boolean;
    explicitApply: boolean;
  };
  http?: BetterAuthSQLiteInviteAcceptHttpSpikeReport["http"];
  persisted?: BetterAuthSQLiteInviteAcceptHttpSpikeReport["persisted"];
  boundary: {
    governanceAuthorityGrantedByPortal: false;
    contentPlaneRead: false;
  };
  error?: string;
};

const BASE_URL = "http://127.0.0.1:3024/api/auth";
const TRUSTED_ORIGIN = "http://127.0.0.1:3024";
const REQUIRED_TABLES = ["account", "invitation", "member", "organization", "session", "user"];
const POSTGRES_URL_ENV = "GOVERNANCE_PORTAL_POSTGRES_URL";
const POSTGRES_APPLY_ENV = "GOVERNANCE_PORTAL_POSTGRES_SPIKE_APPLY";

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

export async function runBetterAuthSQLiteInviteAcceptHttpSpike(options?: {
  keepDatabase?: boolean;
}): Promise<BetterAuthSQLiteInviteAcceptHttpSpikeReport> {
  const rootDir = await mkdtemp(join(tmpdir(), "better-auth-sqlite-invite-"));
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

    const flow = await runInviteAcceptHttpFlow({
      auth,
      creatorEmail: "creator.portal@example.com",
      inviteeEmail: "guest.portal@example.com",
      organizationSlug: "mundo-da-mel-invite",
    });
    const persisted = readInviteAcceptSqliteState(sqlite, flow.organizationSlug);
    const ok =
      flow.ok &&
      persisted.userCount === 2 &&
      persisted.sessionCount === 2 &&
      persisted.organizationCount === 1 &&
      persisted.memberCount === 2 &&
      persisted.invitationCount === 1 &&
      persisted.acceptedInvitationCount === 1 &&
      persisted.ownerMemberCount === 1 &&
      persisted.invitedMemberCount === 1;

    return {
      generatedFor: "control-plane-portal-spike",
      id: "S1e",
      store: "sqlite",
      ok,
      databasePath: options?.keepDatabase ? databasePath : null,
      http: flow.http,
      persisted,
      boundary: {
        invitedUserOperatedGitHub: false,
        governanceAuthorityGrantedByPortal: false,
        contentPlaneRead: false,
      },
    };
  } catch (error) {
    return {
      generatedFor: "control-plane-portal-spike",
      id: "S1e",
      store: "sqlite",
      ok: false,
      databasePath: options?.keepDatabase ? databasePath : null,
      http: emptyInviteAcceptHttp(),
      persisted: {
        userCount: safeCount(sqlite, "user"),
        sessionCount: safeCount(sqlite, "session"),
        organizationCount: safeCount(sqlite, "organization"),
        memberCount: safeCount(sqlite, "member"),
        invitationCount: safeCount(sqlite, "invitation"),
        acceptedInvitationCount: safeInvitationStatusCount(sqlite, "accepted"),
        ownerMemberCount: safeMemberRoleCount(sqlite, "owner"),
        invitedMemberCount: safeMemberRoleCount(sqlite, "member"),
        organizationSlug: null,
      },
      boundary: {
        invitedUserOperatedGitHub: false,
        governanceAuthorityGrantedByPortal: false,
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

export async function runBetterAuthPostgresPortalLiveSpike(
  env = process.env
): Promise<BetterAuthPostgresPortalLiveSpikeReport> {
  const databaseUrl = env[POSTGRES_URL_ENV];
  const explicitApply = env[POSTGRES_APPLY_ENV] === "1" || env[POSTGRES_APPLY_ENV] === "true";

  if (!databaseUrl) {
    return skippedPostgres("skipped-without-database-url", false, explicitApply);
  }
  if (!explicitApply) {
    return skippedPostgres("skipped-without-explicit-apply", true, explicitApply);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const namespace = `s1e-${randomUUID().slice(0, 8)}`;

  try {
    const auth = betterAuth({
      secret: "0123456789abcdef0123456789abcdef",
      baseURL: BASE_URL,
      trustedOrigins: [TRUSTED_ORIGIN],
      database: new PostgresDialect({ pool }),
      emailAndPassword: { enabled: true },
      plugins: [organization({ allowUserToCreateOrganization: true })],
    });

    await (await getMigrations(auth.options)).runMigrations();
    const flow = await runInviteAcceptHttpFlow({
      auth,
      creatorEmail: `creator-${namespace}@example.com`,
      inviteeEmail: `guest-${namespace}@example.com`,
      organizationSlug: `mundo-da-mel-${namespace}`,
    });
    const persisted = await readInviteAcceptPostgresState(pool, flow.organizationSlug);
    const ok =
      flow.ok &&
      persisted.userCount >= 2 &&
      persisted.sessionCount >= 2 &&
      persisted.organizationCount === 1 &&
      persisted.memberCount === 2 &&
      persisted.invitationCount === 1 &&
      persisted.acceptedInvitationCount === 1 &&
      persisted.ownerMemberCount === 1 &&
      persisted.invitedMemberCount === 1;

    return {
      generatedFor: "control-plane-portal-spike",
      id: "S1e-postgres",
      store: "postgres",
      status: ok ? "passed" : "failed",
      ok,
      env: {
        databaseUrlProvided: true,
        explicitApply,
      },
      http: flow.http,
      persisted,
      boundary: {
        governanceAuthorityGrantedByPortal: false,
        contentPlaneRead: false,
      },
    };
  } catch (error) {
    return {
      generatedFor: "control-plane-portal-spike",
      id: "S1e-postgres",
      store: "postgres",
      status: "failed",
      ok: false,
      env: {
        databaseUrlProvided: true,
        explicitApply,
      },
      boundary: {
        governanceAuthorityGrantedByPortal: false,
        contentPlaneRead: false,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await pool.end();
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

async function runInviteAcceptHttpFlow({
  auth,
  creatorEmail,
  inviteeEmail,
  organizationSlug,
}: {
  auth: { handler: (request: Request) => Promise<Response> };
  creatorEmail: string;
  inviteeEmail: string;
  organizationSlug: string;
}): Promise<{
  ok: boolean;
  organizationId: string | null;
  organizationSlug: string | null;
  invitationId: string | null;
  http: BetterAuthSQLiteInviteAcceptHttpSpikeReport["http"];
}> {
  const creatorSignUp = await postAuth(auth, "/sign-up/email", {
    email: creatorEmail,
    password: "correct horse battery staple",
    name: "Portal Creator",
  });
  const creatorCookie = extractCookie(creatorSignUp.setCookie);
  const createOrganization = await postAuth(
    auth,
    "/organization/create",
    {
      name: "Mundo da Mel Governance",
      slug: organizationSlug,
    },
    creatorCookie
  );
  const organizationId = extractJsonString(createOrganization.body, "id");
  const createdSlug = extractJsonString(createOrganization.body, "slug");
  const inviteMember = await postAuth(
    auth,
    "/organization/invite-member",
    {
      email: inviteeEmail,
      role: "member",
      organizationId,
    },
    creatorCookie
  );
  const invitationId = extractJsonString(inviteMember.body, "id");
  const inviteeSignUp = await postAuth(auth, "/sign-up/email", {
    email: inviteeEmail,
    password: "correct horse battery staple",
    name: "Portal Guest",
  });
  const inviteeCookie = extractCookie(inviteeSignUp.setCookie);
  const acceptInvitation = await postAuth(
    auth,
    "/organization/accept-invitation",
    { invitationId },
    inviteeCookie
  );
  const http = {
    creatorSignUpStatus: creatorSignUp.status,
    createOrganizationStatus: createOrganization.status,
    inviteMemberStatus: inviteMember.status,
    inviteeSignUpStatus: inviteeSignUp.status,
    acceptInvitationStatus: acceptInvitation.status,
    creatorCookieIssued: Boolean(creatorCookie),
    inviteeCookieIssued: Boolean(inviteeCookie),
  };

  return {
    ok:
      http.creatorSignUpStatus === 200 &&
      http.createOrganizationStatus === 200 &&
      http.inviteMemberStatus === 200 &&
      http.inviteeSignUpStatus === 200 &&
      http.acceptInvitationStatus === 200 &&
      http.creatorCookieIssued &&
      http.inviteeCookieIssued &&
      Boolean(organizationId) &&
      Boolean(invitationId),
    organizationId,
    organizationSlug: createdSlug,
    invitationId,
    http,
  };
}

function emptyInviteAcceptHttp(): BetterAuthSQLiteInviteAcceptHttpSpikeReport["http"] {
  return {
    creatorSignUpStatus: 0,
    createOrganizationStatus: 0,
    inviteMemberStatus: 0,
    inviteeSignUpStatus: 0,
    acceptInvitationStatus: 0,
    creatorCookieIssued: false,
    inviteeCookieIssued: false,
  };
}

function readInviteAcceptSqliteState(
  sqlite: Database.Database,
  organizationSlug: string | null
): BetterAuthSQLiteInviteAcceptHttpSpikeReport["persisted"] {
  return {
    userCount: safeCount(sqlite, "user"),
    sessionCount: safeCount(sqlite, "session"),
    organizationCount: safeCount(sqlite, "organization"),
    memberCount: safeCount(sqlite, "member"),
    invitationCount: safeCount(sqlite, "invitation"),
    acceptedInvitationCount: safeInvitationStatusCount(sqlite, "accepted"),
    ownerMemberCount: safeMemberRoleCount(sqlite, "owner"),
    invitedMemberCount: safeMemberRoleCount(sqlite, "member"),
    organizationSlug,
  };
}

async function readInviteAcceptPostgresState(
  pool: Pool,
  organizationSlug: string | null
): Promise<BetterAuthSQLiteInviteAcceptHttpSpikeReport["persisted"]> {
  const organizationIds = await pool.query<{ id: string }>(
    'select id from "organization" where slug = $1',
    [organizationSlug]
  );
  const organizationId = organizationIds.rows[0]?.id ?? "";
  const [users, sessions, organizations, members, invitations, accepted, owners, invited] =
    await Promise.all([
      pool.query<{ count: string }>('select count(*) as count from "user"'),
      pool.query<{ count: string }>('select count(*) as count from "session"'),
      pool.query<{ count: string }>(
        'select count(*) as count from "organization" where slug = $1',
        [organizationSlug]
      ),
      pool.query<{ count: string }>(
        'select count(*) as count from "member" where "organizationId" = $1',
        [organizationId]
      ),
      pool.query<{ count: string }>(
        'select count(*) as count from "invitation" where "organizationId" = $1',
        [organizationId]
      ),
      pool.query<{ count: string }>(
        'select count(*) as count from "invitation" where "organizationId" = $1 and status = $2',
        [organizationId, "accepted"]
      ),
      pool.query<{ count: string }>(
        'select count(*) as count from "member" where "organizationId" = $1 and role = $2',
        [organizationId, "owner"]
      ),
      pool.query<{ count: string }>(
        'select count(*) as count from "member" where "organizationId" = $1 and role = $2',
        [organizationId, "member"]
      ),
    ]);

  return {
    userCount: Number(users.rows[0]?.count ?? 0),
    sessionCount: Number(sessions.rows[0]?.count ?? 0),
    organizationCount: Number(organizations.rows[0]?.count ?? 0),
    memberCount: Number(members.rows[0]?.count ?? 0),
    invitationCount: Number(invitations.rows[0]?.count ?? 0),
    acceptedInvitationCount: Number(accepted.rows[0]?.count ?? 0),
    ownerMemberCount: Number(owners.rows[0]?.count ?? 0),
    invitedMemberCount: Number(invited.rows[0]?.count ?? 0),
    organizationSlug,
  };
}

function safeInvitationStatusCount(sqlite: Database.Database, status: string): number {
  if (!listTables(sqlite).includes("invitation")) return 0;
  return Number(
    (
      sqlite.prepare("select count(*) as count from invitation where status = ?").get(status) as {
        count: number;
      }
    ).count
  );
}

function safeMemberRoleCount(sqlite: Database.Database, role: string): number {
  if (!listTables(sqlite).includes("member")) return 0;
  return Number(
    (
      sqlite.prepare("select count(*) as count from member where role = ?").get(role) as {
        count: number;
      }
    ).count
  );
}

function extractJsonString(body: string, key: string): string | null {
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    return typeof parsed[key] === "string" ? parsed[key] : null;
  } catch {
    return null;
  }
}

function skippedPostgres(
  status: "skipped-without-database-url" | "skipped-without-explicit-apply",
  databaseUrlProvided: boolean,
  explicitApply: boolean
): BetterAuthPostgresPortalLiveSpikeReport {
  return {
    generatedFor: "control-plane-portal-spike",
    id: "S1e-postgres",
    store: "postgres",
    status,
    ok: false,
    env: {
      databaseUrlProvided,
      explicitApply,
    },
    boundary: {
      governanceAuthorityGrantedByPortal: false,
      contentPlaneRead: false,
    },
  };
}
