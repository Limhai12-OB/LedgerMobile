export const TODAY = "2026-09-30";
export const STATUSES = [
  "Draft",
  "Ready",
  "Sent",
  "Paid",
  "Overdue",
  "Cancelled",
];
export function effectiveStatus(invoice) {
  return ["Ready", "Sent"].includes(invoice.status) &&
    invoice.due &&
    invoice.due < TODAY
    ? "Overdue"
    : invoice.status;
}
export function nextInvoiceId(invoices) {
  return (
    "INV-2026-" +
    String(
      Math.max(
        41,
        ...invoices.map((i) => Number(i.id?.split("-").pop()) || 0),
      ) + 1,
    ).padStart(4, "0")
  );
}
export function validInvoices(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (i) =>
        i &&
        typeof i.id === "string" &&
        typeof i.customer === "string" &&
        ["BKK", "Toul Kork", "Siem Reap"].includes(i.branch) &&
        STATUSES.includes(i.status) &&
        Array.isArray(i.channels) &&
        Array.isArray(i.items) &&
        i.items.length > 0 &&
        i.items.every(
          (x) =>
            x &&
            typeof x.name === "string" &&
            (x.qty === "" || Number.isFinite(Number(x.qty))) &&
            (x.price === "" || Number.isFinite(Number(x.price))),
        ),
    )
  );
}
export function validateInvoice(invoice, complete = true) {
  if (complete) {
    const gaps = missingFields(invoice);
    if (gaps.length) return "Please complete: " + gaps.join(", ");
    if (!invoice.date || invoice.due < invoice.date)
      return "Due date must be on or after the invoice date.";
  }
  if (
    !Number.isFinite(Number(invoice.tax)) ||
    Number(invoice.tax) < 0 ||
    !Number.isFinite(Number(invoice.discount)) ||
    Number(invoice.discount) < 0 ||
    Number(invoice.discount) > 100 ||
    invoice.items.some(
      (x) =>
        (x.qty !== "" && Number(x.qty) <= 0) ||
        (x.price !== "" && Number(x.price) < 0),
    )
  )
    return "Use positive quantities, nonnegative prices and tax, and a discount between 0 and 100%.";
  return "";
}
export function validateDelivery(invoice) {
  const issue = validateInvoice(invoice);
  if (issue) return issue;
  if (!invoice.channels.length) return "Choose Email, Telegram, or both.";
  if (
    invoice.channels.includes("Email") &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoice.email)
  )
    return "Enter a valid customer email address.";
  if (
    invoice.channels.includes("Telegram") &&
    !/^@[A-Za-z0-9_]{5,32}$/.test(invoice.telegram)
  )
    return "Enter a Telegram username: @ followed by 5–32 letters, numbers, or underscores.";
  return "";
}
export function correctInvoice(invoice, text) {
  const normalized = numberWords(text);
  const qty = normalized.match(
    /quantity(?:\s+from\s+\d+(?:\.\d+)?)?\s+to\s+(\d+(?:\.\d+)?)/,
  );
  const due = dateFrom(text);
  if (qty && Number(qty[1]) > 0)
    return {
      ...invoice,
      items: invoice.items.map((item, i) =>
        i === 0 ? { ...item, qty: Number(qty[1]) } : item,
      ),
    };
  if (due) return { ...invoice, due, reviewDue: false };
  return null;
}
export const SAMPLE =
  "Create an invoice for Sokha Cafe for ten coffee bags at twenty dollars each and add a twenty-five dollar delivery fee. Make it due next Friday.";
export const ABC =
  "Create an invoice for ABC Restaurant, five boxes of Arabica coffee at $30 each, two milk packs at $12, give them a 10% discount, and make it due in seven days.";

function numberWords(s) {
  const words = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
  };
  return s
    .toLowerCase()
    .replace(
      /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[ -](one|two|three|four|five|six|seven|eight|nine)\b/g,
      (_, a, b) => words[a] + words[b],
    )
    .replace(
      new RegExp("\\b(" + Object.keys(words).join("|") + ")\\b", "g"),
      (w) => words[w],
    )
    .replace(/\b(dollars?|usd)\b/g, "")
    .replace(/\s+/g, " ");
}
export function dateFrom(text) {
  let t = numberWords(text),
    m = t.match(/due in (\d+) days?/);
  if (m) {
    let d = new Date(TODAY + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + Number(m[1]));
    return d.toISOString().slice(0, 10);
  }
  if (/next friday/.test(t)) return "2026-10-02";
  m = t.match(
    /(?:due(?: date)?(?: to| on| is)?\s+)(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(202\d))?/,
  );
  if (m) {
    let month =
      [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
      ].indexOf(m[1]) + 1;
    let value = `${m[3] || 2026}-${String(month).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
    let d = new Date(value + "T12:00:00Z");
    if (!isNaN(d) && d.toISOString().slice(0, 10) === value) return value;
  }
  return "";
}
export function parseInvoice(text, context = { role: "owner", branch: "all" }) {
  let n = numberWords(text),
    customer =
      text.match(/invoice\s+for\s+(.+?)(?=\s+for\s+|,|\.|$)/i)?.[1]?.trim() ||
      "",
    items = [];
  let re = /(\d+(?:\.\d+)?)\s+([^,.;]+?)\s+at\s+\$?\s*(\d+(?:\.\d+)?)/g,
    m;
  while ((m = re.exec(n))) {
    let name = m[2].replace(/^(?:boxes?|bags?|packs?)\s+of\s+/, "").trim();
    items.push({
      name: name.replace(/\b\w/g, (c) => c.toUpperCase()),
      qty: Number(m[1]),
      price: Number(m[3]),
    });
  }
  let delivery = n.match(
    /(?:\$?\s*(\d+(?:\.\d+)?))\s+delivery fee|delivery fee\s+(?:of\s+)?\$?\s*(\d+(?:\.\d+)?)/,
  );
  if (delivery && !items.some((i) => /delivery/i.test(i.name)))
    items.push({
      name: "Delivery Fee",
      qty: 1,
      price: Number(delivery[1] || delivery[2]),
    });
  if (!items.length)
    items = [
      { name: /coffee/i.test(text) ? "Coffee" : "", qty: "", price: "" },
    ];
  let discount = Number(n.match(/(\d+(?:\.\d+)?)\s*%\s*discount/)?.[1] || 0),
    due = dateFrom(text);
  return {
    id: null,
    customer,
    email: "",
    telegram: "",
    date: TODAY,
    due,
    branch:
      context.role === "manager"
        ? "BKK"
        : context.branch === "all"
          ? "BKK"
          : context.branch,
    items,
    tax: 0,
    discount,
    notes: "",
    status: "Draft",
    channels: [],
    confidence:
      customer && items.every((i) => i.qty !== "" && i.price !== "") ? 94 : 62,
    reviewDue: /next friday/i.test(text),
    source: text,
  };
}
export function invoiceTotals(i) {
  let subtotal = i.items.reduce(
      (s, x) => s + (Number(x.qty) || 0) * (Number(x.price) || 0),
      0,
    ),
    discount = (subtotal * (Number(i.discount) || 0)) / 100,
    tax = Number(i.tax) || 0;
  return {
    subtotal,
    discount,
    tax,
    total: Math.round((subtotal - discount + tax) * 100) / 100,
  };
}

export function missingFields(i) {
  let result = [];
  if (!i.customer.trim()) result.push("Customer");
  if (!i.due) result.push("Due date");
  i.items.forEach((x, n) => {
    if (!x.name.trim()) result.push(`Item ${n + 1}: name`);
    if (x.qty === "" || !Number.isFinite(Number(x.qty)) || Number(x.qty) <= 0)
      result.push(`Item ${n + 1}: quantity`);
    if (
      x.price === "" ||
      !Number.isFinite(Number(x.price)) ||
      Number(x.price) < 0
    )
      result.push(`Item ${n + 1}: price`);
  });
  return result;
}
