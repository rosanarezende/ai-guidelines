// assert-match.ts — matchers de match parcial para node:test, cobrindo o que a
// migração das seeds do Playwright usava (toMatchObject / objectContaining /
// arrayContaining / toContainEqual) sem depender do runner do Playwright.
import assert from "node:assert/strict";

// Match parcial recursivo: todo campo de `subset` precisa existir e casar em
// `actual`. Objetos aninhados são parciais; arrays no subset são exatos.
export function matchObject(actual: unknown, subset: Record<string, unknown>, path = "root"): void {
  assert.ok(actual && typeof actual === "object", `${path}: esperado objeto`);
  const record = actual as Record<string, unknown>;
  for (const [key, expected] of Object.entries(subset)) {
    const got = record[key];
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      matchObject(got, expected as Record<string, unknown>, `${path}.${key}`);
    } else if (Array.isArray(expected)) {
      assert.deepEqual(got, expected, `${path}.${key}`);
    } else {
      assert.equal(got, expected, `${path}.${key}`);
    }
  }
}

// Todo objeto de `subsets` precisa casar (parcial) com ALGUM item do array.
export function arrayContainsMatch(
  actual: unknown,
  subsets: Record<string, unknown>[],
  path = "root"
): void {
  assert.ok(Array.isArray(actual), `${path}: esperado array`);
  const items = actual as unknown[];
  for (const subset of subsets) {
    const found = items.some((item) => {
      try {
        matchObject(item, subset);
        return true;
      } catch {
        return false;
      }
    });
    assert.ok(found, `${path}: nenhum item casa ${JSON.stringify(subset)}`);
  }
}

// O array contém ALGUM item deep-equal exato a `item`.
export function arrayContainsExact(actual: unknown, item: unknown, path = "root"): void {
  assert.ok(Array.isArray(actual), `${path}: esperado array`);
  const items = actual as unknown[];
  const found = items.some((element) => {
    try {
      assert.deepEqual(element, item);
      return true;
    } catch {
      return false;
    }
  });
  assert.ok(found, `${path}: nenhum item == ${JSON.stringify(item)}`);
}
