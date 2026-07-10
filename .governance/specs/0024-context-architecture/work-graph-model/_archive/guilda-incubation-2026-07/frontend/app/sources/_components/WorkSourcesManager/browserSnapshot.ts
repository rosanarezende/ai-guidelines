export type BrowserSnapshot = {
  label: string;
  fileCount: number;
  contentHash: string;
};

export async function createBrowserSnapshot(files: FileList): Promise<BrowserSnapshot> {
  const allFiles = Array.from(files);
  const visibleFiles = allFiles.slice(0, 2000);
  const inventory = visibleFiles
    .map((file) => `${file.webkitRelativePath || file.name}:${file.size}`)
    .sort()
    .join("\n");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(inventory));
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
  const firstPath = visibleFiles[0]?.webkitRelativePath || visibleFiles[0]?.name || "pasta local";
  const label = firstPath.split("/")[0] || "pasta local";
  return {
    label,
    fileCount: visibleFiles.length,
    contentHash: `${hash}${allFiles.length > visibleFiles.length ? "+trunc" : ""}`,
  };
}
