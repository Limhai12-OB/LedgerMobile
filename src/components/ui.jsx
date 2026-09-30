"use client";
import { useEffect, useRef } from "react";

const paths = {
  home: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  transactions: "M5 3h14v18l-3-2-4 2-4-2-3 2V3m4 5h6m-6 4h6",
  capture: "M4 7h4l2-3h4l2 3h4v13H4z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  ai: "m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3z",
  reports: "M4 20h16M7 16V9m5 7V4m5 12v-5",
  settings: "M4 7h16M4 17h16M8 4v6m8 4v6",
  plus: "M12 5v14M5 12h14",
  up: "M5 17 17 5M5 5h12v12",
  down: "m5 7 12 12M5 19h12V7",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  branch: "M3 9h18L19 3H5zM5 9v12h14V9M9 21v-7h6v7",
  voice:
    "M8 6a4 4 0 0 1 8 0v6a4 4 0 0 1-8 0zM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8",
};
export function Icon({ name, className = "size-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.transactions} />
    </svg>
  );
}
export function Button({ children, primary, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`btn ${primary ? "btn-primary" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Heading({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="mb-2 text-[25px] leading-tight font-semibold tracking-[-1px]">
          {title}
        </h1>
        <p className="text-xs leading-6 text-muted">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
export function Field({ label, className = "", children, ...props }) {
  return (
    <label className="field">
      {label}
      {children || <input className={`input ${className}`} {...props} />}
    </label>
  );
}
export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          onClose();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-28px)] max-w-lg overflow-y-auto rounded-[18px] border border-line bg-white p-6 text-ink shadow-xl backdrop:bg-[#14292366] backdrop:backdrop-blur-sm"
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <button
          onClick={onClose}
          className="size-11 text-2xl"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
