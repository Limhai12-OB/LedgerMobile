"use client";
import { useEffect, useState } from "react";
import { useLedger } from "./mobile-app";
import { BRANCHES, dateLabel, money } from "@/lib/ledger";
import {
  ABC,
  SAMPLE,
  STATUSES,
  correctInvoice,
  effectiveStatus,
  invoiceTotals,
  missingFields,
  nextInvoiceId,
  parseInvoice,
  validateDelivery,
  validateInvoice,
} from "@/lib/invoices";
import { Button, Field, Heading, Icon, Modal } from "./ui";

function InvoiceTotals({ invoice }) {
  const t = invoiceTotals(invoice);
  return (
    <div>
      {[
        ["Subtotal", money(t.subtotal)],
        [
          `Discount (${Number(invoice.discount) || 0}%)`,
          "−" + money(t.discount),
        ],
        ["Tax", money(t.tax)],
      ].map(([label, value]) => (
        <div
          key={label}
          className="flex justify-between gap-3 py-2 text-[13px]"
        >
          <span>{label}</span>
          <b>{value}</b>
        </div>
      ))}
      <div className="mt-2 flex justify-between gap-3 border-t border-line pt-4 text-[19px] font-bold">
        <span>Total</span>
        <span>{money(t.total)}</span>
      </div>
    </div>
  );
}
function InvoiceSummary({ invoice }) {
  return (
    <section className="card">
      <div className="mb-5 flex items-center justify-between gap-2">
        <h2 className="font-semibold">{invoice.id || "New invoice"}</h2>
        <span className="badge">{effectiveStatus(invoice)}</span>
      </div>
      <h2 className="font-semibold wrap-anywhere">
        {invoice.customer || "Unnamed customer"}
      </h2>
      <p className="my-4 text-xs leading-7 text-muted">
        {invoice.branch}
        {invoice.branch === "BKK" ? " Branch" : ""}
        <br />
        Invoice date: {dateLabel(invoice.date)}
        <br />
        Due: {dateLabel(invoice.due)}
      </p>
      {invoice.items.map((x, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-line py-4"
        >
          <div className="min-w-0 flex-1">
            <b className="text-[13px] wrap-anywhere">
              {x.name || "Unnamed item"}
            </b>
            <small className="mt-1 block text-[11px] text-muted">
              {x.qty || "—"} × {x.price === "" ? "—" : money(x.price)}
            </small>
          </div>
          <b className="text-xs">
            {money((Number(x.qty) || 0) * (Number(x.price) || 0))}
          </b>
        </div>
      ))}
      <div className="mt-4">
        <InvoiceTotals invoice={invoice} />
      </div>
      {invoice.notes && (
        <p className="mt-4 muted-copy whitespace-pre-wrap wrap-anywhere">
          {invoice.notes}
        </p>
      )}
      <p className="mt-4 text-xs leading-6 text-muted">
        Delivery method:{" "}
        {invoice.channels.length
          ? invoice.channels.join(" + ")
          : "Choose Email or Telegram in the next step"}
      </p>
    </section>
  );
}
function InvoiceEditor({ draft, setDraft, onCorrection, onRestart }) {
  const { role } = useLedger();
  const gaps = missingFields(draft);
  const change = (key, value) =>
    setDraft((d) => ({
      ...d,
      [key]: value,
      ...(key === "due" ? { reviewDue: false } : {}),
    }));
  const changeItem = (index, key, value) =>
    setDraft((d) => ({
      ...d,
      items: d.items.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    }));
  const warning = "!border-[#dba34b] !bg-[#fffaf0]";
  return (
    <div className="grid gap-4">
      {gaps.length > 0 && (
        <div className="rounded-xl border border-[#efdab4] bg-[#fff7e9] p-4 text-xs leading-7">
          <b>Some information is missing</b>
          <p>Required: {gaps.join(", ")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={onRestart}>Tap to speak again</Button>
            <Button
              onClick={() =>
                document.querySelector('[data-needs-review="true"]')?.focus()
              }
            >
              Enter manually
            </Button>
          </div>
        </div>
      )}
      <section className="card">
        <div className="mb-5 flex items-center justify-between gap-2">
          <h2 className="font-semibold">Invoice draft</h2>
          <span className="badge text-[9px]">
            AI confidence: {draft.confidence}%
          </span>
        </div>
        <div className="grid gap-4">
          <Field
            label="Customer"
            value={draft.customer}
            maxLength={100}
            data-needs-review={!draft.customer || undefined}
            className={!draft.customer ? warning : ""}
            onChange={(e) => change("customer", e.target.value)}
          />
          {!draft.customer && (
            <small className="text-[11px] text-[#9b681d]">Please review</small>
          )}
          <Field
            label="Customer email"
            type="email"
            value={draft.email}
            maxLength={120}
            onChange={(e) => change("email", e.target.value)}
          />
          <Field
            label="Telegram recipient"
            value={draft.telegram}
            placeholder="@customer"
            maxLength={80}
            onChange={(e) => change("telegram", e.target.value)}
          />
          <Field
            label="Invoice date"
            type="date"
            value={draft.date}
            onChange={(e) => change("date", e.target.value)}
          />
          <Field
            label="Due date"
            type="date"
            value={draft.due}
            data-needs-review={!draft.due || undefined}
            className={!draft.due || draft.reviewDue ? warning : ""}
            onChange={(e) => change("due", e.target.value)}
          />
          {(!draft.due || draft.reviewDue) && (
            <small className="text-[11px] text-[#9b681d]">
              Please review
              {draft.reviewDue
                ? " · “Next Friday” interpreted as 2 Oct 2026."
                : ""}
            </small>
          )}
          <Field label="Branch">
            {role === "owner" ? (
              <select
                className="input"
                value={draft.branch}
                onChange={(e) => change("branch", e.target.value)}
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                    {b === "BKK" ? " Branch" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <span className="grid gap-1">
                <b>BKK Branch</b>
                <small className="text-[11px] font-normal text-muted">
                  Automatically assigned
                </small>
              </span>
            )}
          </Field>
        </div>
      </section>
      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Invoice items</h2>
          <button
            className="link"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                items: [...d.items, { name: "", qty: "", price: "" }],
              }))
            }
          >
            + Add item
          </button>
        </div>
        {draft.items.map((x, i) => (
          <div
            key={i}
            className="border-b border-line py-4 first:pt-0 last:border-0"
          >
            <Field
              label="Item name"
              aria-label={`Item ${i + 1} name`}
              value={x.name}
              maxLength={120}
              data-needs-review={!x.name || undefined}
              className={!x.name ? warning : ""}
              onChange={(e) => changeItem(i, "name", e.target.value)}
            />
            <div className="my-3 grid grid-cols-2 gap-3">
              <Field
                label="Quantity"
                aria-label={`Item ${i + 1} quantity`}
                type="number"
                min="0.01"
                step="any"
                value={x.qty}
                data-needs-review={x.qty === "" || undefined}
                className={x.qty === "" ? warning : ""}
                onChange={(e) => changeItem(i, "qty", e.target.value)}
              />
              <Field
                label="Unit price ($)"
                aria-label={`Item ${i + 1} price`}
                type="number"
                min="0"
                step="0.01"
                value={x.price}
                data-needs-review={x.price === "" || undefined}
                className={x.price === "" ? warning : ""}
                onChange={(e) => changeItem(i, "price", e.target.value)}
              />
            </div>
            {(x.qty === "" || x.price === "") && (
              <small className="text-[11px] text-[#9b681d]">
                Please review · Enter missing quantity and price.
              </small>
            )}
            <div className="mt-2 flex items-center justify-between text-xs">
              <span>
                {money((Number(x.qty) || 0) * (Number(x.price) || 0))}
              </span>
              {draft.items.length > 1 && (
                <button
                  className="link text-danger"
                  aria-label={`Remove item ${i + 1}`}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      items: d.items.filter((_, n) => n !== i),
                    }))
                  }
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </section>
      <section className="card">
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Field
            label="Tax amount ($)"
            type="number"
            min="0"
            step="0.01"
            value={draft.tax}
            onChange={(e) => change("tax", e.target.value)}
          />
          <Field
            label="Discount (%)"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={draft.discount}
            onChange={(e) => change("discount", e.target.value)}
          />
        </div>
        <InvoiceTotals invoice={draft} />
        <div className="mt-5">
          <Field label="Notes">
            <textarea
              className="input min-h-[100px] resize-y leading-7"
              maxLength={1000}
              value={draft.notes}
              onChange={(e) => change("notes", e.target.value)}
            />
          </Field>
        </div>
      </section>
      <Button onClick={onCorrection}>
        <Icon name="voice" />
        Add correction by voice
      </Button>
      <p className="text-[11px] leading-6 text-muted">
        Demo date: 30 Sep 2026. AI only prepares a draft. Review and edit before
        saving or sending.
      </p>
    </div>
  );
}

export default function InvoiceWorkspace({ initialView = "start" }) {
  const { role, branch, invoices, saveInvoices, navigate, notify } =
    useLedger();
  const [view, setView] = useState(initialView);
  const [draft, setDraft] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [auto, setAuto] = useState(false);
  const [error, setError] = useState("");
  const [correction, setCorrection] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const available = invoices.filter(
    (i) => role === "owner" || i.branch === "BKK",
  );
  useEffect(() => {
    if (view !== "listening") return;
    const words = SAMPLE.split(" ");
    let count = 0;
    let timeout;
    const interval = setInterval(() => {
      count += 1;
      setTranscript(words.slice(0, count).join(" "));
      if (count >= words.length) {
        clearInterval(interval);
        if (auto) timeout = setTimeout(() => setView("processing"), 500);
      }
    }, 75);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [view, auto]);
  useEffect(() => {
    if (view !== "processing") return;
    const timeout = setTimeout(() => {
      setDraft(parseInvoice(transcript, { role, branch }));
      setView("draft");
    }, 1500);
    return () => clearTimeout(timeout);
  }, [view, transcript, role, branch]);
  function stage(next) {
    setError("");
    setView(next);
  }
  function start() {
    setDraft(null);
    setTranscript("");
    stage("start");
  }
  function listen(automatic) {
    setAuto(automatic);
    setTranscript("");
    stage("listening");
  }
  function process() {
    if (!transcript.trim()) {
      stage("type");
      return;
    }
    stage("processing");
  }
  function persist(status) {
    const record = {
      ...draft,
      status,
      id: draft.id || nextInvoiceId(invoices),
      branch: role === "manager" ? "BKK" : draft.branch,
    };
    const exists = invoices.some((i) => i.id === record.id);
    const saved = saveInvoices(
      exists
        ? invoices.map((i) => (i.id === record.id ? record : i))
        : [...invoices, record],
    );
    setDraft(record);
    return saved;
  }
  function saveDraft() {
    const issue = validateInvoice(draft, false);
    if (issue) {
      setError(issue);
      setView("draft");
      return;
    }
    const saved = persist("Draft");
    stage("detail");
    notify(
      saved
        ? "Invoice draft saved. Nothing was sent."
        : "Invoice kept for this session. Nothing was sent.",
    );
  }
  function review() {
    const issue = validateInvoice(draft);
    if (issue) {
      setError(issue);
      setView("draft");
      return;
    }
    stage("review");
  }
  function send() {
    const issue = validateDelivery(draft);
    if (issue) {
      setError(issue);
      return;
    }
    persist("Sent");
    stage("success");
  }
  function correct() {
    const revised = correctInvoice(draft, correction);
    if (!revised) {
      setError(
        "Try “Change the quantity to 12” or “Change the due date to October 15”.",
      );
      return;
    }
    setDraft(revised);
    stage("draft");
    notify("Correction applied. Review the updated invoice.");
  }
  const currentStep = ["start", "type", "listening", "processing"].includes(
    view,
  )
    ? 0
    : ["draft", "review", "detail", "correction"].includes(view)
      ? 1
      : 2;
  if (view === "list") {
    const filtered = available.filter(
      (i) =>
        (statusFilter === "all" || effectiveStatus(i) === statusFilter) &&
        (role === "manager" ||
          branchFilter === "all" ||
          i.branch === branchFilter),
    );
    return (
      <>
        <Heading
          title="Your invoices."
          subtitle="Drafts, deliveries, and everything in between."
        >
          <Button primary onClick={start}>
            <Icon name="voice" />
            Voice to Invoice
          </Button>
        </Heading>
        <div className="mb-5 flex gap-2">
          <select
            aria-label="Invoice status"
            className="input flex-1 text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {role === "owner" && (
            <select
              aria-label="Invoice branch"
              className="input flex-1 text-xs"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="all">All branches</option>
              {BRANCHES.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          )}
        </div>
        <div className="grid gap-4">
          {filtered.length ? (
            [...filtered].reverse().map((i) => (
              <button
                key={i.id}
                onClick={() => {
                  setDraft(structuredClone(i));
                  stage("detail");
                }}
                className="card w-full text-left"
              >
                <div className="flex items-center justify-between">
                  <small className="text-muted">{i.id}</small>
                  <span className="badge">{effectiveStatus(i)}</span>
                </div>
                <h2 className="my-3 font-semibold wrap-anywhere">
                  {i.customer || "Unnamed customer"}
                </h2>
                <div className="flex justify-between gap-2">
                  <small className="text-[10px] text-muted">
                    {i.branch} · Due {dateLabel(i.due)}
                  </small>
                  <b className="text-xs">{money(invoiceTotals(i).total)}</b>
                </div>
              </button>
            ))
          ) : (
            <div className="card py-10 text-center text-muted">
              No invoices here yet.
              <p className="mt-2 text-xs leading-6">
                Create one with your voice or type a description.
              </p>
            </div>
          )}
        </div>
      </>
    );
  }
  return (
    <>
      <Heading
        title={
          view === "review"
            ? "Review Invoice"
            : view === "success"
              ? "Invoice Sent"
              : view === "detail"
                ? "Invoice details"
                : "Create Invoice with Voice"
        }
        subtitle={
          view === "start"
            ? "Describe the invoice and LedgerVision will prepare it for you."
            : "Voice prepares. You review. You decide."
        }
      />
      <div className="mb-6 flex justify-center gap-3 text-[11px] text-muted">
        {["Speak", "Review", "Send"].map((s, i) => (
          <span
            key={s}
            className={i === currentStep ? "font-bold text-brand" : ""}
          >
            {i > 0 && <span className="mr-3 text-muted">→</span>}
            {i + 1} · {s}
          </span>
        ))}
      </div>
      {view === "start" && (
        <>
          <section className="card py-6 text-center">
            <span className="badge">SIMULATED VOICE</span>
            <button
              className="mx-auto my-7 grid size-[100px] place-items-center rounded-full bg-brand text-white shadow-[0_0_0_12px_#eaf1e2]"
              aria-label="Start simulated voice recording"
              onClick={() => listen(false)}
            >
              <Icon name="voice" className="size-[38px]" />
            </button>
            <h2 className="font-semibold">Tap to start speaking</h2>
            <p className="my-5 muted-copy">
              “Create an invoice for Sokha Cafe for 10 coffee bags at $20 each,
              add a $25 delivery fee, and make it due next Friday.”
            </p>
            <Button primary onClick={() => listen(true)}>
              Try Sample Voice
            </Button>
            <div className="mt-4 flex justify-center gap-6">
              <button
                className="link"
                onClick={() => {
                  setTranscript("");
                  stage("type");
                }}
              >
                Type instead
              </button>
              <button className="link" onClick={() => navigate("home")}>
                Cancel
              </button>
            </div>
            <p className="mt-3 text-[11px] leading-6 text-muted">
              No microphone access needed. Listening uses a sample transcript.
            </p>
          </section>
          <button className="link mt-4" onClick={() => stage("list")}>
            View saved invoices →
          </button>
        </>
      )}
      {view === "type" && (
        <section className="card grid gap-4">
          <h2 className="font-semibold">Describe your invoice</h2>
          <textarea
            aria-label="Invoice description"
            className="input min-h-[150px] resize-y text-sm leading-7"
            maxLength={2000}
            placeholder="Create an invoice for…"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
          <button className="link" onClick={() => setTranscript(ABC)}>
            Try ABC Restaurant example
          </button>
          <p className="muted-copy">
            Include customer, quantity, item price, and due date. Missing
            details stay blank.
          </p>
          <Button
            primary
            onClick={() =>
              transcript.trim()
                ? process()
                : notify("Describe the invoice first.")
            }
          >
            Prepare draft
          </Button>
          <Button onClick={start}>Cancel</Button>
        </section>
      )}
      {view === "listening" && (
        <section className="card py-6 text-center">
          <span className="badge">SIMULATED RECORDING</span>
          <div className="listening mx-auto my-7 grid size-[100px] place-items-center rounded-full bg-brand text-white shadow-[0_0_0_12px_#eaf1e2]">
            <Icon name="voice" className="size-[38px]" />
          </div>
          <h2 className="font-semibold">Listening...</h2>
          <p
            className="my-5 min-h-[120px] text-left text-xs leading-7 text-muted"
            aria-live="polite"
          >
            {transcript || "Your sample words will appear here…"}
          </p>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={start}>
              Cancel
            </Button>
            <Button primary className="flex-1" onClick={process}>
              Stop
            </Button>
          </div>
        </section>
      )}
      {view === "processing" && (
        <section className="card py-6 text-center">
          <div className="mx-auto my-5 size-9 animate-spin rounded-full border-[3px] border-[#dde8d4] border-t-brand" />
          <h2 className="font-semibold" role="status">
            Creating your invoice...
          </h2>
          <ul className="mx-auto my-6 grid max-w-[240px] gap-4 text-left text-xs text-muted">
            {[
              "Understanding customer",
              "Extracting items",
              "Calculating totals",
              "Detecting due date",
              "Preparing invoice draft",
            ].map((s) => (
              <li key={s}>
                <span className="mr-3 text-brand">✓</span>
                {s}
              </li>
            ))}
          </ul>
          <Button onClick={start}>Cancel</Button>
        </section>
      )}
      {view === "draft" && draft && (
        <>
          <InvoiceEditor
            draft={draft}
            setDraft={setDraft}
            onCorrection={() => {
              setCorrection("");
              stage("correction");
            }}
            onRestart={() => listen(false)}
          />
          {error && (
            <p role="alert" className="mt-4 text-xs leading-6 text-danger">
              {error}
            </p>
          )}
          <div className="action-bar">
            <Button className="flex-1" onClick={saveDraft}>
              Save Draft
            </Button>
            <Button primary className="flex-1" onClick={review}>
              Review invoice →
            </Button>
          </div>
        </>
      )}
      {view === "correction" && (
        <section className="card grid gap-4">
          <h2 className="font-semibold">Add correction by voice</h2>
          <p className="muted-copy">
            Simulated voice correction. Choose a sample or type your correction.
            Quantity changes apply to the first item.
          </p>
          <Button
            onClick={() => setCorrection("Change the quantity from 10 to 12.")}
          >
            <Icon name="voice" />
            Change quantity to 12
          </Button>
          <Button
            onClick={() => setCorrection("Change the due date to October 15.")}
          >
            <Icon name="voice" />
            Change due date to October 15
          </Button>
          <textarea
            aria-label="Invoice correction"
            className="input min-h-[100px] resize-y"
            maxLength={500}
            value={correction}
            placeholder="Change the quantity to 12…"
            onChange={(e) => setCorrection(e.target.value)}
          />
          {error && (
            <p role="alert" className="text-xs leading-6 text-danger">
              {error}
            </p>
          )}
          <Button primary onClick={correct}>
            Apply correction
          </Button>
          <Button onClick={() => stage("draft")}>Back to draft</Button>
        </section>
      )}
      {view === "review" && draft && (
        <>
          <InvoiceSummary invoice={draft} />
          <p className="mt-4 muted-copy">
            Review all details. Nothing has been sent. Delivery is simulated.
          </p>
          <div className="action-bar">
            <Button className="flex-1" onClick={() => stage("draft")}>
              Edit
            </Button>
            <Button className="flex-1" onClick={saveDraft}>
              Save Draft
            </Button>
            <Button
              primary
              className="flex-1"
              onClick={() => {
                persist("Ready");
                stage("send");
              }}
            >
              Continue to Send
            </Button>
          </div>
        </>
      )}
      {view === "send" && draft && (
        <>
          <div className="grid gap-4">
            <section className="card">
              <h2 className="font-semibold">
                How would you like to send this invoice?
              </h2>
              <p className="my-4 muted-copy">
                Select one or both. This demo does not send real messages.
              </p>
              {["Email", "Telegram"].map((channel) => (
                <div key={channel}>
                  <label className="flex items-center gap-3 py-4">
                    <input
                      className="size-5 accent-brand"
                      type="checkbox"
                      checked={draft.channels.includes(channel)}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          channels: e.target.checked
                            ? [...d.channels, channel]
                            : d.channels.filter((c) => c !== channel),
                        }))
                      }
                    />
                    {channel}
                  </label>
                  {draft.channels.includes(channel) && (
                    <Field
                      label={
                        channel === "Email"
                          ? "Customer Email"
                          : "Telegram Account"
                      }
                      type={channel === "Email" ? "email" : "text"}
                      value={draft[channel === "Email" ? "email" : "telegram"]}
                      placeholder={
                        channel === "Email"
                          ? "customer@example.com"
                          : "@customer"
                      }
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          [channel === "Email" ? "email" : "telegram"]:
                            e.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              ))}
            </section>
            <section className="card">
              <p className="mb-3 text-[10px] tracking-widest text-brand uppercase">
                Message preview · simulated delivery
              </p>
              <p className="text-sm leading-7 wrap-anywhere">
                Hi {draft.customer}, here is invoice{" "}
                {draft.id || nextInvoiceId(invoices)} from Dara&apos;s Coffee.
                Total: {money(invoiceTotals(draft).total)}. Due:{" "}
                {dateLabel(draft.due)}.
              </p>
            </section>
          </div>
          {error && (
            <p role="alert" className="mt-4 text-xs leading-6 text-danger">
              {error}
            </p>
          )}
          <div className="action-bar">
            <Button className="flex-1" onClick={review}>
              Back
            </Button>
            <Button primary className="flex-1" onClick={send}>
              Send Invoice
            </Button>
          </div>
        </>
      )}
      {view === "success" && draft && (
        <section className="card text-center">
          <div className="mx-auto mt-3 mb-6 grid size-[70px] place-items-center rounded-full bg-[#eaf2df] text-[34px] text-brand">
            ✓
          </div>
          <h2 className="font-semibold">Invoice Sent</h2>
          <p className="my-3 muted-copy">Simulated delivery complete</p>
          <p className="text-sm leading-7 wrap-anywhere">
            <b>{draft.id}</b>
            <br />
            {draft.customer}
            <br />
            {money(invoiceTotals(draft).total)}
          </p>
          <p className="my-4 text-xs text-muted">
            Sent via: {draft.channels.join(" + ")}
          </p>
          <div className="grid gap-3">
            <Button primary onClick={() => stage("detail")}>
              View Invoice
            </Button>
            <Button onClick={start}>Create Another</Button>
            <button
              className="link justify-center"
              onClick={() => navigate("home")}
            >
              Back to Dashboard
            </button>
          </div>
        </section>
      )}
      {view === "detail" && draft && (
        <>
          <InvoiceSummary invoice={draft} />
          <div className="action-bar">
            {["Draft", "Ready"].includes(draft.status) && (
              <Button primary onClick={() => stage("draft")}>
                Edit draft
              </Button>
            )}
            {["Sent", "Overdue"].includes(effectiveStatus(draft)) && (
              <Button
                primary
                onClick={() => {
                  persist("Paid");
                  notify("Invoice marked paid in the demo.");
                }}
              >
                Mark Paid
              </Button>
            )}
            {!["Paid", "Cancelled"].includes(draft.status) && (
              <Button onClick={() => setCancelConfirm(true)}>
                Cancel invoice
              </Button>
            )}
            <Button onClick={() => stage("list")}>All invoices</Button>
          </div>
        </>
      )}
      {cancelConfirm && (
        <Modal
          title="Cancel this invoice?"
          onClose={() => setCancelConfirm(false)}
        >
          <p className="muted-copy">
            This changes the demo invoice status to Cancelled.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button onClick={() => setCancelConfirm(false)}>
              Keep invoice
            </Button>
            <Button
              primary
              onClick={() => {
                persist("Cancelled");
                setCancelConfirm(false);
              }}
            >
              Cancel invoice
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
