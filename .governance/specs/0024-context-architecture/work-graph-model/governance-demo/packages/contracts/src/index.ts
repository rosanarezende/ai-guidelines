// Public contract package for the governance-demo.
//
// Business rules remain in @demo/domain. This package exposes stable seams for
// app/backend/mock-api/test code that should not import concrete adapters.
export * from "./commands/types.ts";
export * from "./api/result.ts";
export * from "./errors/types.ts";
export * from "./schemas/constants.ts";
