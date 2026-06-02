const findingIds = new Set(["architectural_review#F1", "technical_audit#F1"]);
const rFinding = "technical_audit#F1";
const matches = [...findingIds].some((fid) => fid.endsWith("#" + rFinding));
console.log(matches);
