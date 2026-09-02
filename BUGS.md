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

**How to reproduce:** Create an expense where the person who paid is not explicitly included in the split.

**What is wrong:** If the payer was not in the split list, a share was incorrectly deducted from their balance anyway.

**What I changed:** In `src/lib/balances.js`, removed the erroneous `if` block that deducted a share from the payer if they weren't in the split list.

---

## Bug 4

**How to reproduce:** Create a scenario where a debtor owes the exact same amount a creditor is owed.

**What is wrong:** The settlement algorithm successfully matches the debtor and creditor but entirely skips recording the actual transfer.

**What I changed:** In `src/lib/settle.js`, added the missing `transfers.push(...)` block in the `else` case when the amounts perfectly match.

---

## Bug 5

**How to reproduce:** Create an expense that doesn't divide equally into cents (e.g. $100 split 3 ways).

**What is wrong:** When splitting amounts equally, rounding errors left cents unaccounted for (e.g. $100 / 3 = $33.33 each, giving a $99.99 total), leaving the group's total balances slightly off.

**What I changed:** In `src/lib/money.js`, updated `splitEqual` to calculate the exact remainder and assign it to the last person in the split to ensure the sum perfectly matches the total expense amount.

---

## Bug 6

**How to reproduce:** Look at the "Balances" section on the right side of the app. Look for anyone who paid for an expense.

**What is wrong:** The app displays "owes" for users with a positive balance and "is owed" for users with a negative balance. This is backward—if you have a positive balance (you paid for others more than you consumed), you are *owed* money.

**What I changed:** In `src/components/BalancesPanel.jsx`, I swapped the labels and CSS classes inside the `if` conditions so that `bal > 0.005` maps to "is owed" and `bal < -0.005` maps to "owes".

---
