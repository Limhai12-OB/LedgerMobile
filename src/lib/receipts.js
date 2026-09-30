import { BRANCHES, CATEGORIES } from "./ledger";

export const RECEIPT_STATUSES = [
  "DRAFT",
  "PROCESSING",
  "NEEDS_REVIEW",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
];
export function receiptIssues(form, rows) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Merchant is required.";
  if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0)
    errors.amount = "Enter a positive amount.";
  if (
    !/^2026-\d{2}-\d{2}$/.test(form.date) ||
    Number.isNaN(Date.parse(form.date)) ||
    new Date(form.date).toISOString().slice(0, 10) !== form.date
  )
    errors.date = "Enter a valid date in demo year 2026.";
  if (!CATEGORIES.includes(form.category))
    errors.category = "Choose a known category.";
  if (!["USD", "KHR"].includes(form.currency))
    errors.currency = "Choose USD or KHR.";
  const duplicate = rows.some(
    (t) =>
      t.id !== form.id &&
      t.branch === form.branch &&
      t.name.trim().toLowerCase() === form.name.trim().toLowerCase() &&
      t.date === form.date &&
      Number(t.originalAmount ?? t.amount) === Number(form.amount) &&
      (t.currency || "USD") === form.currency,
  );
  return { errors, duplicate, lowConfidence: form.confidence < 80 };
}
export function receiptRecord(form, role, rows) {
  if (
    !BRANCHES.includes(form.branch) ||
    (role === "manager" && form.branch !== "BKK")
  )
    throw new Error("Receipt must belong to your assigned branch.");
  if (
    form.id &&
    !rows.some(
      (t) => t.id === form.id && (role === "owner" || t.branch === "BKK"),
    )
  )
    throw new Error("Transaction access denied.");
  if (Object.keys(receiptIssues(form, rows).errors).length)
    throw new Error("Review the highlighted fields.");
  return {
    ...form,
    id: form.id || Math.max(0, ...rows.map((t) => t.id)) + 1,
    business: "Dara’s Coffee",
    name: form.name.trim(),
    originalAmount: Number(form.amount),
    amount: Number(form.amount) / (form.currency === "KHR" ? 4000 : 1),
    exchangeRate: form.currency === "KHR" ? 4000 : 1,
    type: "expense",
    createdBy:
      role === "owner" ? "Dara · Business Owner" : "Sokha · Branch Manager",
    status: "APPROVED",
  };
}
