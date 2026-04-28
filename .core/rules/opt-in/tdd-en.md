# TDD: Test-Driven Development (Red-Green-Refactor)

> This rule instructs AI agents to follow the strict TDD cycle.
> **Focus:** code structure, feedback loop and coverage.

---

## Mandatory Cycle (Strict TDD)

Every new feature or bug fix MUST follow this cycle:

1. **RED:** Write a failing test — define the expected behavior before any implementation.
2. **GREEN:** Write the minimum code necessary to make the test pass. No premature optimizations.
3. **REFACTOR:** Improve the code (naming, structure, DRY) while keeping all tests green.

> **Rule:** Never skip the RED step. Code without a previously failing test is not TDD.

---

## Structural Principles

- **One Test, One Intent:** Each test case validates exactly one behavior. Avoid "omni-bus" tests.
- **Isolation:** Unit tests must not depend on external services, network or databases. Use mocks/stubs for dependencies.
- **Colocation:** Test files should live in the same directory as the code under test (e.g., `engine.mjs` → `engine.test.mjs`).
- **Coverage as Gate:** Minimum recommended **85%** line coverage. Exceptions must be documented.

---

## Rules for AI Agents

- When receiving a task, write tests BEFORE the implementation.
- Generate edge cases based on the spec before implementing the logic.
- If an existing test breaks during refactoring, fix it before proceeding.
- Never delete or disable tests to make the build pass.
