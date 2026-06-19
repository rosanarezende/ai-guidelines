#!/usr/bin/env node

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(siteRoot, "..");
const sourceDir = path.join(repoRoot, "docs", "assets");
const outputDir = path.join(siteRoot, "src", "assets", "generated");
const manifestPath = path.join(outputDir, "manifest.json");

// Parâmetros do encoder. Determinismo do CHECK NÃO depende dos bytes WebP
// re-renderizados (que variam por versão de sharp/libvips), e sim do HASH da
// fonte PNG + destes parâmetros. Uma troca de libvips muda os bytes mas NÃO
// quebra o check; só uma mudança real na FONTE ou nos parâmetros invalida o
// manifesto. Fecha o achado B3 (check não-determinístico por encoder).
const ENCODER = { quality: 82, effort: 6 };

const mode = process.argv[2] ?? "check";
const VALID_MODES = new Set(["sync", "check"]);

if (!VALID_MODES.has(mode)) {
  console.error("Uso: node site/scripts/optimize-assets.mjs <sync|check>");
  process.exit(1);
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function outputNameFor(sourceName) {
  return `${path.basename(sourceName, path.extname(sourceName))}.webp`;
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function listFiles(dir, extension) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch((error) => {
    if (error?.code === "ENOENT") return [];
    throw error;
  });

  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(extension))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function readManifest() {
  try {
    return JSON.parse(await fs.readFile(manifestPath, "utf-8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function renderWebp(sourcePath) {
  return sharp(sourcePath)
    .webp({ ...ENCODER })
    .toBuffer();
}

const sourceFiles = await listFiles(sourceDir, ".png");

if (sourceFiles.length === 0) {
  console.error(`Nenhum PNG encontrado em ${path.relative(repoRoot, sourceDir)}.`);
  process.exit(1);
}

const expectedOutputNames = new Set(sourceFiles.map(outputNameFor));
const outputFiles = await listFiles(outputDir, ".webp");

if (mode === "sync") {
  await fs.mkdir(outputDir, { recursive: true });

  const images = [];
  let originalBytes = 0;
  let optimizedBytes = 0;

  for (const fileName of sourceFiles) {
    const sourcePath = path.join(sourceDir, fileName);
    const outputName = outputNameFor(fileName);
    const outputPath = path.join(outputDir, outputName);
    const sourceBuffer = await fs.readFile(sourcePath);
    const webp = await renderWebp(sourcePath);

    originalBytes += sourceBuffer.length;
    optimizedBytes += webp.length;

    await fs.writeFile(outputPath, webp);
    images.push({ source: fileName, output: outputName, sourceSha256: sha256(sourceBuffer) });
    console.log(
      `site:assets:sync ${path.relative(repoRoot, outputPath)} (${formatKb(sourceBuffer.length)} -> ${formatKb(webp.length)})`
    );
  }

  // Remove WebP órfãos (sem PNG fonte) antes de escrever o manifesto.
  for (const fileName of outputFiles.filter((name) => !expectedOutputNames.has(name))) {
    await fs.unlink(path.join(outputDir, fileName));
    console.log(
      `site:assets:sync removeu ${path.relative(repoRoot, path.join(outputDir, fileName))}`
    );
  }

  const manifest = { encoder: { ...ENCODER }, images };
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    `site:assets:sync concluido — ${sourceFiles.length} imagem(ns), ${formatKb(originalBytes)} PNG -> ${formatKb(optimizedBytes)} WebP. Manifesto: ${path.relative(repoRoot, manifestPath)}.`
  );
  process.exit(0);
}

// ---- check: determinístico, sem re-encode/byte-compare ----
const problems = [];
const manifest = await readManifest();

if (manifest === null) {
  problems.push(`${path.relative(repoRoot, manifestPath)} não existe`);
} else if (
  manifest.encoder?.quality !== ENCODER.quality ||
  manifest.encoder?.effort !== ENCODER.effort
) {
  problems.push(
    `parâmetros do encoder no manifesto (${JSON.stringify(manifest.encoder)}) diferem do script (${JSON.stringify(ENCODER)})`
  );
}

const manifestImages = new Map((manifest?.images ?? []).map((image) => [image.source, image]));

for (const fileName of sourceFiles) {
  const entry = manifestImages.get(fileName);
  const outputName = outputNameFor(fileName);
  if (!entry) {
    problems.push(`${fileName} não está no manifesto`);
    continue;
  }
  const sourceSha = sha256(await fs.readFile(path.join(sourceDir, fileName)));
  if (entry.sourceSha256 !== sourceSha) {
    problems.push(`${fileName} mudou (hash da fonte diverge do manifesto)`);
  }
  if (!outputFiles.includes(outputName)) {
    problems.push(`${path.relative(repoRoot, path.join(outputDir, outputName))} não existe`);
  }
}

// Órfãos: entradas de manifesto e WebP sem PNG fonte correspondente.
const sourceSet = new Set(sourceFiles);
for (const entry of manifest?.images ?? []) {
  if (!sourceSet.has(entry.source)) {
    problems.push(`manifesto referencia ${entry.source}, que não tem PNG fonte`);
  }
}
for (const fileName of outputFiles.filter((name) => !expectedOutputNames.has(name))) {
  problems.push(`${path.relative(repoRoot, path.join(outputDir, fileName))} não tem PNG fonte`);
}

if (problems.length > 0) {
  console.error(
    [
      "site:assets:check encontrou imagens WebP fora de sync:",
      ...problems.map((message) => `- ${message}`),
      "Rode: npm run site:assets:sync",
    ].join("\n")
  );
  process.exit(1);
}

console.log(
  `site:assets:check — ${sourceFiles.length} imagem(ns) verificada(s) por hash da fonte + parâmetros (sem comparar bytes WebP).`
);
