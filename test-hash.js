import { createHash } from "crypto";

function f(loc, desc) {
  return createHash("sha256")
    .update(["CP", "ROLE", "F1", "high", loc, desc].join("\n"))
    .digest("hex")
    .slice(0, 12);
}

console.log(f("x\ny", "z"));
console.log(f("x", "y\nz"));
