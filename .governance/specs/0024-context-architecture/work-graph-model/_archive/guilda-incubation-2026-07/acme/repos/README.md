# acme repos — MVP code fixtures

These folders are synthetic source fixtures for the v3 org simulation.

They intentionally keep runtime small: plain ESM modules, no install step, no real network server. The goal is to make the simulated repositories concrete enough for dogfood:

- backend repos expose API-like functions;
- frontend repos consume API/design-system/shell contracts;
- platform repos provide contracts used by product repos;
- data and observability repos expose metric/attestation surfaces;
- the legacy monolith exposes module-level owners and strangler seams.

Run the source smoke from the simulation root:

```bash
node tools/checks/check-code-fixtures.ts
```

The governance SSOT is still the YAML model. These files are product-code fixtures that will let later manifest/context derivation inspect real repo surfaces instead of a flat central catalog.
