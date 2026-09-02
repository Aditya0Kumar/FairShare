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

**How to reproduce:** 
1. Log an expense of $100 split equally among 3 people. Each person was assigned $33.33, totaling $99.99, losing $0.01 from the group total.
2. Enter custom percentage splits such as `33.33%`, `33.33%`, and `33.34%`. The form rejects submission with *"Percentages must add to 100"* due to IEEE 754 float representation `100.00000000000001`.

**What is wrong:** 
1. `splitEqual()` in `src/lib/money.js` performed simple division and fixed-point rounding without distributing remainder cents across participants.
2. `percentsSumTo100()` in `src/lib/money.js` used strict equality `=== 100` rather than floating-point tolerance check.

**What I changed:** 
1. Refactored `splitEqual()` and `splitByPercent()` in `src/lib/money.js` to allocate exact cent-level shares and distribute any remainder cents so the sum of individual shares always precisely equals the full bill amount.
2. Updated `percentsSumTo100()` to use `Math.abs(sum - 100) < 0.01` to safely accommodate floating-point variations.

---

## Bug 6

**How to reproduce:** Look at the "Balances" section on the right side of the app. Look for anyone who paid for an expense.

**What is wrong:** The app displays "owes" for users with a positive balance and "is owed" for users with a negative balance. This is backward—if you have a positive balance (you paid for others more than you consumed), you are *owed* money.

**What I changed:** In `src/components/BalancesPanel.jsx`, I swapped the labels and CSS classes inside the `if` conditions so that `bal > 0.005` maps to "is owed" and `bal < -0.005` maps to "owes".

---

## Bug 7

**How to reproduce:** Add new expenses and refresh the browser page. The dates in the expense list fallback to raw string slicing instead of formatted locale dates (`toLocaleDateString("en-IN")`).

**What is wrong:** In `src/state/store.js`, `loadState()` returned `JSON.parse(raw)` directly when retrieving cached state from `localStorage`. Because `JSON.stringify` converts `Date` instances into ISO string primitives, the retrieved expenses contained strings for `date` instead of JavaScript `Date` objects, failing `date instanceof Date` checks.

**What I changed:** Updated `loadState()` in `src/state/store.js` to pass `JSON.parse(raw)` through `hydrate()`, ensuring all expense dates are restored as valid `Date` objects upon page reloads.

---

## Bug 8

**How to reproduce:** In the Summary panel, add a new member (e.g., "Eve"). The Members count increases from 4 to 5, but the "Paid so far" breakdown list does not show "Eve ($0.00)" and remains showing only the initial 4 members.

**What is wrong:** In `src/components/SummaryCards.jsx`, the `perPerson` calculation was memoized with `useMemo(..., [expenses])`, omitting `members` from the dependency array. When `members` changed, `perPerson` did not recompute.

**What I changed:** Added `members` to the `useMemo` dependency array (`[members, expenses]`) and used type-safe comparison `String(e.paidBy) === String(m.id)` in `src/components/SummaryCards.jsx`.

---

## Bug 9

**How to reproduce:** When date strings (e.g., `"2026-03-12"`) are passed to `formatDate()`, they are displayed in raw unformatted ISO format (`"2026-03-12"`) rather than the application's standard formatted date string (`"12 Mar 2026"`).

**What is wrong:** `formatDate()` in `src/lib/format.js` checked `if (typeof date === "string") return date.slice(0, 10);`, bypassing locale date formatting for string inputs.

**What I changed:** Updated `formatDate()` in `src/lib/format.js` to parse string date inputs into `Date` instances and format them consistently using `toLocaleDateString("en-IN")`.

---
