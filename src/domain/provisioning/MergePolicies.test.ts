import {
  isUnsupportedHookShape,
  mergeGitattributesContent,
  mergeHookContent,
  mergePrettierIgnoreContent,
} from "./MergePolicies.js";

describe("domain/provisioning/MergePolicies (paridade com cli/fs/merge-utils)", () => {
  it("DADO gitattributes inexistente QUANDO merge ENTÃO retorna baseline puro", () => {
    expect(mergeGitattributesContent(null, "* text=auto eol=lf\n")).toBe("* text=auto eol=lf\n");
    expect(mergeGitattributesContent("", "* text=auto eol=lf\n")).toBe("* text=auto eol=lf\n");
  });

  it("DADO gitattributes incompleto QUANDO merge ENTÃO anexa baseline sob cabeçalho", () => {
    const merged = mergeGitattributesContent(
      "*.png binary\n",
      "* text=auto eol=lf\n*.png binary\n"
    );
    expect(merged).toMatch(/\* text=auto eol=lf/);
    expect(merged).toMatch(/# ai-guidelines baseline/);
    // não-destrutivo: a linha pré-existente do consumidor sobrevive
    expect(merged).toMatch(/\*\.png binary/);
  });

  it("DADO gitattributes já completo QUANDO merge ENTÃO é no-op (retorna idêntico)", () => {
    const existing = "* text=auto eol=lf\n*.png binary\n";
    expect(mergeGitattributesContent(existing, "* text=auto eol=lf\n")).toBe(existing);
  });

  it("DADO prettierignore incompleto QUANDO merge ENTÃO anexa baseline com cabeçalho próprio", () => {
    const merged = mergePrettierIgnoreContent("node_modules/\n", "dist/\nnode_modules/\n");
    expect(merged).toMatch(/dist\//);
    expect(merged).toMatch(/# ai-guidelines prettier baseline/);
  });

  it("DADO hook simples QUANDO merge ENTÃO concatena o comando desejado", () => {
    const merged = mergeHookContent("echo ok\n", "npm run check", false, "pre-commit");
    expect(merged).toMatch(/echo ok/);
    expect(merged).toMatch(/npm run check/);
  });

  it("DADO hook que já contém o comando QUANDO merge ENTÃO normaliza apenas a newline final", () => {
    expect(mergeHookContent("npm run check", "npm run check", false, "pre-commit")).toBe(
      "npm run check\n"
    );
  });

  it("DADO hook inexistente ou force QUANDO merge ENTÃO escreve só o comando", () => {
    expect(mergeHookContent(null, "npm run check", false, "pre-commit")).toBe("npm run check\n");
    expect(mergeHookContent("echo ok\n", "npm run check", true, "pre-commit")).toBe(
      "npm run check\n"
    );
  });

  it("DADO hook com shape incompatível QUANDO merge sem force ENTÃO lança erro", () => {
    expect(() =>
      mergeHookContent('#!/bin/sh\nif [ -n "$CI" ]; then\nfi\n', "npm run check", false, "pre-push")
    ).toThrow(/shape não suportado/);
  });

  it("DADO conteúdo shell QUANDO isUnsupportedHookShape ENTÃO detecta tokens de controle", () => {
    expect(isUnsupportedHookShape("#!/bin/sh\necho ok\n")).toBe(true);
    expect(isUnsupportedHookShape("echo ok\n")).toBe(false);
  });
});
