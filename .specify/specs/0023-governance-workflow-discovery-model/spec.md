<!-- ai-guidelines-template: spec-boilerplate v=1 -->

# Spec 0023 — Governance Workflow & Discovery Model

> Status: **Stage A (Discovery)**
> Author: (to be filled)
> Date: 2026-05-19
> Owner: Rosana Rezende
> Type: `meta` (methodology / governance)
> 
> **Stage A policy:** This spec intentionally starts with *only* `spec.md` + `NEXT.md`. No decision-brief, plan, or tasks until discovery produces evidence and the gate is explicitly opened.

---

## 🎯 Objective

Define a **governance-first** lifecycle and artifact model that prevents premature planning and reduces recurring churn.

Deliverables of this spec are **process artifacts and conventions** (not runtime rewrite):
- lifecycle stages and gates
- workflow taxonomy (at the right abstraction level)
- artifact taxonomy (universal vs workflow-specific)
- definition of `research.md` as a first-class artifact
- placement policy for deep research (directory + naming + citation rules)

---

## ✅ Out of scope (explicit)

This spec must **not** become a mega-spec. It is **not** a vehicle for:
- runtime rewrite or CLI migration
- engine convergence (TemplateEngine / recipes)
- redesigning existing code architecture
- mass implementation or repo restructuring
- rewriting all existing boilerplates in this PR

If discovery reveals a concrete implementation track, it becomes a **new spec** or a **follow-up PR** with explicit scope.

---

## 🧭 Problem statement

Current practice tends to create `decision-brief`, `plan`, and `tasks` too early. That causes:
- planning based on implicit/fragile assumptions
- repeated reopen cycles and churn
- specs that “feel” structured but are epistemically weak

We need a lifecycle that:
- separates discovery from delivery
- makes evidence explicit
- clarifies what different work types require (patch vs experiment vs incident vs delivery etc.)
- keeps governance-first positioning (AI-as-channel)

---

## 🔎 Discovery questions

During Stage A, answer with evidence (not opinions):

1. What are the **entities** in this system?
   - workflow family vs artifact vs lifecycle stage vs governance context vs operational state

2. Where do the **7 pillars** live taxonomically?
   - Are they workflow families? governance contexts? decision objects? containers?

3. Which artifacts should be **universal** vs **workflow-specific**?

4. What is the minimal contract for `research.md`?
   - what evidence it must contain
   - what it must reference
   - what it must *not* do (becoming a plan)

5. What is the placement policy for deep research?
   - proposed: `.core/research/` by theme

---

## 📦 Expected outputs of Stage A

- A draft workflow taxonomy (hypotheses + rationale)
- A draft artifact taxonomy (universal vs specific)
- A draft lifecycle (stages + gates)
- A proposed directory policy for deep research + minimal citation rules

No implementation until the gate is opened.
