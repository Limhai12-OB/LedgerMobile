"use client";
import { useEffect, useState } from "react";
import { useLedger } from "./mobile-app";
import {
  BRANCHES,
  CATEGORIES,
  csvFor,
  expenseCategories,
  ledgerTotals,
  money,
  monthLabel,
  scopeTransactions,
  seed,
  shiftMonth,
  percentChange,
} from "@/lib/ledger";
import { Button, Field, Heading, Icon, Modal } from "./ui";

export function Filters() {
  const { role, branch, setBranch, month, setMonth } = useLedger();
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2.5">
      {role === "manager" ? (
        <span className="badge">BKK Branch - Automatically assigned</span>
      ) : (
        <select
          aria-label="Branch"
          disabled={role === "manager"}
          value={role === "manager" ? "BKK" : branch}
          onChange={(e) => setBranch(e.target.value)}
          className="max-w-[48%] rounded-lg border border-line bg-white px-3 py-2.5 text-xs"
        >
          {role === "owner" && <option value="all">All branches</option>}
          {BRANCHES.filter((b) => role === "owner" || b === "BKK").map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      )}
      <select
        aria-label="Reporting month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="max-w-[48%] rounded-lg border border-line bg-white px-3 py-2.5 text-xs"
      >
        {[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((m) => {
          const v = `2026-${String(m).padStart(2, "0")}`;
          return (
            <option key={v} value={v}>
              {monthLabel(v)}
            </option>
          );
        })}
      </select>
      <small className="text-[11px] text-muted">
        USD · Sample business data
      </small>
    </div>
  );
}
function Stats() {
  const { rows, transactions, role, branch, month } = useLedger();
  const t = ledgerTotals(rows);
  const previous = ledgerTotals(
    scopeTransactions(transactions, role, branch, shiftMonth(month, -1)),
  );
  return (
    <div className="mb-5 grid grid-cols-2 gap-2.5">
      {[
        [
          "Total revenue",
          money(t.revenue),
          percentChange(t.revenue, previous.revenue),
          "up",
        ],
        [
          "Total expenses",
          money(t.expenses),
          percentChange(t.expenses, previous.expenses),
          "down",
        ],
        ["Net profit", money(t.profit), "revenue minus expenses", "reports"],
        ["Profit margin", t.margin.toFixed(1) + "%", "of total revenue", "ai"],
      ].map(([label, amount, note, icon], i) => (
        <div
          key={label}
          className={`rounded-[13px] border p-4 ${i === 0 ? "border-brand bg-brand text-white" : "border-line bg-white"}`}
        >
          <div
            className={`flex items-center justify-between gap-1 text-xs ${i === 0 ? "text-[#cfdfd4]" : "text-muted"}`}
          >
            <span>{label}</span>
            <Icon name={icon} className="size-[18px]" />
          </div>
          <div className="my-3 text-[25px] font-semibold tracking-[-1px]">
            {amount}
          </div>
          <small
            className={`text-[10px] ${i === 0 ? "text-[#cfdfd4]" : "text-muted"}`}
          >
            {note}
          </small>
        </div>
      ))}
    </div>
  );
}
function Chart() {
  const { transactions, role, branch, month } = useLedger();
  const series = Array.from({ length: 6 }, (_, i) => {
    const m = shiftMonth(month, i - 5);
    return {
      m,
      t: ledgerTotals(scopeTransactions(transactions, role, branch, m)),
    };
  });
  const ceiling =
    Math.ceil(
      Math.max(
        1000,
        ...series.map((s) => Math.max(s.t.revenue, s.t.expenses)),
      ) / 5000,
    ) * 5000;
  return (
    <section className="card">
      <div className="mb-5 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">Income vs Spending</h2>
          <small className="text-[10px] text-muted">
            Income and spending over time
          </small>
        </div>
        <div className="flex gap-2 text-[10px] text-muted">
          <span>
            <i className="mr-1 inline-block size-1.5 rounded-full bg-brand" />
            Income
          </span>
          <span>
            <i className="mr-1 inline-block size-1.5 rounded-full bg-[#bed2a1]" />
            Expenses
          </span>
        </div>
      </div>
      <div
        className="flex h-[213px] gap-3 pt-2"
        role="img"
        aria-label="Six month income and expense chart"
      >
        <div className="flex flex-col justify-between pb-6 text-[9px] text-muted">
          <span>{money(ceiling)}</span>
          <span>{money(ceiling / 2)}</span>
          <span>$0</span>
        </div>
        <div className="min-w-0 flex-1">
          <svg
            viewBox="0 0 300 180"
            className="h-[180px] w-full"
            role="img"
            aria-label="Monthly income and spending lines"
          >
            {[10, 85, 160].map((y) => (
              <line key={y} x1="8" x2="292" y1={y} y2={y} stroke="#eef1ec" />
            ))}
            {[
              ["revenue", "#216652"],
              ["expenses", "#8aab72"],
            ].map(([key, color]) => (
              <g key={key}>
                <polyline
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  points={series
                    .map(
                      (s, i) =>
                        `${10 + i * 56},${160 - (s.t[key] / ceiling) * 150}`,
                    )
                    .join(" ")}
                />
                {series.map((s, i) => (
                  <circle
                    key={s.m}
                    cx={10 + i * 56}
                    cy={160 - (s.t[key] / ceiling) * 150}
                    r="4"
                    fill={color}
                  >
                    <title>
                      {s.m}: {key} {money(s.t[key])}
                    </title>
                  </circle>
                ))}
              </g>
            ))}
          </svg>
          <div className="flex justify-between text-[10px] text-muted">
            {series.map((s) => (
              <span key={s.m}>
                {new Date(s.m + "-01T12:00:00").toLocaleDateString("en", {
                  month: "short",
                })}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-5 text-[10px] text-muted">
        Six months ending in selected month · Jan–Mar have no demo entries
      </p>
    </section>
  );
}
function TransactionRows({ rows }) {
  const { setEditor } = useLedger();
  if (!rows.length)
    return (
      <div className="py-10 text-center text-sm text-muted">
        No transactions found.
        <p className="mt-2 text-xs">
          Try another filter or add your first entry.
        </p>
      </div>
    );
  return rows.map((t) => (
    <button
      key={t.id}
      onClick={() => setEditor(t)}
      className="flex w-full items-center gap-3 border-b border-[#edf0eb] py-3.5 text-left last:border-0 hover:bg-[#fafbf8]"
    >
      <span
        className={`grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-[#f0f3eb] ${t.type === "income" ? "text-brand" : "text-danger"}`}
      >
        <Icon
          name={t.type === "income" ? "up" : "down"}
          className="size-[18px]"
        />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-[13px] wrap-anywhere">{t.name}</b>
        <small className="mt-1 block text-[10px] text-muted">
          {t.category} · {t.branch} · {t.date}
        </small>
      </span>
      <span
        className={`text-xs font-semibold whitespace-nowrap ${t.type === "income" ? "text-brand" : "text-danger"}`}
      >
        {t.type === "income" ? "+" : "−"}
        {money(t.amount)}
      </span>
    </button>
  ));
}
function sorted(rows) {
  return [...rows].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}
export function Dashboard() {
  const {
    role,
    rows,
    branch,
    setBranch,
    navigate,
    setEditor,
    storageAvailable,
  } = useLedger();
  const t = ledgerTotals(rows);
  const largest = expenseCategories(rows)[0];
  const list = (
    role === "manager" ? ["BKK"] : branch === "all" ? BRANCHES : [branch]
  )
    .map((b) => ({ b, t: ledgerTotals(rows.filter((t) => t.branch === b)) }))
    .sort((a, b) => b.t.revenue - a.t.revenue);
  const max = Math.max(1, ...list.map((x) => x.t.revenue));
  return (
    <>
      <Heading
        title={`A little clarity, ${role === "owner" ? "Dara" : "Sokha"}.`}
        subtitle="Here’s how your business is doing. Let’s make it a good month."
      >
        <Button primary onClick={() => setEditor({})}>
          <Icon name="plus" className="size-4" />
          Add transaction
        </Button>
      </Heading>
      <Filters />
      <Stats />
      <p className="mb-5 rounded-xl border border-line bg-white p-3 text-xs">
        Cash flow summary - In {money(t.revenue)} / Out {money(t.expenses)} /
        Net {money(t.profit)}
      </p>
      <section className="card mb-5">
        <h2 className="mb-3 font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["capture", "Capture Receipt"],
            ["voice", "Voice Invoice"],
            ["ai", "Ask AI"],
            ["transactions", "View Transactions"],
          ].map(([target, label]) => (
            <Button key={target} onClick={() => navigate(target)}>
              <Icon name={target} />
              {label}
            </Button>
          ))}
        </div>
      </section>
      <div className="grid gap-[17px]">
        <Chart />
        <section className="card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 font-semibold">
              <Icon name="ai" className="size-4" />A clearer picture
            </h2>
            <span className="badge">DEMO AI</span>
          </div>
          {[
            [
              "Profitability",
              t.profit >= 0
                ? "Your business is in the green."
                : "Spending is ahead of income.",
              `You ${t.profit >= 0 ? "kept" : "lost"} ${money(Math.abs(t.profit))} this month, with a ${t.margin.toFixed(1)}% margin.`,
            ],
            [
              "Worth a closer look",
              largest
                ? `${largest[0]} is your biggest expense.`
                : "Start with your first transaction.",
              largest
                ? `${money(largest[1])} in the selected period. Review this category to identify savings.`
                : "Add income or spending to build your business picture.",
            ],
          ].map(([tag, title, detail]) => (
            <div
              key={tag}
              className="mt-3 rounded-[10px] border border-[#e6edda] bg-[#f3f6eb] p-4"
            >
              <div className="mb-2 text-[10px] tracking-widest text-brand uppercase">
                {tag}
              </div>
              <b className="text-[13px]">{title}</b>
              <p className="mt-2 text-xs leading-6 text-[#607067]">{detail}</p>
            </div>
          ))}
          <button className="link mt-2" onClick={() => navigate("ai")}>
            Explore with your AI assistant →
          </button>
        </section>
        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent transactions</h2>
            <button className="link" onClick={() => navigate("transactions")}>
              View all →
            </button>
          </div>
          <TransactionRows rows={sorted(rows).slice(0, 4)} />
        </section>
        {role === "owner" && (
          <section className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">
                {role === "owner" ? "Branch performance" : "Your branch"}
              </h2>
              <small className="text-muted">By revenue</small>
            </div>
            {list.map(({ b, t }) => (
              <button
                key={b}
                className="flex w-full items-center gap-3 border-b border-line py-4 text-left last:border-0"
                onClick={() => {
                  setBranch(b);
                  navigate("reports");
                }}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f0f3eb]">
                  <Icon name="branch" className="size-[18px]" />
                </span>
                <span className="flex-1">
                  <b className="text-xs">{b}</b>
                  <small className="mt-1 block text-[11px] text-muted">
                    Expenses {money(t.expenses)} / Profit {money(t.profit)}
                  </small>
                  <span className="mt-2 block h-[5px] rounded-full bg-[#edf1e8]">
                    <span
                      className="block h-full rounded-full bg-[#8aab72]"
                      style={{ width: `${(t.revenue / max) * 100}%` }}
                    />
                  </span>
                </span>
                <span className="text-xs font-semibold">
                  Revenue {money(t.revenue)}
                </span>
              </button>
            ))}
          </section>
        )}
      </div>
      <footer className="mt-6 flex justify-between gap-3 text-[10px] text-muted">
        <span>LedgerVision · Your business, in focus</span>
        <span>
          {storageAvailable ? "Saved on this browser" : "Session-only storage"}
        </span>
      </footer>
    </>
  );
}
function ExportButton({ rows }) {
  const { month, notify } = useLedger();
  function download() {
    const url = URL.createObjectURL(
      new Blob([csvFor(rows)], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledgervision-${month}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(`Exported ${rows.length} transactions`);
  }
  return (
    <Button onClick={download}>
      <Icon name="download" className="size-4" />
      Export CSV
    </Button>
  );
}
export function Transactions() {
  const { rows, setEditor } = useLedger();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const filtered = sorted(
    rows.filter(
      (t) =>
        (type === "all" || t.type === type) &&
        `${t.name} ${t.category} ${t.branch}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    ),
  );
  return (
    <>
      <Heading
        title="Every detail, accounted for."
        subtitle="Track, review, and organize your business transactions."
      >
        <Button primary onClick={() => setEditor({})}>
          <Icon name="plus" className="size-4" />
          Add transaction
        </Button>
      </Heading>
      <Filters />
      <section className="card">
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            type="search"
            aria-label="Search transactions"
            placeholder="Search merchant or category…"
            className="input text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-lg border border-line bg-white px-3 text-xs"
            aria-label="Transaction type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
          <ExportButton rows={filtered} />
        </div>
        <TransactionRows rows={filtered} />
        <p className="mt-4 text-[11px] text-muted">
          {filtered.length} transactions · Tap an entry to review or edit
        </p>
      </section>
    </>
  );
}
export function Reports() {
  const { rows } = useLedger();
  const t = ledgerTotals(rows);
  const score = Math.max(0, Math.min(100, Math.round(t.margin * 2 + 10)));
  return (
    <>
      <Heading
        title="The bigger picture."
        subtitle="A practical snapshot of your business performance."
      >
        <ExportButton rows={rows} />
      </Heading>
      <Filters />
      <Stats />
      <div className="grid gap-[17px]">
        <Chart />
        <section className="card">
          <h2 className="mb-4 font-semibold">Spending breakdown</h2>
          {expenseCategories(rows).map(([c, a]) => (
            <div
              key={c}
              className="flex items-center gap-5 border-b border-line py-3 last:border-0"
            >
              <div className="flex-1">
                <b className="text-xs">{c}</b>
                <div className="mt-2 h-[5px] rounded-full bg-[#edf1e8]">
                  <div
                    className="h-full rounded-full bg-[#8aab72]"
                    style={{
                      width: `${t.expenses ? (a / t.expenses) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-xs">{money(a)}</span>
            </div>
          ))}
          {!t.expenses && <p className="muted-copy">No expenses this month.</p>}
        </section>
        <section className="card flex items-center gap-4">
          <div
            className="grid size-[80px] shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(#216652 ${score}%,#e9eee1 0)`,
            }}
          >
            <span className="grid size-16 place-items-center rounded-full bg-white text-2xl font-semibold">
              {score}
            </span>
          </div>
          <div>
            <h2 className="font-semibold">Demo business health</h2>
            <p className="muted-copy">
              {t.profit >= 0
                ? "Income is covering expenses."
                : "Expenses exceed income."}{" "}
              Your profit margin is {t.margin.toFixed(1)}%.
            </p>
            <p className="text-[10px] text-muted">
              Illustrative score: margin × 2 + 10, capped between 0 and 100.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
export function TransactionModal() {
  const {
    editor,
    setEditor,
    month,
    branch,
    role,
    transactions,
    saveTransactions,
    setMonth,
    setBranch,
    navigate,
    notify,
  } = useLedger();
  const [form, setForm] = useState(() => ({
    name: "",
    type: "expense",
    amount: "",
    date: month + "-30",
    category: "Ingredients",
    branch: role === "manager" ? "BKK" : branch === "all" ? "BKK" : branch,
    note: "",
    ...editor,
  }));
  const [deleting, setDeleting] = useState(false);
  const change = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  useEffect(
    () => () => {
      if (editor.receipt) URL.revokeObjectURL(editor.receipt);
    },
    [editor.receipt],
  );
  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const record = {
      ...form,
      id: form.id || Math.max(0, ...transactions.map((t) => t.id)) + 1,
      name: form.name.trim(),
      amount: Number(form.amount),
      ...(form.receipt
        ? { originalAmount: Number(form.amount) * (form.exchangeRate || 1) }
        : {}),
      branch: role === "manager" ? "BKK" : form.branch,
    };
    if (
      role === "manager" &&
      editor.id &&
      transactions.find((t) => t.id === editor.id)?.branch !== "BKK"
    )
      return;
    const saved = saveTransactions(
      editor.id
        ? transactions.map((t) => (t.id === editor.id ? record : t))
        : [...transactions, record],
    );
    setMonth(record.date.slice(0, 7));
    setBranch(record.branch);
    navigate("transactions");
    notify(
      saved
        ? "Transaction saved. Your dashboard is up to date."
        : "Transaction saved for this session only.",
    );
  }
  return (
    <Modal
      title={
        deleting
          ? "Delete this transaction?"
          : editor.id
            ? "Transaction details"
            : "Add a transaction"
      }
      onClose={() => setEditor(null)}
    >
      {deleting ? (
        <>
          <p className="muted-copy">
            It will be removed from your ledger and dashboard totals.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button onClick={() => setDeleting(false)}>Cancel</Button>
            <Button
              primary
              onClick={() => {
                if (role === "manager" && editor.branch !== "BKK") return;
                saveTransactions(
                  transactions.filter((t) => t.id !== editor.id),
                );
                setEditor(null);
                notify("Transaction deleted");
              }}
            >
              Delete transaction
            </Button>
          </div>
        </>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          {form.receipt && (
            <div
              className="h-40 rounded-lg bg-contain bg-center bg-no-repeat"
              role="img"
              aria-label="Your uploaded receipt"
              style={{ backgroundImage: `url("${form.receipt}")` }}
            />
          )}
          {form.receipt && (
            <p className="text-xs text-muted">
              {form.status} / Created by {form.createdBy} / Original currency:{" "}
              {form.currency} / AI confidence: {form.confidence}%
            </p>
          )}
          <Field
            label="Merchant or description"
            required
            maxLength={80}
            value={form.name}
            onChange={(e) => change("name", e.target.value)}
          />
          <Field label="Type">
            <select
              className="input"
              value={form.type}
              onChange={(e) => change("type", e.target.value)}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </Field>
          <Field
            label="Amount (USD)"
            type="number"
            min="0.01"
            max="99999999"
            step="0.01"
            required
            value={form.amount}
            onChange={(e) => change("amount", e.target.value)}
          />
          <Field
            label="Date"
            type="date"
            min="2026-01-01"
            max="2026-12-31"
            required
            value={form.date}
            onChange={(e) => change("date", e.target.value)}
          />
          <Field label="Branch">
            <select
              className="input"
              disabled={role === "manager"}
              value={form.branch}
              onChange={(e) => change("branch", e.target.value)}
            >
              {BRANCHES.filter((b) => role === "owner" || b === "BKK").map(
                (b) => (
                  <option key={b}>{b}</option>
                ),
              )}
            </select>
          </Field>
          <Field label="Category">
            <select
              className="input"
              value={form.category}
              onChange={(e) => change("category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field
            label="Note (optional)"
            maxLength={200}
            value={form.note}
            onChange={(e) => change("note", e.target.value)}
          />
          <p className="text-[11px] leading-6 text-muted">
            Demo dates: April–September 2026. Saving opens the entry’s month.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            {editor.id && (
              <Button className="text-danger" onClick={() => setDeleting(true)}>
                Delete
              </Button>
            )}
            <Button onClick={() => setEditor(null)}>Cancel</Button>
            <Button primary type="submit">
              {editor.id ? "Save changes" : "Save transaction"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
export { default as Capture } from "./receipt-capture";
export function Assistant() {
  const { rows, role, branch, month } = useLedger();
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  function ask(q) {
    q = q.trim();
    if (!q) return;
    const t = ledgerTotals(rows);
    let answer;
    if (/expense|spend|cost/i.test(q))
      answer = `Your expenses total ${money(t.expenses)}.\n\n${expenseCategories(
        rows,
      )
        .map(
          ([c, a]) =>
            `${c}: ${money(a)} (${t.expenses ? ((a / t.expenses) * 100).toFixed(1) : 0}%)`,
        )
        .join(
          "\n",
        )}\n\nReview the largest category first for possible savings.`;
    else if (/branch|compare/i.test(q))
      answer =
        role === "manager"
          ? `You’re viewing BKK only. BKK earned ${money(t.revenue)} with ${money(t.profit)} in profit. Switch to the owner role in Settings to compare branches.`
          : BRANCHES.map((b) => {
              const x = ledgerTotals(rows.filter((r) => r.branch === b));
              return `${b}: ${money(x.revenue)} revenue · ${money(x.profit)} profit`;
            }).join("\n") +
            "\n\nSelect All branches to include every location.";
    else if (/business|doing|profit|revenue|income|margin|summary/i.test(q))
      answer = `For ${branch === "all" ? "all branches" : branch} in ${month}:\n\nRevenue: ${money(t.revenue)}\nExpenses: ${money(t.expenses)}\nNet profit: ${money(t.profit)}\nProfit margin: ${t.margin.toFixed(1)}%\n\n${t.profit >= 0 ? "Income is covering recorded expenses. Keep an eye on your largest spending categories." : "Recorded spending exceeds income. Review expenses and sales for this period."}`;
    else
      answer =
        "This demo can summarize revenue, profit, expenses, and branch performance. Try “What are my biggest expenses?” or “How is my business doing?”";
    setMessages((m) => [
      ...m,
      { role: "user", text: q },
      { role: "assistant", text: answer },
    ]);
    setQuestion("");
  }
  return (
    <>
      <Heading
        title="A fresh perspective."
        subtitle="Ask a question. Find the story behind your numbers."
      />
      <Filters />
      <div className="rounded-xl border border-[#e6edda] bg-[#f3f6eb] p-4">
        <b className="text-xs">Your demo financial assistant</b>
        <p className="mt-2 text-xs leading-6 text-muted">
          Answers use your selected branch and month with local demo rules. Try
          revenue, expenses, profit, or branch performance.
        </p>
      </div>
      <div aria-live="polite">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`my-4 rounded-[14px] border border-line p-5 text-sm leading-7 whitespace-pre-wrap ${m.role === "user" ? "ml-10 bg-[#e9f0df]" : "bg-white"}`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          "How is my business doing?",
          "What are my biggest expenses?",
          "Compare my branches",
        ].map((q) => (
          <Button key={q} onClick={() => ask(q)}>
            {q}
          </Button>
        ))}
      </div>
      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <input
          aria-label="Question for demo assistant"
          className="input flex-1"
          placeholder="Ask about your business…"
          required
          maxLength={500}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Button primary type="submit">
          Ask →
        </Button>
      </form>
    </>
  );
}
export function Settings() {
  const {
    role,
    setRole,
    navigate,
    saveTransactions,
    saveInvoices,
    setMonth,
    setBranch,
    notify,
  } = useLedger();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Heading
        title="Make yourself at home."
        subtitle="Switch perspectives and manage your demo workspace."
      />
      <div className="grid gap-[17px]">
        <section className="card">
          <h2 className="font-semibold">Your workspace</h2>
          <p className="my-4 text-sm">Dara’s Coffee · USD</p>
          <Field label="Preview role">
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="owner">Dara · Business owner</option>
              <option value="manager">Sokha · BKK branch manager</option>
            </select>
          </Field>
          <p className="my-4 muted-copy">
            Owners can explore all three branches. The manager demo is scoped to
            BKK across transactions, reports, and assistant answers.
          </p>
          <Button onClick={() => navigate("reports")}>
            <Icon name="reports" />
            Open reports
          </Button>
        </section>
        <section className="card">
          <h2 className="font-semibold">Demo data</h2>
          <p className="my-4 muted-copy">
            Explore April–September 2026 sample data. Changes persist in this
            browser when local storage is available.
          </p>
          <p className="mb-4 text-[11px] leading-6 text-muted">
            This is a frontend demo. Role switching simulates access and is not
            authentication. No live banking, cloud AI, or OCR is connected.
          </p>
          <Button onClick={() => setConfirm(true)}>Reset demo data</Button>
        </section>
        <section className="card">
          <h2 className="font-semibold">Invoices</h2>
          <p className="my-4 muted-copy">
            Speak, review, and prepare your next invoice.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button primary onClick={() => navigate("voice")}>
              <Icon name="voice" />
              Voice to Invoice
            </Button>
            <Button onClick={() => navigate("invoices")}>View invoices</Button>
          </div>
          <p className="mt-4 text-[11px] text-muted">
            {role === "manager"
              ? "BKK manager · Sending is enabled for this demo."
              : "Business owner · All branches available."}
          </p>
        </section>
      </div>
      {confirm && (
        <Modal
          title="Reset your demo workspace?"
          onClose={() => setConfirm(false)}
        >
          <p className="muted-copy">
            This removes your transaction changes and all saved invoices, then
            restores the original sample ledger.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button onClick={() => setConfirm(false)}>Cancel</Button>
            <Button
              primary
              onClick={() => {
                saveTransactions(seed());
                saveInvoices([]);
                setMonth("2026-09");
                setBranch(role === "manager" ? "BKK" : "all");
                setConfirm(false);
                notify("Demo data restored");
              }}
            >
              Reset demo
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
