import { NodeClipboard, clipboardInstallHint } from "./NodeClipboard.js";

describe("Infrastructure — NodeClipboard [BR-INFRA-CLIPBOARD]", () => {
  it("DADO detector retornando null QUANDO copy ENTÃO retorna false sem throw", async () => {
    const clipboard = new NodeClipboard(() => null);

    const result = await clipboard.copy("hello");

    expect(result).toBe(false);
  });

  it("DADO comando inexistente QUANDO copy ENTÃO retorna false (fail-graceful) sem throw", async () => {
    const clipboard = new NodeClipboard(() => ({
      command: "comando-que-nao-existe-no-sistema-xyz",
      args: [],
    }));

    const result = await clipboard.copy("hello");

    expect(result).toBe(false);
  });

  it("DADO detector retornando comando válido (node consumindo stdin) QUANDO copy ENTÃO retorna true", async () => {
    // `process.execPath` (o próprio Node) como comando fake cross-platform:
    // não depende de `cat`/coreutils (ausentes como executável no Windows
    // nativo — no PowerShell `cat` é alias, não binário visível ao spawn).
    const clipboard = new NodeClipboard(() => ({
      command: process.execPath,
      args: [
        "-e",
        "process.stdin.resume(); process.stdin.on('data', () => {}); process.stdin.on('end', () => process.exit(0));",
      ],
    }));

    const result = await clipboard.copy("hello");

    expect(result).toBe(true);
  });
});

describe("Infrastructure — clipboardInstallHint [BR-INFRA-CLIPBOARD]", () => {
  const originalPlatform = process.platform;
  const originalEnv = { ...process.env };

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
    process.env = { ...originalEnv };
  });

  it("DADO macOS ENTÃO retorna null (sem hint necessário)", () => {
    Object.defineProperty(process, "platform", { value: "darwin" });
    expect(clipboardInstallHint()).toBeNull();
  });

  it("DADO WSL2 (WSL_DISTRO_NAME set) ENTÃO retorna null (clip.exe nativo)", () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    process.env.WSL_DISTRO_NAME = "Ubuntu";
    delete process.env.WAYLAND_DISPLAY;
    expect(clipboardInstallHint()).toBeNull();
  });

  it("DADO Linux Wayland ENTÃO retorna hint wl-clipboard", () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    delete process.env.WSL_DISTRO_NAME;
    process.env.WAYLAND_DISPLAY = "wayland-0";
    const hint = clipboardInstallHint();
    expect(hint).toContain("wl-clipboard");
    expect(hint).toContain("apt install");
  });

  it("DADO Linux X11 ENTÃO retorna hint xclip", () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    delete process.env.WSL_DISTRO_NAME;
    delete process.env.WAYLAND_DISPLAY;
    const hint = clipboardInstallHint();
    expect(hint).toContain("xclip");
    expect(hint).toContain("apt install");
  });
});
