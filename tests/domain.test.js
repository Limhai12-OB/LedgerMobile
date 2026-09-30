import { describe, expect, it } from "vitest";
import {
  BRANCHES,
  csvFor,
  ledgerTotals,
  scopeTransactions,
  seed,
} from "@/lib/ledger";
import {
  ABC,
  SAMPLE,
  correctInvoice,
  effectiveStatus,
  invoiceTotals,
  missingFields,
  parseInvoice,
  validateDelivery,
} from "@/lib/invoices";

describe("ledger and invoice business rules", () => {
  it("preserves ledger totals and manager scope", () => {
    const rows = seed();
    expect(rows).toHaveLength(108);
    expect(
      ledgerTotals(scopeTransactions(rows, "owner", "all", "2026-09")),
    ).toMatchObject({ revenue: 25400, expenses: 16200, profit: 9200 });
    for (const branch of ["all", ...BRANCHES]) {
      const scoped = scopeTransactions(rows, "manager", branch, "2026-09");
      expect(scoped).toHaveLength(6);
      expect(scoped.every((t) => t.branch === "BKK")).toBe(true);
    }
  });
  it("extracts both voice scenarios and keeps missing amounts empty", () => {
    const sample = parseInvoice(SAMPLE);
    expect(sample.customer).toBe("Sokha Cafe");
    expect(invoiceTotals(sample).total).toBe(225);
    expect(sample.due).toBe("2026-10-02");
    expect(sample.reviewDue).toBe(true);
    const abc = parseInvoice(ABC);
    expect(abc.customer).toBe("ABC Restaurant");
    expect(invoiceTotals(abc)).toMatchObject({
      subtotal: 174,
      discount: 17.4,
      total: 156.6,
    });
    expect(abc.due).toBe("2026-10-07");
    const missing = parseInvoice("Create an invoice for Sokha for coffee.");
    expect(missing.items[0]).toMatchObject({ qty: "", price: "" });
    expect(missingFields(missing)).toContain("Item 1: price");
  });
  it("applies corrections without mutating the original and validates delivery", () => {
    const original = parseInvoice(SAMPLE);
    const corrected = correctInvoice(
      original,
      "Change the quantity from 10 to 12.",
    );
    expect(original.items[0].qty).toBe(10);
    expect(invoiceTotals(corrected).total).toBe(265);
    expect(
      correctInvoice(corrected, "Change the due date to October 15.").due,
    ).toBe("2026-10-15");
    expect(validateDelivery(original)).toMatch(/Choose Email/);
    expect(
      validateDelivery({ ...original, channels: ["Email"], email: "bad" }),
    ).toMatch(/valid customer email/);
    expect(
      validateDelivery({
        ...original,
        channels: ["Email", "Telegram"],
        email: "demo@example.com",
        telegram: "@sokhacafe",
      }),
    ).toBe("");
    expect(
      effectiveStatus({ ...original, status: "Sent", due: "2026-09-01" }),
    ).toBe("Overdue");
  });
  it("escapes CSV fields and spreadsheet formula prefixes", () => {
    const csv = csvFor([
      {
        date: "2026-09-30",
        name: "=SUM(1,2)",
        category: "Other",
        type: "expense",
        branch: "BKK",
        amount: 5,
        note: 'one "quote"',
      },
    ]);
    expect(csv).toContain('"\'=SUM(1,2)"');
    expect(csv).toContain('"one ""quote"""');
  });
});
