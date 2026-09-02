# Bugs found

Add one section per issue. Bug 1 is filled in to show the format — fix it, then write what you changed. Copy the blank template for the rest.

Keep this file in the repo and **commit it** with your fixes.

---

## Bug 1

**How to reproduce:** Open the app. The expense list says “Newest first”. The first row is Wine (7 Mar). Board game (15 Mar) is further down.

**What is wrong:** The list is showing oldest expenses first. Newest should be at the top.

**What I changed:**

---

## Bug 2

**How to reproduce:** Select a person from the "Paid by" dropdown in the Filter section to filter expenses by who paid them.

**What is wrong:** The filter doesn't show any expenses because the value from the select dropdown is a string (e.g., `"1"`), but the expense `paidBy` id is a number (e.g., `1`). The strict inequality check (`!==`) fails due to this type mismatch, filtering out all expenses.

**What I changed:** In `src/App.jsx`, I wrapped the `paidBy` value with `Number()` during the filter check: `e.paidBy !== Number(paidBy)`.

---
