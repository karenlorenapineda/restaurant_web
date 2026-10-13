import type React from "react";

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="ui-metric">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e8b45f]">
        {label}
      </p>
      <p className="mt-3 font-display text-4xl font-bold">{value}</p>
    </div>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`ui-panel ${className}`}>{children}</div>;
}

export function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`ui-tab ${active ? "ui-tab--active" : ""}`}
      aria-pressed={active}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="ui-field">
      {label}
      {children}
    </label>
  );
}

export function Checkbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="ui-checkbox">
      <input
        checked={checked}
        className="ui-checkbox-input"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

export function StatusPill({ label }: { label: string }) {
  return <span className="ui-status">{label}</span>;
}

export const inputClassName =
  "mt-2 w-full rounded-sm border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-[#e8b45f]";

export function getInputClassName(canEdit: boolean) {
  return `${inputClassName} ${
    canEdit ? "" : "cursor-default border-white/10 bg-black/20 text-zinc-300"
  }`;
}

export function DeleteButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="ui-delete"
      onClick={onClick}
      type="button"
    >
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
      </svg>
    </button>
  );
}
