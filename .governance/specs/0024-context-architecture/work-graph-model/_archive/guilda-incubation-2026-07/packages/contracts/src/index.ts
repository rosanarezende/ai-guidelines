// Public contract package for the governance-demo.
//
// Business rules remain in @demo/domain. This package exposes stable seams for
// app/backend/mock-api/test code that should not import concrete adapters.
export * from "./commands/types.ts";
export * from "./api/result.ts";
export * from "./assistant/schemas.ts";
export * from "./auth/schemas.ts";
export * from "./errors/types.ts";
export * from "./growth/schemas.ts";
export * from "./host/schemas.ts";
export * from "./intake/schemas.ts";
export * from "./integrations/schemas.ts";
export * from "./members/schemas.ts";
export * from "./onboarding/schemas.ts";
export * from "./planning/schemas.ts";
export * from "./schemas/constants.ts";
export * from "./triage/schemas.ts";
export * from "./work-sources/schemas.ts";
export * from "./workspace/schemas.ts";
