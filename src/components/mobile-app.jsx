"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import usePersistedState from "@/hooks/use-persisted-state";
import {
  INVOICE_KEY,
  TRANSACTION_KEY,
  seed,
  scopeTransactions,
  validTransactions,
} from "@/lib/ledger";
import { validInvoices } from "@/lib/invoices";
import { Icon } from "./ui";
import {
  Assistant,
  Capture,
  Dashboard,
  Reports,
  Settings,
  Transactions,
  TransactionModal,
} from "./ledger-screens";
import InvoiceWorkspace from "./invoice-workspace";

const AppContext = createContext(null);
export const useLedger = () => useContext(AppContext);
const navigation = [
  ["home", "Home"],
  ["transactions", "Transactions"],
  ["capture", "Capture"],
  ["voice", "Voice Invoice"],
  ["ai", "AI"],
  ["settings", "More"],
];

export default function MobileApp() {
  const [transactions, saveTransactions, transactionStorage] =
    usePersistedState(TRANSACTION_KEY, seed, validTransactions);
  const [invoices, saveInvoices, invoiceStorage] = usePersistedState(
    INVOICE_KEY,
    () => [],
    validInvoices,
  );
  const [role, setRoleState] = useState("owner");
  const [branch, setBranch] = useState("all");
  const [month, setMonth] = useState("2026-09");
  const [page, setPage] = useState("home");
  const [invoiceSession, setInvoiceSession] = useState(0);
  const [editor, setEditor] = useState(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const notify = useCallback((text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const setRole = useCallback((value) => {
    if (!["owner", "manager"].includes(value)) return;
    setRoleState(value);
    setBranch(value === "manager" ? "BKK" : "all");
    setEditor(null);
    setInvoiceSession((n) => n + 1);
    if (window.parent !== window)
      window.parent.postMessage(
        { type: "ledgervision-role", role: value },
        window.location.origin,
      );
  }, []);
  useEffect(() => {
    const receive = (e) => {
      if (
        e.source === window.parent &&
        e.origin === window.location.origin &&
        e.data?.type === "ledgervision-set-role"
      )
        setRole(e.data.role);
    };
    window.addEventListener("message", receive);
    if (window.parent !== window)
      window.parent.postMessage(
        { type: "ledgervision-ready" },
        window.location.origin,
      );
    return () => window.removeEventListener("message", receive);
  }, [setRole]);
  function navigate(value) {
    setPage(value);
    setEditor(null);
    if (value === "voice" || value === "invoices")
      setInvoiceSession((n) => n + 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const rows = scopeTransactions(transactions, role, branch, month);
  const value = {
    transactions,
    saveTransactions,
    invoices,
    saveInvoices,
    role,
    setRole,
    branch,
    setBranch,
    month,
    setMonth,
    page,
    navigate,
    rows,
    editor,
    setEditor,
    notify,
    storageAvailable: transactionStorage && invoiceStorage,
  };
  const title = {
    home: "Overview",
    transactions: "Transactions",
    capture: "Capture receipt",
    voice: "Invoices",
    invoices: "Invoices",
    ai: "AI assistant",
    reports: "Reports",
    settings: "Settings",
  }[page];
  return (
    <AppContext.Provider value={value}>
      <div className="mx-auto min-h-dvh max-w-[720px] bg-canvas">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-2 border-b border-line bg-[#f9faf6] px-5">
          <span className="text-xs">Workspace / {title}</span>
          <div className="flex items-center gap-2">
            <span className="badge text-[9px]">● DEMO WORKSPACE</span>
            <button
              className="size-10 rounded-full bg-[#e5eadc] text-xs font-semibold"
              onClick={() => navigate("settings")}
              aria-label="Open profile and settings"
            >
              {role === "owner" ? "DS" : "SK"}
            </button>
          </div>
        </header>
        <main className="px-[18px] pt-6 pb-[110px]">
          {page === "home" && <Dashboard />}
          {page === "transactions" && <Transactions />}
          {page === "capture" && <Capture key={role} />}
          {page === "ai" && <Assistant key={`${role}-${branch}-${month}`} />}
          {page === "reports" && <Reports />}
          {page === "settings" && <Settings />}
          {["voice", "invoices"].includes(page) && (
            <InvoiceWorkspace
              key={`${role}-${invoiceSession}`}
              initialView={page === "invoices" ? "list" : "start"}
            />
          )}
        </main>
        <nav
          aria-label="Mobile navigation"
          className="fixed right-0 bottom-0 left-0 z-30 mx-auto grid max-w-[720px] grid-cols-6 border-t border-line bg-white/95 px-1 pt-2 pb-[max(9px,env(safe-area-inset-bottom))] backdrop-blur-md"
        >
          {navigation.map(([target, label]) => {
            const active =
              page === target ||
              (target === "voice" && page === "invoices") ||
              (target === "settings" && page === "reports");
            return (
              <button
                key={target}
                onClick={() => navigate(target)}
                aria-label={target === "voice" ? "Voice to Invoice" : label}
                aria-current={active ? "page" : undefined}
                className={`grid min-h-[48px] min-w-0 justify-items-center gap-1 px-px py-1 text-[9px] ${active ? "font-bold text-brand" : "text-muted"}`}
              >
                <Icon name={target} className="size-[21px]" />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </nav>
        {editor && (
          <TransactionModal key={editor.id || editor.receipt || "new"} />
        )}
        {toast && (
          <div
            role="status"
            className="fixed bottom-[85px] left-1/2 z-50 w-max max-w-[90%] -translate-x-1/2 rounded-xl bg-ink px-5 py-3 text-xs leading-5 text-white shadow-xl"
          >
            {toast}
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}
