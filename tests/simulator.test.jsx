import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import PhoneSimulator from "@/components/phone-simulator";

it("uses the Next mobile route and synchronizes role controls only with its own frame", () => {
  render(<PhoneSimulator />);
  const frame = screen.getByTitle("LedgerVision interactive mobile app");
  expect(frame).toHaveAttribute("src", "/mobile");
  const send = vi.spyOn(frame.contentWindow, "postMessage");
  fireEvent.click(screen.getByRole("button", { name: /Branch manager/ }));
  expect(send).toHaveBeenCalledWith(
    { type: "ledgervision-set-role", role: "manager" },
    window.location.origin,
  );
  fireEvent(
    window,
    new MessageEvent("message", {
      source: frame.contentWindow,
      origin: window.location.origin,
      data: { type: "ledgervision-ready" },
    }),
  );
  expect(send).toHaveBeenLastCalledWith(
    { type: "ledgervision-set-role", role: "manager" },
    window.location.origin,
  );
  fireEvent(
    window,
    new MessageEvent("message", {
      source: frame.contentWindow,
      origin: "https://unrelated.example",
      data: { type: "ledgervision-role", role: "owner" },
    }),
  );
  expect(
    screen.getByRole("button", { name: /Branch manager/ }),
  ).toHaveAttribute("aria-pressed", "true");
  fireEvent.change(screen.getByLabelText("Screen size"), {
    target: { value: "compact" },
  });
  expect(frame.parentElement).toHaveClass("w-[378px]");
});
