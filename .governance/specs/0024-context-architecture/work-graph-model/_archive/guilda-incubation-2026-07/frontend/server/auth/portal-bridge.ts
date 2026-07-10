// portal-bridge.ts — adapter between Better Auth identity and the local shell.
//
// Better Auth authenticates the person and maintains portal organization
// membership. The local shell still owns workspace state, governance host,
// invitations, role proposals and derived authority.
import { portalAuthBaseUrl, portalAuthHandler } from "./portal-auth";

export type PortalUser = {
  id: string;
  email?: string;
  name?: string;
};

export type PortalSession = {
  user: PortalUser;
};

export type PortalOrganizationRef = {
  id: string;
  slug?: string;
  name?: string;
};

export type PortalInvitationRef = {
  id: string;
  organizationId?: string;
};

type PortalResult<T> = { ok: true; value: T } | { ok: false; error: string; status: number };

async function callPortalAuth(
  request: Request,
  path: string,
  options?: { method?: "GET" | "POST"; body?: Record<string, unknown> }
): Promise<{ status: number; body: unknown; text: string }> {
  const baseUrl = portalAuthBaseUrl();
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  headers.set("origin", request.headers.get("origin") || new URL(baseUrl).origin);
  if (options?.body) headers.set("content-type", "application/json");

  const response = await portalAuthHandler(
    new Request(`${baseUrl}${path}`, {
      method: options?.method || "GET",
      headers,
      ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
    })
  );
  const text = await response.text();
  let body: unknown = null;
  if (text.trim()) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: response.status, body, text };
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringField(value: unknown, key: string): string | undefined {
  const item = record(value)?.[key];
  return typeof item === "string" && item.trim() ? item.trim() : undefined;
}

function nested(value: unknown, key: string): unknown {
  return record(value)?.[key];
}

function extractPortalUser(value: unknown): PortalUser | null {
  const body = record(value);
  const user = record(body?.user) || record(record(body?.data)?.user);
  const id = stringField(user, "id");
  if (!id) return null;
  return {
    id,
    ...(stringField(user, "email") ? { email: stringField(user, "email") } : {}),
    ...(stringField(user, "name") ? { name: stringField(user, "name") } : {}),
  };
}

function extractOrganizations(value: unknown): PortalOrganizationRef[] {
  const raw = Array.isArray(value)
    ? value
    : Array.isArray(nested(value, "data"))
      ? (nested(value, "data") as unknown[])
      : Array.isArray(nested(value, "organizations"))
        ? (nested(value, "organizations") as unknown[])
        : [];
  return raw
    .map((item) => {
      const id = stringField(item, "id");
      if (!id) return null;
      return {
        id,
        ...(stringField(item, "slug") ? { slug: stringField(item, "slug") } : {}),
        ...(stringField(item, "name") ? { name: stringField(item, "name") } : {}),
      };
    })
    .filter((item): item is PortalOrganizationRef => Boolean(item));
}

function extractInvitation(value: unknown): PortalInvitationRef | null {
  const candidate = record(value)?.data || value;
  const id = stringField(candidate, "id");
  if (!id) return null;
  return {
    id,
    ...(stringField(candidate, "organizationId")
      ? { organizationId: stringField(candidate, "organizationId") }
      : {}),
  };
}

export async function readPortalSession(request: Request): Promise<PortalResult<PortalSession>> {
  const response = await callPortalAuth(request, "/get-session");
  if (response.status === 401 || response.status === 404) {
    return { ok: false, error: "no-portal-session", status: 401 };
  }
  const user = extractPortalUser(response.body);
  if (!user) return { ok: false, error: "no-portal-session", status: 401 };
  return { ok: true, value: { user } };
}

export async function ensurePortalOrganization(
  request: Request,
  input: {
    name: string;
    slug: string;
  }
): Promise<PortalResult<PortalOrganizationRef>> {
  const listed = await callPortalAuth(request, "/organization/list");
  if (listed.status === 200) {
    const existing = extractOrganizations(listed.body).find((item) => item.slug === input.slug);
    if (existing) return { ok: true, value: existing };
  }

  const created = await callPortalAuth(request, "/organization/create", {
    method: "POST",
    body: { name: input.name, slug: input.slug },
  });
  if (created.status < 200 || created.status >= 300) {
    return {
      ok: false,
      error: `portal-organization-create-failed:${created.status}`,
      status: created.status,
    };
  }
  const org = extractOrganizations([created.body])[0];
  if (!org) return { ok: false, error: "portal-organization-create-invalid", status: 502 };
  return { ok: true, value: org };
}

export async function invitePortalMember(
  request: Request,
  input: {
    workspaceId: string;
    email: string;
  }
): Promise<PortalResult<PortalInvitationRef>> {
  const listed = await callPortalAuth(request, "/organization/list");
  if (listed.status !== 200) {
    return { ok: false, error: `portal-organization-list-failed:${listed.status}`, status: 502 };
  }
  const organization = extractOrganizations(listed.body).find(
    (item) => item.slug === input.workspaceId
  );
  if (!organization) return { ok: false, error: "portal-organization-not-linked", status: 422 };

  const invited = await callPortalAuth(request, "/organization/invite-member", {
    method: "POST",
    body: { email: input.email, role: "member", organizationId: organization.id },
  });
  if (invited.status < 200 || invited.status >= 300) {
    return { ok: false, error: `portal-invite-failed:${invited.status}`, status: invited.status };
  }
  const invite = extractInvitation(invited.body);
  if (!invite) return { ok: false, error: "portal-invite-invalid", status: 502 };
  return { ok: true, value: { ...invite, organizationId: organization.id } };
}

export async function acceptPortalInvitation(
  request: Request,
  input: {
    invitationId: string;
  }
): Promise<PortalResult<PortalInvitationRef>> {
  const accepted = await callPortalAuth(request, "/organization/accept-invitation", {
    method: "POST",
    body: { invitationId: input.invitationId },
  });
  if (accepted.status < 200 || accepted.status >= 300) {
    return { ok: false, error: `portal-invite-accept-failed:${accepted.status}`, status: 422 };
  }
  return { ok: true, value: { id: input.invitationId } };
}
