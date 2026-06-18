#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(siteRoot, "..");
const sourceDir = path.join(repoRoot, "docs", "assets");
const outputDir = path.join(siteRoot, "src", "assets", "generated");

const mode = process.argv[2] ?? "check";
const VALID_MODES = new Set(["sync", "check"]);

if (!VALID_MODES.has(mode)) {
  console.error("Uso: node site/scripts/optimize-assets.mjs <sync|check>");
  process.exit(1);
}

async function listFiles(dir, extension) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(extension))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function readIfExists(filePath) {
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function renderWebp(sourcePath) {
  return sharp(sourcePath).webp({ quality: 82, effort: 6 }).toBuffer();
}

async function ensureOutputDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

const sourceFiles = await listFiles(sourceDir, ".png");

if (sourceFiles.length === 0) {
  console.error(`Nenhum PNG encontrado em ${path.relative(repoRoot, sourceDir)}.`);
  process.exit(1);
}

const expectedOutputNames = new Set(
  sourceFiles.map((fileName) => `${path.basename(fileName, path.extname(fileName))}.webp`)
);

const outputFiles = await listFiles(outputDir, ".webp").catch((error) => {
  if (error?.code === "ENOENT") {
    return [];
  }
  throw error;
});

const stale = [];
let originalBytes = 0;
let optimizedBytes = 0;

if (mode === "sync") {
  await ensureOutputDir();
}

for (const fileName of sourceFiles) {
  const sourcePath = path.join(sourceDir, fileName);
  const outputName = `${path.basename(fileName, path.extname(fileName))}.webp`;
  const outputPath = path.join(outputDir, outputName);
  const expected = await renderWebp(sourcePath);
  const actual = await readIfExists(outputPath);
  const sourceStat = await fs.stat(sourcePath);

  originalBytes += sourceStat.size;
  optimizedBytes += expected.length;

  if (actual && Buffer.compare(actual, expected) === 0) {
    continue;
  }

  if (mode === "sync") {
    await fs.writeFile(outputPath, expected);
    console.log(
      `site:assets:sync ${path.relative(repoRoot, outputPath)} (${formatKb(sourceStat.size)} -> ${formatKb(expected.length)})`
    );
    continue;
  }

  stale.push(
    actual
      ? `${path.relative(repoRoot, outputPath)} esta desatualizado`
      : `${path.relative(repoRoot, outputPath)} nao existe`
  );
}

const orphanOutputs = outputFiles.filter((fileName) => !expectedOutputNames.has(fileName));

if (mode === "sync") {
  for (const fileName of orphanOutputs) {
    const orphanPath = path.join(outputDir, fileName);
    await fs.unlink(orphanPath);
    console.log(`site:assets:sync removeu ${path.relative(repoRoot, orphanPath)}`);
  }

  console.log(
    `site:assets:sync concluido — ${sourceFiles.length} imagem(ns), ${formatKb(originalBytes)} PNG -> ${formatKb(optimizedBytes)} WebP.`
  );
  process.exit(0);
}

for (const fileName of orphanOutputs) {
  stale.push(`${path.relative(repoRoot, path.join(outputDir, fileName))} nao tem PNG fonte`);
}

if (stale.length > 0) {
  console.error(
    [
      "site:assets:check encontrou imagens WebP fora de sync:",
      ...stale.map((message) => `- ${message}`),
      "Rode: npm run site:assets:sync",
    ].join("\n")
  );
  process.exit(1);
}

console.log(
  `site:assets:check — ${sourceFiles.length} imagem(ns) sincronizada(s), ${formatKb(originalBytes)} PNG -> ${formatKb(optimizedBytes)} WebP.`
);
