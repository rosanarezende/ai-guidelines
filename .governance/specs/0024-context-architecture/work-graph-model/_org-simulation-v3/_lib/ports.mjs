// ports.mjs — contratos da runtime v3. Mantido em JS para a sim, mas desenhado como porta.

/**
 * @typedef {object} HostGovernanceRepository
 * @property {() => object} loadOrg Carrega o snapshot autoritativo da governanca host + publicacoes repo-local.
 */

/**
 * @typedef {object} ValidationIssue
 * @property {"error"|"warn"} level
 * @property {string} rule
 * @property {string} node
 * @property {string} msg
 */

/**
 * @typedef {object} GovernanceRuntime
 * @property {HostGovernanceRepository} repository
 * @property {() => object} loadOrg
 * @property {(org: object) => ValidationIssue[]} validateOrg
 */

export {};
