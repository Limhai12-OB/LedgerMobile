"use client";
import { useEffect, useRef, useState } from "react";

export default function PhoneSimulator() {
  const frame = useRef(null);
  const [role, setRole] = useState("owner");
  const [compact, setCompact] = useState(false);
  function updateRole(value) {
    setRole(value);
    frame.current?.contentWindow?.postMessage(
      { type: "ledgervision-set-role", role: value },
      window.location.origin,
    );
  }
  useEffect(() => {
    const receive = (e) => {
      if (
        e.origin !== window.location.origin ||
        e.source !== frame.current?.contentWindow
      )
        return;
      if (e.data?.type === "ledgervision-ready") {
        frame.current.contentWindow.postMessage(
          { type: "ledgervision-set-role", role },
          window.location.origin,
        );
      }
      if (
        e.data?.type === "ledgervision-role" &&
        ["owner", "manager"].includes(e.data.role)
      )
        setRole(e.data.role);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [role]);
  return (
    <main className="min-h-dvh bg-[radial-gradient(ellipse_at_70%_25%,#e8eedb,transparent_55%)] text-[#203b32]">
      <div className="mx-auto grid max-w-[1080px] items-start gap-7 px-3 py-6 min-[681px]:grid-cols-[240px_1fr] min-[681px]:px-5 min-[851px]:grid-cols-[300px_1fr] min-[851px]:gap-20 min-[851px]:px-7 min-[851px]:py-[42px]">
        <aside className="mx-auto w-full max-w-[410px] min-[681px]:sticky min-[681px]:top-6 min-[681px]:pt-8">
          <div className="flex items-center gap-3 text-2xl font-bold tracking-[-1px]">
            <span className="rounded-[13px] bg-brand px-3 py-1.5 text-[28px] text-lime">
              ▥
            </span>
            LedgerVision
          </div>
          <div className="hidden min-[681px]:block">
            <p className="mt-8 mb-3 text-[10px] tracking-[2px] text-[#73826e]">
              MOBILE DEMO STUDIO
            </p>
            <h1 className="text-[34px] leading-[1.16] font-semibold tracking-[-1.2px]">
              Your business.
              <br />
              In your pocket.
            </h1>
            <p className="mt-4 text-[13px] leading-7 text-[#788373]">
              Explore the mobile experience. Navigate, capture a receipt, and
              follow your numbers—all inside the phone.
            </p>
          </div>
          <section className="mt-5 min-[681px]:mt-8 min-[681px]:border-t min-[681px]:border-[#dbe3d4] min-[681px]:pt-6">
            <h2 className="mb-3 text-xs font-semibold">Test a perspective</h2>
            <div className="grid grid-cols-2 gap-2 min-[681px]:grid-cols-1">
              {[
                ["owner", "Business owner", "Dara · All branches"],
                ["manager", "Branch manager", "Sokha · BKK branch"],
              ].map(([value, title, detail]) => (
                <button
                  key={value}
                  onClick={() => updateRole(value)}
                  aria-pressed={role === value}
                  className={`rounded-xl border p-3 text-left ${role === value ? "border-brand bg-brand text-white shadow-md shadow-brand/10" : "border-[#dce4d4] bg-white/60 text-[#496044]"}`}
                >
                  <b className="text-xs">{title}</b>
                  <small className="mt-1 block text-[11px] opacity-70">
                    {detail}
                  </small>
                </button>
              ))}
            </div>
          </section>
          <label className="mt-6 hidden items-center justify-between gap-2 text-xs min-[681px]:flex">
            Screen size
            <select
              value={compact ? "compact" : "standard"}
              onChange={(e) => setCompact(e.target.value === "compact")}
              className="max-w-[175px] rounded-lg border border-line bg-white p-2.5"
            >
              <option value="standard">390 px · Standard</option>
              <option value="compact">360 px · Compact</option>
            </select>
          </label>
          <div className="mt-6 hidden rounded-xl bg-[#e9eedf] p-4 text-xs leading-6 text-[#6f7d65] min-[681px]:block">
            <b className="text-[#405936]">A working mobile demo</b>
            <br />
            Scroll inside the phone and use the bottom navigation. Your changes
            stay saved in this browser.
          </div>
          <p className="mt-5 hidden text-[11px] leading-6 text-[#87917e] min-[681px]:block">
            Sample data · April–September 2026
            <br />
            AI and receipt extraction are simulated.
            <br />
            Reset your data from More → Reset demo data.
          </p>
        </aside>
        <section
          className="flex min-w-0 flex-col items-center"
          aria-label="Interactive mobile phone simulator"
        >
          <p className="mb-4 flex items-center gap-2 text-[10px] tracking-[1.8px] text-[#829075] uppercase">
            <span className="size-1.5 rounded-full bg-[#6c9660]" />
            Interactive mobile preview
          </p>
          <div
            className={`flex min-h-[540px] max-w-full flex-col overflow-hidden rounded-[42px] border-[9px] border-[#22302b] bg-[#f9faf6] shadow-[0_0_0_1px_#586354,0_24px_65px_#25362126] ${compact ? "h-[min(780px,85dvh)] w-[378px] min-[681px]:h-[780px]" : "h-[min(844px,85dvh)] w-[408px] min-[681px]:h-[844px]"}`}
          >
            <div
              className="relative flex h-[43px] shrink-0 items-center justify-between px-[23px] pt-1 text-xs font-bold"
              aria-hidden="true"
            >
              <span>9:41</span>
              <span className="absolute top-[9px] left-1/2 h-[26px] w-[106px] -translate-x-1/2 rounded-full bg-[#22302b]" />
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 18 14" className="h-3 w-4 fill-current">
                  <path d="M1 10h3v4H1zm4-3h3v7H5zm4-3h3v10H9zm4-3h3v13h-3z" />
                </svg>
                <span className="rounded-[3px] border border-current p-[1px]">
                  <span className="block h-1.5 w-3.5 rounded-[1px] bg-current" />
                </span>
              </span>
            </div>
            <iframe
              ref={frame}
              src="/mobile"
              title="LedgerVision interactive mobile app"
              onLoad={() => updateRole(role)}
              className="min-h-0 w-full flex-1 border-0 bg-canvas"
            />
            <div
              className="grid h-[18px] shrink-0 place-items-center bg-white"
              aria-hidden="true"
            >
              <span className="h-1 w-[110px] rounded-full bg-[#26392d]" />
            </div>
          </div>
          <p className="mt-5 text-center text-[11px] text-[#89927f]">
            Fully interactive · Scroll within the screen to explore
          </p>
        </section>
      </div>
    </main>
  );
}
