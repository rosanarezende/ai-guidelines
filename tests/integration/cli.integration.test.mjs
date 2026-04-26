import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as cliEntrypoint from "../../cli/ai-guidelines-cli.mjs";

describe("entrypoint", () => {
  it("DADO CLI entrypoint module QUANDO imported ENTÃO exposes execute and main", () => {
    assert.equal(typeof cliEntrypoint.execute, "function");
    assert.equal(typeof cliEntrypoint.main, "function");
  });
});
