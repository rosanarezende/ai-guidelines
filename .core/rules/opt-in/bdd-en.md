# BDD: Behavior-Driven Development (Given/When/Then)

> This rule instructs AI agents to structure tests in BDD format.
> **Focus:** ubiquitous language, traceability and living documentation.

---

## Mandatory Format

All tests MUST use the **GIVEN / WHEN / THEN** structure:

- **GIVEN** [initial scenario / precondition / system state]
- **WHEN** [action performed by the user or system]
- **THEN** [expected result / assertion]

### Example

```javascript
it("GIVEN user without permission WHEN accessing dashboard THEN returns 403 error", () => {
  // ...
});
```

---

## Traceability (Business Rules)

- Each documented business rule MUST have a unique identifier (e.g., `[BR-CLI-SYNC-01]`).
- Tests validating that rule MUST include the identifier in their name.
- This ensures any regression is traceable back to the original spec.

```javascript
it("[BR-CLI-SYNC-01] GIVEN outdated baseline WHEN adopt is executed THEN syncs only changed files", () => {
  // ...
});
```

---

## BDD Principles

- **Ubiquitous Language:** Tests should be readable by non-technical humans. Avoid implementation jargon in test names.
- **Living Documentation:** The test suite serves as executable documentation of the system. If a test doesn't clearly describe the behavior, rewrite it.
- **Atomic Scenarios:** Each `it()` describes exactly one scenario. Don't combine multiple flows.

---

## Rules for AI Agents

- When creating tests, ALWAYS use the GIVEN/WHEN/THEN format in the test case name.
- When receiving a business rule (`[BR-*]`), include the ID in the corresponding test.
- Generate scenarios for happy path, alternative flow and error cases.
- Prioritize readability over brevity in test names.
