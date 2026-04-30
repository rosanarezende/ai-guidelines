import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isUnsupportedHookShape,
  mergeGitattributesContent,
  mergeHookContent,
  mergePrettierIgnoreContent,
} from "./merge-utils.mjs";

describe("fs/merge-utils", () => {
  it("DADO gitattributes incompleto QUANDO mergeGitattributesContent ENTÃO anexa baseline", () => {
    const existing = "*.png binary\n";
    const baseline = "* text=auto eol=lf\n*.png binary\n";

    const merged = mergeGitattributesContent(existing, baseline);

    assert.match(merged, /\* text=auto eol=lf/);
    assert.match(merged, /ai-guidelines baseline/);
  });

  it("DADO prettierignore incompleto QUANDO mergePrettierIgnoreContent ENTÃO anexa baseline", () => {
    const merged = mergePrettierIgnoreContent("node_modules/\n", "dist/\nnode_modules/\n");

    assert.match(merged, /dist\//);
    assert.match(merged, /ai-guidelines prettier baseline/);
  });

  it("DADO hook com shape incompatível QUANDO mergeHookContent ENTÃO lança erro", () => {
    assert.throws(
      () =>
        mergeHookContent(
          '#!/bin/sh\nif [ -n "$CI" ]; then\nfi\n',
          "npm run check",
          false,
          "pre-push"
        ),
      /shape não suportado/
    );
  });

  it("DADO hook simples QUANDO mergeHookContent ENTÃO concatena comando", () => {
    const merged = mergeHookContent("echo ok\n", "npm run check", false, "pre-commit");

    assert.match(merged, /echo ok/);
    assert.match(merged, /npm run check/);
  });

  it("DADO conteúdo shell QUANDO isUnsupportedHookShape ENTÃO detecta token", () => {
    assert.equal(isUnsupportedHookShape("#!/bin/sh\necho ok\n"), true);
    assert.equal(isUnsupportedHookShape("echo ok\n"), false);
  });
});
