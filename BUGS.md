# Bugs Found & Fixed

This document tracks all the identified bugs in FairShare and details the steps taken to fix them.

## Table of Contents
- [Bug 1: Expense List Sorting](#bug-1-expense-list-sorting)
- [Bug 2: Paid By Filter Type Mismatch](#bug-2-paid-by-filter-type-mismatch)
- [Bug 3: Deductions for Non-Participating Payers](#bug-3-deductions-for-non-participating-payers)
- [Bug 4: Missing Transfers on Exact Settlement Matches](#bug-4-missing-transfers-on-exact-settlement-matches)
- [Bug 5: Rounding and Floating-Point Issues in Splits](#bug-5-rounding-and-floating-point-issues-in-splits)
- [Bug 6: Inverted Balance Labels](#bug-6-inverted-balance-labels)
- [Bug 7: Date Hydration from Local Storage](#bug-7-date-hydration-from-local-storage)
- [Bug 8: SummaryCards Stale Data](#bug-8-summarycards-stale-data)
- [Bug 9: ISO String Date Formatting](#bug-9-iso-string-date-formatting)
- [Bug 10: Form State and Timezone Shifts](#bug-10-form-state-and-timezone-shifts)
- [Bug 11: Member ID String Concatenation](#bug-11-member-id-string-concatenation)
- [Bug 12: Static Header Description Text](#bug-12-static-header-description-text)

---

## Bug 1: Expense List Sorting

**How to reproduce:** Open the app. The expense list says “Newest first”. The first row is Wine (7 Mar). Board game (15 Mar) is further down.

**What is wrong:** The list is rendering the expenses in their original, unsorted insertion order (oldest first). This UI bug occurred due to two critical issues: first, the initial configuration state erroneously defaulted to an oldest-first paradigm despite the UI indicating otherwise; second, the internal sorting function completely failed because `dateValue` was erroneously returning a raw string. When JavaScript attempts to subtract strings during a sorting pass, it yields `NaN`, which breaks the sort comparator entirely.

**What I changed:** 
1. In `src/lib/format.js`, I updated `dateValue` to return a numeric timestamp using `new Date(date).getTime()`. 
2. In `src/components/ExpenseList.jsx`, I changed the sorting logic to subtract `a.date` from `b.date` (`dateValue(b.date) - dateValue(a.date)`), sorting the expenses descending by date (newest first).

---

## Bug 2: Paid By Filter Type Mismatch

**How to reproduce:** In the Filter section, use the "Paid by" dropdown to isolate expenses paid by a specific person. The expense list will unexpectedly empty out and show zero results, regardless of who is selected.

**What is wrong:** The filter logic is performing a strict type comparison (`!==`), but the data types are mismatched. The HTML `<select>` element inherently yields string values (e.g., `"1"`), whereas the internal expense objects store the `paidBy` identifier as an integer (e.g., `1`). Because `"1" !== 1` evaluates to true in a strict context, every single expense is filtered out of the view.

**What I changed:** In `src/App.jsx`, I wrapped the `paidBy` value with `Number()` during the filter check: `e.paidBy !== Number(paidBy)`.

---

## Bug 3: Deductions for Non-Participating Payers

**How to reproduce:** Create a new expense where the individual who paid the bill is deliberately excluded from the "Split between" list (e.g., Alice pays for Bob and Charlie's meal, but didn't eat herself).

**What is wrong:** If the payer was not in the split list, a share was incorrectly deducted from their balance anyway.

**What I changed:** In `src/lib/balances.js`, I located and entirely removed the erroneous `if` block that was responsible for blindly penalizing the payer. The balance engine now strictly calculates deductions based solely on the individuals officially checked in the split list.

---

## Bug 4: Missing Transfers on Exact Settlement Matches

**How to reproduce:** Log expenses in such a way that one person is owed an exact dollar amount, and another person happens to owe that exact same dollar amount (a perfect 1:1 match).

**What is wrong:** The `settle` algorithm uses a two-pointer approach to match debtors with creditors. When the algorithm encountered a perfect match (where the debt exactly equaled the credit), it successfully updated the pointers to move to the next individuals, but completely failed to push the actual transfer record into the final array. This resulted in "lost" money that was never accounted for in the UI.

**What I changed:** In `src/lib/settle.js`, I amended the `else` condition (which triggers on an exact match) to properly assemble the transfer object and execute `transfers.push(...)` before incrementing the `i` and `j` pointers.

---

## Bug 5: Rounding and Floating-Point Issues in Splits

**How to reproduce:** 1. Log an expense of $100 split equally among 3 people. Each person is assigned $33.33, totaling $99.99, losing $0.01 from the group total. 2. Enter custom percentage splits such as `33.33%`, `33.33%`, and `33.34%`. The form rejects submission with *"Percentages must add to 100"* due to IEEE 754 float representation `100.00000000000001`.

**What is wrong:** 
1. `splitEqual()` in `src/lib/money.js` performed simple division and fixed-point rounding without distributing remainder cents across participants.
2. `percentsSumTo100()` in `src/lib/money.js` used strict equality `=== 100` rather than floating-point tolerance check.

**What I changed:** 
1. Refactored `splitEqual()` and `splitByPercent()` in `src/lib/money.js` to allocate exact cent-level shares and distribute any remainder cents so the sum of individual shares always precisely equals the full bill amount.
2. Updated `percentsSumTo100()` to use `Math.abs(sum - 100) < 0.01` to safely accommodate floating-point variations.

---

## Bug 6: Inverted Balance Labels

**How to reproduce:** Look at the "Balances" panel on the right side of the UI. Locate any user who has paid out more money than they have consumed.

**What is wrong:** The application fundamentally misunderstood the polarity of balances. It displayed the text "owes" for users with a mathematically positive balance, and "is owed" for users with a negative balance. A positive balance indicates the user is in credit (they overpaid relative to their consumption) and should therefore be *owed* money by the group.

**What I changed:** In `src/components/BalancesPanel.jsx`, I inverted the threshold logic inside the rendering block. Now, if a user's balance evaluates to `bal > 0.005`, the component correctly maps it to the "is owed" label and associated CSS class, and correctly maps negative balances (`bal < -0.005`) to "owes".

---

## Bug 7: Date Hydration from Local Storage

**How to reproduce:** Add a few expenses, then perform a hard refresh on the browser tab. The dates in the expense list UI will silently degrade to raw sliced strings rather than localized, human-readable date formats.

**What is wrong:** State persistence relied on standard `localStorage` serialization. In `src/state/store.js`, the `loadState()` function retrieved the cached state and blindly returned `JSON.parse(raw)`. Because `JSON.stringify` permanently flattens `Date` objects into ISO strings, the rehydrated state contained string primitives rather than JavaScript `Date` instances, which subsequently caused `instanceof Date` checks in the UI formatters to fail.

**What I changed:** I intercepted the raw parsed JSON in `src/state/store.js` and wrapped it in a `hydrate()` pipeline before returning it. This hydration step iterates over the stored expenses array and explicitly reconstructs proper `new Date()` instances from the ISO strings, ensuring the application state remains robust across reloads.

---

## Bug 8: SummaryCards Stale Data

**How to reproduce:** Inside the Summary panel, create a new member (e.g., "Eve"). The total "Members" metric increments correctly, but the detailed "Paid so far" breakdown list fails to append the new member.

**What is wrong:** In `src/components/SummaryCards.jsx`, the internal `perPerson` array was tightly memoized using a `useMemo` hook that exclusively tracked changes to `[expenses]`. Because it failed to declare `members` as a dependency, the React reconciliation engine refused to recalculate the breakdown when the group roster changed, leading to stale UI state.

**What I changed:** I corrected the React hook dependency array by declaring `[members, expenses]` to ensure the block evaluates whenever the roster expands. Additionally, I fortified the paid-by filter loop inside the memoized block by enforcing string parity `String(e.paidBy) === String(m.id)` to safeguard against hidden type collisions.

---

## Bug 9: ISO String Date Formatting

**How to reproduce:** Inject a raw date string (e.g., `"2026-03-12"`) into `formatDate()`. The UI will output the raw string `"2026-03-12"` instead of applying the standard `"12 Mar 2026"` localization mask.

**What is wrong:** The `formatDate()` utility function in `src/lib/format.js` possessed an overly aggressive string-handler fallback. If it detected a string type, it immediately short-circuited and executed `date.slice(0, 10)`, completely bypassing the `toLocaleDateString` engine meant to standardize the visual presentation of dates across the app.

**What I changed:** I rewrote the primary `formatDate()` guard logic in `src/lib/format.js`. The function now aggressively coerces string payloads into full `Date` instances via `new Date(date)` prior to evaluation. This guarantees that all inputs are routed through the `toLocaleDateString("en-IN")` formatter for a unified user experience.

---

## Bug 10: Form State and Timezone Shifts

**How to reproduce:** 
1. Fill out the "Add expense" form and click "Save expense". The expense is added, but the description and amount fields retain their previous values instead of clearing.
2. Select a specific date for an expense (e.g., "Mar 16 2026"). Depending on your timezone, the expense may appear in the list as being from the day before (e.g., "Mar 15 2026").

**What is wrong:** 
1. The `submit` handler in `src/components/AddExpenseForm.jsx` never reset the state for `description` or `amount` after successfully calling `onAdd`.
2. Parsing the date string directly with `new Date(date)` (e.g. `new Date("2026-03-16")`) defaults to UTC midnight, which shifts backward into the previous day when displayed in timezones behind UTC.

**What I changed:** 
1. Added `setDescription("")` and `setAmount("")` to the end of the `submit` function in `src/components/AddExpenseForm.jsx`.
2. Updated the date construction to `new Date(date + "T00:00:00")` so that the local browser timezone is correctly assumed when parsing the date string.

---

## Bug 11: Member ID String Concatenation

**How to reproduce:** Register a new group member. If the current highest member ID in the system happens to be stored as a string (e.g., `"10"`), the newly generated ID will erroneously evaluate to `"101"` instead of `11`.

**What is wrong:** In `src/state/store.js`, the `nextMemberId` function utilized a generic greater-than operator (`x.id > m`) to establish the maximum ID. If `x.id` was a string type, JavaScript evaluated the comparison as a string comparison, and ultimately stored the string primitive into the `max` variable. When the script attempted to increment `max + 1`, JavaScript executed string concatenation rather than mathematical addition.

**What I changed:** I introduced strict runtime type coercion within the `nextMemberId` reduce loop in `src/state/store.js`. By wrapping the variables as `Number(x.id)`, the system is mathematically guaranteed to calculate and store a numeric primitive in `max`, preventing accidental string concatenation when generating subsequent unique identifiers.

---

## Bug 12: Static Header Description Text

**How to reproduce:** Look at the static description text inside the main header container. Add a fifth or sixth member to the group roster using the Summary panel. The topbar incorrectly continues to claim the app is tracking "Shared expenses for four friends".

**What is wrong:** The subtitle text in the header was permanently hardcoded in the JSX markup, rendering it entirely ignorant of the application's actual dynamic state and member roster length.

**What I changed:** I swapped out the static hardcoded header description string in `src/App.jsx` for an inline dynamic JSX expression that evaluates and displays the correct count in real-time: `Shared expenses for {state.members.length} friends.`.
