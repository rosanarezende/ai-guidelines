import { createHash } from "crypto";

function fingerprintOf(parts) {
  return createHash("sha256")
    .update(
      [
        parts.checkpoint,
        parts.role,
        parts.id,
        parts.severity,
        parts.location,
        parts.description,
      ].join("\n")
    )
    .digest("hex")
    .slice(0, 12);
}

const f = {
  checkpoint: "2.3",
  role: "architectural_review",
  id: "B1",
  severity: "low",
  location: "global",
  description: "Bypass finding",
};

console.log(fingerprintOf(f));
