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

function reviewFingerprintOf(parts) {
  return createHash("sha256")
    .update(
      [parts.checkpoint, parts.role, String(parts.findingsEmitted), parts.ids.join(",")].join("\n")
    )
    .digest("hex")
    .slice(0, 12);
}

console.log(
  "F1:",
  fingerprintOf({
    checkpoint: "2.3",
    role: "architectural_review",
    id: "F1",
    severity: "high",
    location: "global",
    description:
      "[B1] SSOT (state.yml topology) contradizia a realidade git: no checkpoint-2.3 fantasma (github_pr null)",
  })
);

console.log(
  "Review:",
  reviewFingerprintOf({
    checkpoint: "2.3",
    role: "architectural_review",
    findingsEmitted: 6,
    ids: ["F1", "F2", "F3", "F4", "F5", "F6"],
  })
);
