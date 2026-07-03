import { NextRequest, NextResponse } from "next/server";
import type { AssistantConnectionResult } from "../../../../../../../../_lib/domain";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_OLLAMA_ENDPOINT = "http://127.0.0.1:11434";
const CHECKED_PATH = "/api/tags";
const REQUEST_TIMEOUT_MS = 1500;
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

function result(
  data: Omit<AssistantConnectionResult, "provider" | "checkedPath">
): AssistantConnectionResult {
  return {
    provider: "ollama",
    checkedPath: CHECKED_PATH,
    ...data,
  };
}

function parseEndpoint(value: string | null): URL | null {
  try {
    return new URL(value || DEFAULT_OLLAMA_ENDPOINT);
  } catch {
    return null;
  }
}

function isAllowedLocalEndpoint(endpoint: URL): boolean {
  return endpoint.protocol === "http:" && LOOPBACK_HOSTS.has(endpoint.hostname);
}

function tagsUrl(endpoint: URL): string {
  const url = new URL(endpoint.toString());
  url.pathname = CHECKED_PATH;
  url.search = "";
  url.hash = "";
  return url.toString();
}

function extractModelNames(payload: unknown): string[] | null {
  if (!payload || typeof payload !== "object") return null;
  const models = (payload as { models?: unknown }).models;
  if (!Array.isArray(models)) return null;
  return models
    .map((model) => {
      if (!model || typeof model !== "object") return null;
      const name = (model as { name?: unknown }).name;
      return typeof name === "string" ? name : null;
    })
    .filter((name): name is string => Boolean(name))
    .sort();
}

export async function GET(request: NextRequest) {
  const endpoint = parseEndpoint(request.nextUrl.searchParams.get("endpoint"));
  if (!endpoint || !isAllowedLocalEndpoint(endpoint)) {
    return NextResponse.json(
      result({
        ok: false,
        endpoint: endpoint?.toString() || "invalid",
        models: [],
        error: "blocked-endpoint",
        messageKey: "assistant.ollama.health.blockedEndpoint",
      }),
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(tagsUrl(endpoint), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    const payload = (await response.json().catch(() => null)) as unknown;
    const models = extractModelNames(payload);
    if (!response.ok || !models) {
      return NextResponse.json(
        result({
          ok: false,
          endpoint: endpoint.toString(),
          models: [],
          error: "invalid-response",
          messageKey: "assistant.ollama.health.invalidResponse",
        }),
        { status: 502 }
      );
    }
    return NextResponse.json(
      result({
        ok: true,
        endpoint: endpoint.toString(),
        models,
        messageKey: "assistant.ollama.health.ok",
      })
    );
  } catch {
    return NextResponse.json(
      result({
        ok: false,
        endpoint: endpoint.toString(),
        models: [],
        error: "unreachable",
        messageKey: "assistant.ollama.health.unreachable",
      }),
      { status: 200 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
