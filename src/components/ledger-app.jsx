"use client";
import dynamic from "next/dynamic";

const MobileApp = dynamic(() => import("./mobile-app"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      className="grid min-h-dvh place-items-center text-sm text-brand"
    >
      Opening your workspace…
    </div>
  ),
});
export default function LedgerApp() {
  return <MobileApp />;
}
