import { toNextJsHandler } from "better-auth/next-js";
import { portalAuthHandler } from "@/server/auth/portal-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(portalAuthHandler);
