# Bugs found

Add one section per issue. Bug 1 is filled in to show the format — fix it, then write what you changed. Copy the blank template for the rest.

Keep this file in the repo and **commit it** with your fixes.

---

## Bug 1

**How to reproduce:** Open the app. The expense list says “Newest first”. The first row is Wine (7 Mar). Board game (15 Mar) is further down.

**What is wrong:** The list is showing the expenses in the original unsorted order (oldest first). This happened for two reasons: the sort order was configured to show oldest first, and the sorting mechanism was completely broken because `dateValue` was returning a string instead of a numeric timestamp. Subtracting strings in JavaScript results in `NaN`, which breaks the sort function.

**What I changed:** 
1. In `src/lib/format.js`, I updated `dateValue` to return a numeric timestamp using `new Date(date).getTime()`. 
2. In `src/components/ExpenseList.jsx`, I changed the sorting logic to subtract `a.date` from `b.date` (`dateValue(b.date) - dateValue(a.date)`), sorting the expenses descending by date (newest first).

---

## Bug 2

**How to reproduce:** Select a person from the "Paid by" dropdown in the Filter section to filter expenses by who paid them.

**What is wrong:** The filter doesn't show any expenses because the value from the select dropdown is a string (e.g., `"1"`), but the expense `paidBy` id is a number (e.g., `1`). The strict inequality check (`!==`) fails due to this type mismatch, filtering out all expenses.

**What I changed:** In `src/App.jsx`, I wrapped the `paidBy` value with `Number()` during the filter check: `e.paidBy !== Number(paidBy)`.

---
