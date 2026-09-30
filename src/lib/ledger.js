export const BRANCHES = ["BKK", "Toul Kork", "Siem Reap"];
export const TRANSACTION_KEY = "ledgervision-demo-v2";
export const INVOICE_KEY = "ledgervision-invoices-v1";
export const CATEGORIES = [
  "Ingredients",
  "Sales",
  "Rent",
  "Payroll",
  "Software",
  "Utilities",
  "Other",
];
export const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
export const dateLabel = (value) =>
  value
    ? new Date(value + "T12:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not specified";
export const monthLabel = (value) =>
  new Date(value + "-01T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
export function shiftMonth(month, offset) {
  const [year, number] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number - 1 + offset, 1))
    .toISOString()
    .slice(0, 7);
}
export function percentChange(current, previous) {
  if (!previous)
    return current
      ? "New activity vs previous month"
      : "No change vs previous month";
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "↑" : "↓"} ${Math.abs(change).toFixed(1)}% vs previous month`;
}
export function scopeTransactions(rows, role, branch, month) {
  return rows.filter(
    (t) =>
      (role === "manager"
        ? t.branch === "BKK"
        : branch === "all" || t.branch === branch) && t.date.startsWith(month),
  );
}
export function ledgerTotals(rows) {
  const revenue = rows
    .filter((t) => t.type === "income")
    .reduce((a, t) => a + t.amount, 0);
  const expenses = rows
    .filter((t) => t.type === "expense")
    .reduce((a, t) => a + t.amount, 0);
  return {
    revenue,
    expenses,
    profit: revenue - expenses,
    margin: revenue ? ((revenue - expenses) / revenue) * 100 : 0,
  };
}
export function expenseCategories(rows) {
  const sums = {};
  rows
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      sums[t.category] = (sums[t.category] || 0) + t.amount;
    });
  return Object.entries(sums).sort((a, b) => b[1] - a[1]);
}
export function validTransactions(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (t) =>
        t &&
        Number.isFinite(t.id) &&
        typeof t.name === "string" &&
        typeof t.category === "string" &&
        Number.isFinite(t.amount) &&
        t.amount > 0 &&
        BRANCHES.includes(t.branch) &&
        ["income", "expense"].includes(t.type) &&
        /^2026-\d{2}-\d{2}$/.test(t.date),
    )
  );
}
export function csvFor(rows) {
  const cell = (value) =>
    '"' +
    String(value ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replace(/"/g, '""') +
    '"';
  return (
    "\ufeff" +
    [
      ["Date", "Merchant", "Category", "Type", "Branch", "Amount USD", "Note"],
      ...rows.map((t) => [
        t.date,
        t.name,
        t.category,
        t.type,
        t.branch,
        t.amount,
        t.note,
      ]),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n")
  );
}
const branches = BRANCHES;
export function seed() {
  let rows = [];
  let id = 1;
  const rev = [8400, 7200, 9800],
    cost = [5100, 4500, 6600];
  for (let m = 4; m <= 9; m++)
    branches.forEach((b, i) => {
      const factor = 1 - (9 - m) * 0.055;
      let income = Math.round(rev[i] * factor),
        expense = Math.round(cost[i] * factor);
      [
        ["Coffee sales", "Sales", "income", income - 890, 12],
        ["Counter sales", "Sales", "income", 890, 28],
        ["Monthly rent", "Rent", "expense", Math.round(expense * 0.4), 2],
        ["Team payroll", "Payroll", "expense", Math.round(expense * 0.35), 24],
        [
          "Angkor Market",
          "Ingredients",
          "expense",
          expense - Math.round(expense * 0.4) - Math.round(expense * 0.35) - 95,
          27,
        ],
        ["Cloud software", "Software", "expense", 95, 29],
      ].forEach(([name, category, type, amount, day]) =>
        rows.push({
          id: id++,
          name,
          category,
          type,
          amount,
          branch: b,
          date: `2026-${String(m).padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
          note: "Sample transaction",
        }),
      );
    });
  return rows;
}
