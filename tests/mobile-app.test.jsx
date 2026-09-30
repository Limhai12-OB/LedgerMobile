import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import MobileApp from "@/components/mobile-app";
import { INVOICE_KEY, TRANSACTION_KEY } from "@/lib/ledger";
import { SAMPLE, parseInvoice } from "@/lib/invoices";

it("adds, edits, deletes and persists transactions without losing the dashboard", async () => {
  const user = userEvent.setup();
  render(<MobileApp />);
  expect(screen.getByText("$25,400.00")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Add transaction" }));
  await user.type(
    screen.getByLabelText("Merchant or description"),
    "React demo purchase",
  );
  await user.type(screen.getByLabelText("Amount (USD)"), "25");
  await user.click(screen.getByRole("button", { name: "Save transaction" }));
  expect(screen.getByText("React demo purchase")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(TRANSACTION_KEY))).toHaveLength(109);
  await user.click(screen.getByRole("button", { name: /React demo purchase/ }));
  await user.clear(screen.getByLabelText("Amount (USD)"));
  await user.type(screen.getByLabelText("Amount (USD)"), "50");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(JSON.parse(localStorage.getItem(TRANSACTION_KEY)).at(-1).amount).toBe(
    50,
  );
  await user.click(screen.getByRole("button", { name: /React demo purchase/ }));
  await user.click(screen.getByRole("button", { name: "Delete", exact: true }));
  await user.click(screen.getByRole("button", { name: "Delete transaction" }));
  expect(screen.queryByText("React demo purchase")).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(TRANSACTION_KEY))).toHaveLength(108);
});

it("requires review and valid recipients before simulated delivery", async () => {
  vi.useFakeTimers();
  render(<MobileApp />);
  fireEvent.click(screen.getByRole("button", { name: "Voice to Invoice" }));
  fireEvent.click(screen.getByRole("button", { name: "Try Sample Voice" }));
  expect(screen.getByText("Listening...")).toBeInTheDocument();
  await act(async () => {
    vi.advanceTimersByTime(5000);
  });
  expect(screen.getByText("Creating your invoice...")).toBeInTheDocument();
  await act(async () => {
    vi.advanceTimersByTime(1600);
  });
  expect(screen.getByLabelText("Customer")).toHaveValue("Sokha Cafe");
  expect(localStorage.getItem(INVOICE_KEY)).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Add correction by voice" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Change quantity to 12" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Apply correction" }));
  expect(screen.getByLabelText("Item 1 quantity")).toHaveValue(12);
  fireEvent.click(screen.getByRole("button", { name: /Review invoice →/ }));
  expect(
    screen.getByRole("heading", { name: "Review Invoice" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue to Send" }));
  expect(JSON.parse(localStorage.getItem(INVOICE_KEY))[0].status).toBe("Ready");
  fireEvent.click(screen.getByRole("button", { name: "Send Invoice" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Choose Email");
  fireEvent.click(screen.getByLabelText("Email"));
  fireEvent.click(screen.getByLabelText("Telegram"));
  fireEvent.change(screen.getByLabelText("Customer Email"), {
    target: { value: "demo@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Telegram Account"), {
    target: { value: "@sokhacafe" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send Invoice" }));
  expect(screen.getByText("Simulated delivery complete")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(INVOICE_KEY))[0]).toMatchObject({
    status: "Sent",
    channels: ["Email", "Telegram"],
  });
});

it("loads existing invoice storage, restricts managers, and resets both ledgers", async () => {
  const sample = parseInvoice(SAMPLE);
  localStorage.setItem(
    INVOICE_KEY,
    JSON.stringify([
      { ...sample, id: "INV-2026-0042", branch: "BKK" },
      {
        ...sample,
        id: "INV-2026-0043",
        branch: "Siem Reap",
        customer: "Private branch customer",
      },
    ]),
  );
  const user = userEvent.setup();
  render(<MobileApp />);
  const nav = within(
    screen.getByRole("navigation", { name: "Mobile navigation" }),
  );
  expect(nav.getAllByRole("button")).toHaveLength(6);
  await user.click(nav.getByRole("button", { name: "More" }));
  await user.selectOptions(screen.getByLabelText("Preview role"), "manager");
  await user.click(screen.getByRole("button", { name: "View invoices" }));
  expect(screen.getByText("Sokha Cafe")).toBeInTheDocument();
  expect(screen.queryByText("Private branch customer")).not.toBeInTheDocument();
  await user.click(nav.getByRole("button", { name: "More" }));
  await user.click(screen.getByRole("button", { name: "Reset demo data" }));
  await user.click(
    screen.getByRole("button", { name: "Reset demo", exact: true }),
  );
  expect(JSON.parse(localStorage.getItem(INVOICE_KEY))).toEqual([]);
  expect(JSON.parse(localStorage.getItem(TRANSACTION_KEY))).toHaveLength(108);
});

it("cancels listening timers when leaving the invoice screen", async () => {
  vi.useFakeTimers();
  render(<MobileApp />);
  fireEvent.click(screen.getByRole("button", { name: "Voice to Invoice" }));
  fireEvent.click(screen.getByRole("button", { name: "Try Sample Voice" }));
  fireEvent.click(screen.getByRole("button", { name: "Home", exact: true }));
  await act(async () => {
    vi.advanceTimersByTime(10000);
  });
  expect(screen.getByText("A little clarity, Dara.")).toBeInTheDocument();
  expect(localStorage.getItem(INVOICE_KEY)).toBeNull();
});

it("preserves receipt capture, filtered transactions, reports, and scoped AI", async () => {
  const user = userEvent.setup();
  render(<MobileApp />);
  const nav = within(
    screen.getByRole("navigation", { name: "Mobile navigation" }),
  );
  await user.click(nav.getByRole("button", { name: "Capture", exact: true }));
  await user.click(
    screen.getByRole("button", { name: "Try sample receipt →" }),
  );
  expect(screen.getByLabelText("Amount (USD)")).toHaveValue(125);
  await user.click(screen.getByRole("button", { name: "Save transaction" }));
  await user.type(screen.getByRole("searchbox"), "Angkor");
  expect(
    screen.getByText("2 transactions · Tap an entry to review or edit"),
  ).toBeInTheDocument();
  await user.click(nav.getByRole("button", { name: "More" }));
  await user.selectOptions(screen.getByLabelText("Preview role"), "manager");
  await user.click(screen.getByRole("button", { name: "Open reports" }));
  expect(screen.getByRole("combobox", { name: "Branch" })).toBeDisabled();
  expect(screen.getByText("$5,225.00")).toBeInTheDocument();
  await user.click(nav.getByRole("button", { name: "AI", exact: true }));
  await user.click(screen.getByRole("button", { name: "Compare my branches" }));
  expect(screen.getByText(/You’re viewing BKK only/)).toBeInTheDocument();
});

it("keeps missing invoice amounts blank and saves incomplete drafts for review", async () => {
  vi.useFakeTimers();
  render(<MobileApp />);
  fireEvent.click(screen.getByRole("button", { name: "Voice to Invoice" }));
  fireEvent.click(screen.getByRole("button", { name: "Type instead" }));
  fireEvent.change(
    screen.getByRole("textbox", { name: "Invoice description" }),
    { target: { value: "Create an invoice for Sokha for coffee." } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Prepare draft" }));
  await act(async () => {
    vi.advanceTimersByTime(1600);
  });
  expect(screen.getByText("Some information is missing")).toBeInTheDocument();
  expect(screen.getByLabelText("Item 1 quantity")).toHaveValue(null);
  expect(screen.getByLabelText("Item 1 price")).toHaveValue(null);
  fireEvent.click(screen.getByRole("button", { name: "Review invoice →" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Item 1: quantity");
  fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));
  expect(JSON.parse(localStorage.getItem(INVOICE_KEY))[0].status).toBe("Draft");
  fireEvent.click(screen.getByRole("button", { name: "Edit draft" }));
  expect(screen.getByLabelText("Item 1 price")).toHaveValue(null);
});
