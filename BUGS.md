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

## Bug 3

**How to reproduce:** Create an expense where the person who paid is not part of the split. Or create an expense that doesn't divide equally (e.g. $100 split 3 ways). Or create a scenario where someone owes exactly what they are owed.

**What is wrong:** The financial logic had three bugs: 
1. If the payer was not in the split, a share was incorrectly deducted from their balance.
2. If a debtor owed the exact same amount a creditor was owed, the settlement algorithm skipped recording the transfer.
3. When splitting amounts equally, rounding errors left cents unaccounted for (e.g. $100 / 3 = $99.99 total), leaving the group's total balances off by a few cents.

**What I changed:** 
1. In `src/lib/balances.js`, removed the erroneous `if` block that deducted a share from the payer if they weren't in the split list.
2. In `src/lib/settle.js`, added the missing `transfers.push(...)` block in the `else` case when amounts perfectly match.
3. In `src/lib/money.js`, updated `splitEqual` to calculate the remainder and assign it to the last person in the split to ensure the total perfectly matches the expense amount.

---
