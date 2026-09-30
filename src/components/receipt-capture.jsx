"use client";
import { useEffect, useRef, useState } from "react";
import { useLedger } from "./mobile-app";
import { BRANCHES, CATEGORIES, money } from "@/lib/ledger";
import { receiptIssues, receiptRecord } from "@/lib/receipts";
import { Button, Field, Heading } from "./ui";

const sampleImage =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="240"><rect width="300" height="240" fill="#f8faf4"/><g fill="#216652" font-family="sans-serif" text-anchor="middle"><text x="150" y="45">ANGKOR MARKET</text><text x="150" y="80">30 Sep 2026</text><text x="150" y="120">Coffee beans, milk and sugar</text><text x="150" y="160">USD 125.00</text><text x="150" y="210">SAMPLE RECEIPT</text></g></svg>',
  );
export default function Capture() {
  const {
    role,
    branch,
    month,
    transactions,
    saveTransactions,
    setMonth,
    setBranch,
    navigate,
    setEditor,
    notify,
  } = useLedger();
  const [stage, setStage] = useState("capture");
  const [form, setForm] = useState({
    name: "",
    amount: "",
    date: month + "-30",
    currency: "USD",
    category: "",
    note: "",
    branch: role === "manager" ? "BKK" : branch === "all" ? "BKK" : branch,
  });
  const [ack, setAck] = useState(false);
  const [saved, setSaved] = useState(null);
  const timer = useRef(null);
  const reader = useRef(null);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      reader.current?.abort();
    },
    [],
  );
  const change = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setAck(false);
  };
  const scoped = transactions.filter(
    (t) => role === "owner" || t.branch === "BKK",
  );
  const issues = receiptIssues(form, scoped);
  const uncertain =
    Object.keys(issues.errors).length > 0 ||
    issues.duplicate ||
    issues.lowConfidence;
  function scan(image, source, sample = false, low = false) {
    setAck(false);
    setForm((f) => ({
      ...f,
      receipt: image,
      receiptSource: source,
      name: sample ? "Angkor Market" : "",
      amount: sample ? 125 : "",
      date: sample ? "2026-09-30" : "",
      currency: "USD",
      category: sample ? "Ingredients" : "",
      note: sample ? "Coffee beans, milk and sugar" : "",
      confidence: low ? 54 : sample ? 94 : 54,
    }));
    setStage("processing");
    timer.current = setTimeout(() => setStage("review"), 900);
  }
  function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      notify("Choose a JPG, PNG or WebP image under 5 MB.");
      return;
    }
    reader.current = new FileReader();
    reader.current.onload = () => scan(reader.current.result, file.name);
    reader.current.onerror = () =>
      notify("Could not read this image. Please try again.");
    reader.current.readAsDataURL(file);
    e.target.value = "";
  }
  function save(e) {
    e.preventDefault();
    if (
      Object.keys(issues.errors).length ||
      ((issues.duplicate || issues.lowConfidence) && !ack)
    )
      return;
    try {
      const record = receiptRecord(form, role, transactions);
      const persisted = saveTransactions([...transactions, record]);
      setSaved(record);
      setStage("success");
      notify(
        persisted
          ? "Receipt saved in this browser."
          : "Receipt saved for this session only; browser storage is unavailable or full.",
      );
    } catch (error) {
      notify(error.message);
    }
  }
  function view() {
    setMonth(saved.date.slice(0, 7));
    setBranch(role === "manager" ? "BKK" : saved.branch);
    navigate("transactions");
    setEditor(saved);
  }
  return (
    <>
      <Heading
        title="From receipt to record."
        subtitle="Keep the paperwork. Lose the busywork."
      />
      <section className="card">
        <p className="mb-4 text-xs text-muted">
          Receipt capture · Simulated OCR and AI. Images stay in this browser.
          Uploaded images require manual transcription; no financial details are
          guessed.
        </p>
        {stage === "success" ? (
          <div className="grid gap-4">
            <h2 className="font-semibold">Receipt Saved</h2>
            <p>
              {saved.name} · {saved.originalAmount.toFixed(2)} {saved.currency}
            </p>
            <p>
              {saved.category} · {saved.branch} Branch
            </p>
            <Button primary onClick={view}>
              View Transaction
            </Button>
            <Button
              onClick={() => {
                setStage("capture");
                setSaved(null);
              }}
            >
              Capture Another
            </Button>
            <Button
              onClick={() => {
                setMonth(saved.date.slice(0, 7));
                setBranch(role === "owner" ? "all" : "BKK");
                navigate("home");
              }}
            >
              Back to Dashboard
            </Button>
          </div>
        ) : (
          <>
            {role === "owner" ? (
              <Field label="Receipt branch">
                <select
                  className="input"
                  value={form.branch}
                  onChange={(e) => change("branch", e.target.value)}
                >
                  {BRANCHES.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </Field>
            ) : (
              <p className="badge">BKK Branch · Automatically assigned</p>
            )}
            {stage === "processing" ? (
              <p role="status" className="py-12 text-center">
                Scanning receipt...
              </p>
            ) : stage === "capture" ? (
              <div className="mt-5 grid gap-3">
                <Field label="Upload receipt image">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={upload}
                    className="input"
                  />
                </Field>
                <Button
                  primary
                  onClick={() => scan(sampleImage, "Simulated camera", true)}
                >
                  Take Photo (simulated)
                </Button>
                <Button
                  onClick={() => scan(sampleImage, "Sample receipt", true)}
                >
                  Try sample receipt →
                </Button>
                <Button
                  onClick={() =>
                    scan(sampleImage, "Low-confidence sample", true, true)
                  }
                >
                  Try low-confidence receipt
                </Button>
                <Button onClick={() => setEditor({})}>Enter manually</Button>
              </div>
            ) : (
              <form onSubmit={save} noValidate className="mt-5 grid gap-4">
                <h2 className="font-semibold">Review Extracted Data</h2>
                <div
                  role="img"
                  aria-label="Original receipt image"
                  className="h-60 rounded-xl bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url("${form.receipt}")` }}
                />
                <Button onClick={() => setStage("capture")}>
                  Retake / change image
                </Button>
                <p className="text-sm">
                  AI Confidence: {form.confidence}% · Simulated
                </p>
                {uncertain && (
                  <div
                    role="alert"
                    className="rounded-xl border border-line bg-[#f3f6eb] p-3 text-xs"
                  >
                    <b>Needs Review</b>
                    <p>Please review the highlighted information.</p>
                    {Object.values(issues.errors).map((x) => (
                      <p key={x}>{x}</p>
                    ))}
                    {issues.duplicate && <p>Possible duplicate receipt.</p>}
                    {issues.lowConfidence && (
                      <p>
                        Low AI confidence: verify every field against the image.
                      </p>
                    )}
                  </div>
                )}
                {[
                  ["name", "Merchant", "text"],
                  ["date", "Date", "date"],
                  [
                    "amount",
                    form.currency === "USD" ? "Amount (USD)" : "Amount (KHR)",
                    "number",
                  ],
                ].map(([key, label, type]) => (
                  <Field
                    key={key}
                    label={label}
                    type={type}
                    value={form[key]}
                    aria-invalid={!!issues.errors[key]}
                    step={key === "amount" ? "0.01" : undefined}
                    onChange={(e) => change(key, e.target.value)}
                  />
                ))}
                <Field label="Currency">
                  <select
                    className="input"
                    value={form.currency}
                    onChange={(e) => change("currency", e.target.value)}
                  >
                    <option>USD</option>
                    <option>KHR</option>
                  </select>
                </Field>
                {form.currency === "KHR" && (
                  <p className="text-xs text-muted">
                    Demo conversion: 4,000 KHR = 1 USD. Ledger value:{" "}
                    {money(Number(form.amount) / 4000)}.
                  </p>
                )}
                <Field label="Category">
                  <select
                    className="input"
                    value={form.category}
                    aria-invalid={!!issues.errors.category}
                    onChange={(e) => change("category", e.target.value)}
                  >
                    <option value="">Unknown — choose category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Description / receipt items"
                  value={form.note}
                  onChange={(e) => change("note", e.target.value)}
                />
                {(issues.lowConfidence || issues.duplicate) && (
                  <label className="flex min-h-11 items-center gap-3 text-xs">
                    <input
                      type="checkbox"
                      checked={ack}
                      onChange={(e) => setAck(e.target.checked)}
                    />
                    I verified these details and any possible duplicate.
                  </label>
                )}
                <p className="text-xs text-muted">
                  Confirming saves an approved transaction
                  {role === "manager" ? " for BKK" : ""}. Approval routing is
                  not enabled in this prototype.
                </p>
                <Button primary type="submit">
                  Save transaction
                </Button>
              </form>
            )}
          </>
        )}
      </section>
    </>
  );
}
