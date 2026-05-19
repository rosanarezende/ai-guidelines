import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalize, assertByteEquivalent } from "./template-equivalence.mjs";

describe("template-equivalence: normalize()", () => {
  it("E1 — converte CRLF para LF", () => {
    assert.equal(normalize("a\r\nb\r\nc\r\n"), "a\nb\nc\n");
  });

  it("E1 — converte CR isolado para LF", () => {
    assert.equal(normalize("a\rb\rc\r"), "a\nb\nc\n");
  });

  it("E1 — mistura CRLF + LF + CR fica tudo LF", () => {
    assert.equal(normalize("a\r\nb\nc\r"), "a\nb\nc\n");
  });

  it("E2 — garante exatamente uma newline final mesmo sem nenhuma", () => {
    assert.equal(normalize("conteudo sem newline"), "conteudo sem newline\n");
  });

  it("E2 — colapsa múltiplas newlines finais em exatamente uma", () => {
    assert.equal(normalize("conteudo\n\n\n\n"), "conteudo\n");
  });

  it("E2 — preserva blank lines intermediárias", () => {
    assert.equal(normalize("a\n\nb\n"), "a\n\nb\n");
  });

  it("E3 — remove trailing spaces em cada linha", () => {
    assert.equal(normalize("a   \nb\t\nc\n"), "a\nb\nc\n");
  });

  it("E3 — remove trailing mix de spaces e tabs", () => {
    assert.equal(normalize("a \t \t\nb\n"), "a\nb\n");
  });

  it("E3 — preserva whitespace líder/interno (apenas trailing é alvo)", () => {
    assert.equal(normalize("    a    b   \n"), "    a    b\n");
  });

  it("idempotência: normalize(normalize(x)) === normalize(x)", () => {
    const inputs = [
      "",
      "a",
      "a\r\nb\r\n",
      "a   \nb\t\n\n\n",
      "linha1\nlinha2\nlinha3\n",
      "\n\n\n",
      "a\nb",
    ];
    for (const input of inputs) {
      const once = normalize(input);
      const twice = normalize(once);
      assert.equal(twice, once, `idempotência falhou para ${JSON.stringify(input)}`);
    }
  });

  it("input vazio → newline única (E2)", () => {
    assert.equal(normalize(""), "\n");
  });

  it("input só com whitespace → newline única (E2 + E3)", () => {
    assert.equal(normalize("   \t\n\n   \n"), "\n");
  });

  it("lança TypeError para input não-string", () => {
    assert.throws(() => normalize(null), TypeError);
    assert.throws(() => normalize(undefined), TypeError);
    assert.throws(() => normalize(123), TypeError);
    assert.throws(() => normalize(Buffer.from("ok")), TypeError);
  });
});

describe("template-equivalence: assertByteEquivalent()", () => {
  it("passa silenciosamente quando inputs normalizados são iguais", () => {
    assert.doesNotThrow(() => assertByteEquivalent("a\r\nb\n", "a\nb", "test-1"));
  });

  it("passa com trailing whitespace diferente (E3 normaliza)", () => {
    assert.doesNotThrow(() => assertByteEquivalent("a   \nb\n", "a\nb\n", "test-2"));
  });

  it("lança erro com contexto e diff legível quando difere", () => {
    let caught;
    try {
      assertByteEquivalent("linha 1\nlinha 2\n", "linha 1\nlinha DIFERENTE\n", "my-recipe");
    } catch (err) {
      caught = err;
    }
    assert.ok(caught, "deveria ter lançado");
    assert.equal(caught.code, "TEMPLATE_EQUIVALENCE_MISMATCH");
    assert.equal(caught.context, "my-recipe");
    assert.match(caught.message, /my-recipe/);
    assert.match(caught.message, /line 2/);
    assert.match(caught.message, /linha DIFERENTE/);
    assert.match(caught.message, /linha 2/);
  });

  it("trunca diff após 5 linhas divergentes", () => {
    const actual = Array.from({ length: 10 }, (_, i) => `a${i}`).join("\n");
    const expected = Array.from({ length: 10 }, (_, i) => `b${i}`).join("\n");
    let caught;
    try {
      assertByteEquivalent(actual, expected, "big-diff");
    } catch (err) {
      caught = err;
    }
    assert.ok(caught);
    assert.match(caught.message, /truncated/);
  });
});
