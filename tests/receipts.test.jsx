import {
  act,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { expect, it, vi } from "vitest";
import MobileApp from "@/components/mobile-app";
import { receiptIssues, receiptRecord } from "@/lib/receipts";
import {
  TRANSACTION_KEY,
  ledgerTotals,
  scopeTransactions,
  seed,
  shiftMonth,
} from "@/lib/ledger";

const sample = {
  name: "Angkor Market",
  amount: 125,
  date: "2026-09-30",
  currency: "USD",
  category: "Ingredients",
  branch: "BKK",
  confidence: 94,
};
it("uploads an image without inventing amounts and allows an owner to review a manager receipt", async () => {
  render(<MobileApp />);
  fireEvent.click(screen.getByRole("button", { name: "More", exact: true }));
  fireEvent.change(screen.getByLabelText("Preview role"), {
    target: { value: "manager" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Capture", exact: true }));
  fireEvent.change(screen.getByLabelText("Upload receipt image"), {
    target: {
      files: [new File(["image bytes"], "receipt.png", { type: "image/png" })],
    },
  });
  await waitFor(() =>
    expect(screen.getByText("Scanning receipt...")).toBeInTheDocument(),
  );
  expect(
    await screen.findByLabelText("Amount (USD)", {}, { timeout: 2000 }),
  ).toHaveValue(null);
  expect(screen.getByLabelText("Merchant")).toHaveValue("");
  fireEvent.change(screen.getByLabelText("Merchant"), {
    target: { value: "Manager receipt" },
  });
  fireEvent.change(screen.getByLabelText("Amount (USD)"), {
    target: { value: "20" },
  });
  fireEvent.change(screen.getByLabelText("Date"), {
    target: { value: "2026-09-30" },
  });
  fireEvent.change(screen.getByLabelText("Category"), {
    target: { value: "Other" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Save transaction" }));
  const saved = JSON.parse(localStorage.getItem(TRANSACTION_KEY)).at(-1);
  expect(saved).toMatchObject({
    branch: "BKK",
    createdBy: "Sokha · Branch Manager",
    receiptSource: "receipt.png",
  });
  expect(saved.receipt).toMatch(/^data:image\/png;base64,/);
  fireEvent.click(screen.getByRole("button", { name: "Back to Dashboard" }));
  expect(screen.getByText("$5,120.00")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "More", exact: true }));
  fireEvent.change(screen.getByLabelText("Preview role"), {
    target: { value: "owner" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Transactions", exact: true }),
  );
  fireEvent.click(screen.getByRole("button", { name: /Manager receipt/ }));
  expect(screen.getByRole("dialog")).toHaveTextContent(
    "Sokha · Branch Manager",
  );
  expect(
    screen.getByRole("img", { name: "Your uploaded receipt" }),
  ).toBeInTheDocument();
});
it("validates financial fields, duplicates, dates, currency and forged branch access", () => {
  expect(
    Object.keys(
      receiptIssues(
        {
          ...sample,
          name: "",
          amount: "",
          date: "2026-02-30",
          category: "Unknown",
          currency: "EUR",
        },
        [],
      ).errors,
    ),
  ).toHaveLength(5);
  const saved = receiptRecord(sample, "manager", seed());
  expect(receiptIssues(sample, [saved]).duplicate).toBe(true);
  expect(receiptIssues({ ...sample, confidence: 54 }, []).lowConfidence).toBe(
    true,
  );
  expect(() =>
    receiptRecord({ ...sample, branch: "Siem Reap" }, "manager", seed()),
  ).toThrow("assigned branch");
  const other = receiptRecord(
    { ...sample, branch: "Siem Reap" },
    "owner",
    seed(),
  );
  expect(() =>
    receiptRecord({ ...sample, id: other.id }, "manager", [other]),
  ).toThrow("access denied");
  expect(shiftMonth("2026-01", -1)).toBe("2025-12");
});
it("scopes dashboard totals, comparisons, recent transactions and quick actions by role", () => {
  render(<MobileApp />);
  expect(screen.getByText("$25,400.00")).toBeInTheDocument();
  expect(screen.getByText("Branch performance")).toBeInTheDocument();
  const recent = screen.getByText("Recent transactions").closest("section");
  expect(recent).toHaveTextContent("Siem Reap");
  expect(recent).toHaveTextContent("BKK");
  fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));
  expect(
    screen.getByLabelText("Question for demo assistant"),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Home", exact: true }));
  fireEvent.click(
    screen.getByRole("button", { name: "Voice Invoice", exact: true }),
  );
  expect(
    screen.getByRole("button", { name: "Try Sample Voice" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "More", exact: true }));
  fireEvent.change(screen.getByLabelText("Preview role"), {
    target: { value: "manager" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Home", exact: true }));
  expect(screen.getByText("$8,400.00")).toBeInTheDocument();
  expect(screen.queryByText("Branch performance")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Branch")).not.toBeInTheDocument();
  expect(
    screen.getByText("Recent transactions").closest("section"),
  ).not.toHaveTextContent("Siem Reap");
  fireEvent.click(screen.getByRole("button", { name: "Capture Receipt" }));
  expect(screen.queryByLabelText("Receipt branch")).not.toBeInTheDocument();
  expect(screen.getByText(/Automatically assigned/)).toHaveTextContent("BKK");
});
it("reviews low-confidence receipts, persists source and metadata, and updates the shared dashboard", async () => {
  vi.useFakeTimers();
  const app = render(<MobileApp />);
  fireEvent.click(screen.getByRole("button", { name: "Capture Receipt" }));
  fireEvent.change(screen.getByLabelText("Receipt branch"), {
    target: { value: "Toul Kork" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Try low-confidence receipt" }),
  );
  expect(screen.getByText("Scanning receipt...")).toBeInTheDocument();
  await act(async () => {
    vi.advanceTimersByTime(1000);
  });
  expect(screen.getByText("Needs Review")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Merchant"), {
    target: { value: "Reviewed market" },
  });
  fireEvent.change(screen.getByLabelText("Amount (USD)"), {
    target: { value: "55" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save transaction" }));
  expect(localStorage.getItem(TRANSACTION_KEY)).toBeNull();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Save transaction" }));
  expect(screen.getByText("Receipt Saved")).toBeInTheDocument();
  const rows = JSON.parse(localStorage.getItem(TRANSACTION_KEY));
  expect(rows.at(-1)).toMatchObject({
    name: "Reviewed market",
    branch: "Toul Kork",
    amount: 55,
    status: "APPROVED",
    currency: "USD",
  });
  expect(rows.at(-1).receipt).toMatch(/^data:image/);
  expect(
    ledgerTotals(scopeTransactions(rows, "owner", "all", "2026-09")).expenses,
  ).toBe(16255);
  fireEvent.click(screen.getByRole("button", { name: "View Transaction" }));
  expect(
    within(screen.getByRole("dialog")).getByLabelText(
      "Merchant or description",
    ),
  ).toHaveValue("Reviewed market");
  app.unmount();
  render(<MobileApp />);
  expect(screen.getByText("$16,255.00")).toBeInTheDocument();
  expect(screen.getByText("Reviewed market")).toBeInTheDocument();
});
