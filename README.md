# LedgerVision — Next.js mobile demo

A Next.js App Router application with React components and Tailwind CSS. The existing green visual style, phone simulator, six-tab mobile navigation, and frontend demo workflows are preserved.

## Run locally

Requires Node.js 22.13+ (tested with 24.14) and npm.

```powershell
npm.cmd ci
npm.cmd run dev
```

On macOS/Linux, use `npm` instead of `npm.cmd`. Windows PowerShell can use `npm.cmd` without changing its execution policy.

- Phone simulator: http://127.0.0.1:3000
- Standalone mobile app: http://127.0.0.1:3000/mobile
- Standard and compact phone widths: 390 px / 360 px.

Production preview:

```powershell
npm.cmd run build
npm.cmd start
```

The development and production commands listen on this computer's loopback address. For a physical-phone test, configure the server hostname for your local network and open `/mobile` using the computer's LAN address.

## Features

- Dashboard totals, six-month cash flow, branch performance, and reports.
- Transaction creation, editing, deletion, searching, filtering, and CSV export.
- Local receipt image preview and sample receipt extraction.
- Local rule-based financial assistant.
- Voice-to-Invoice: simulated listening → processing → editable draft → review → simulated Email/Telegram delivery.
- Voice corrections, missing-field handling, invoice lists, Draft/Ready/Sent/Paid/Overdue/Cancelled statuses, and recipient validation.
- Business Owner sees all branches; Branch Manager is restricted to BKK, with simulated invoice-send permission.
- Settings → Reset demo data restores the ledger and clears invoices.

The bottom bar contains Home, Transactions, Capture, Voice Invoice, AI, and More. No duplicate dashboard quick-action cards are shown.

## Demo data and persistence

The demo date is **30 September 2026**. Transactions cover April–September 2026. “Next Friday” is interpreted as 2 October and marked for review; “in seven days” is 7 October. Sample voice creates a $225 invoice; the ABC Restaurant example totals $156.60 after a 10% discount.

This remains a frontend-only prototype: no live microphone, OCR, AI service, email delivery, Telegram API, authentication, banking connection, or database. The assistant and voice parser support the documented sample language patterns rather than arbitrary natural language.

Data uses the same localStorage keys as the original (`ledgervision-demo-v2` and `ledgervision-invoices-v1`). Existing data is retained when the app is served from the **same browser origin**, including the hostname and port. Switching from the old server on port 8080 to port 3000 creates a separate browser storage area. To reuse the earlier origin, stop that server and run `npm.cmd run dev -- --port 8080` with the same hostname. If storage is unavailable, edits remain in memory for that session.

The old HTML URLs redirect to the equivalent Next.js pages. The static prototype is archived in `legacy/` and is not loaded by the new app.

## Project structure

```text
src/app/                    App Router pages, root layout, Tailwind styles
src/components/             React phone simulator, mobile shell, ledger and invoice screens
src/hooks/                  Browser persistence hook
src/lib/                    Ledger calculations, invoice parsing, validation, CSV formatting
tests/                      Vitest business-rule and React interaction tests
legacy/                     Previous standalone HTML/CSS/JavaScript prototype
```

## Validation

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Tests cover ledger totals, branch scope, CSV escaping, voice parsing, invoice corrections, send validation, transaction CRUD, persisted records, timer cleanup, and resetting both ledgers. These are DOM/logic tests; they do not replace visual checks on a phone.

Setup follows the official [Next.js installation guide](https://nextjs.org/docs/app/getting-started/installation) and [Tailwind CSS Next.js guide](https://tailwindcss.com/docs/installation/framework-guides/nextjs).

Original repository: `mobile_version_testing`.
# LedgerMobile
