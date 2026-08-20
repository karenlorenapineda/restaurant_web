import type React from "react";

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-white/10 bg-zinc-950/70 p-5 shadow-2xl shadow-black/25">
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
  return (
    <div
      className={`rounded-md border border-white/10 bg-[#333333] p-5 shadow-2xl shadow-black/30 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
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
      className={`rounded-sm border px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.12em] shadow-lg shadow-black/10 transition ${
        active
          ? "border-[#e8b45f] bg-[#e8b45f] text-zinc-950"
          : "border-white/10 bg-black/20 text-zinc-300 hover:border-[#e8b45f]/45 hover:bg-[#333333] hover:text-white"
      }`}
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
    <label className="block text-sm font-semibold text-zinc-200">
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
    <label className="flex items-center gap-3 rounded-sm border border-white/10 bg-zinc-950/60 p-4 text-sm font-semibold text-zinc-200">
      <input
        checked={checked}
        className="h-5 w-5 accent-[#e8b45f]"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

export function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-sm border border-white/10 bg-black/25 px-4 py-3">
      {label}
    </span>
  );
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
      className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-white/10 text-lg font-bold leading-none text-zinc-400 transition hover:border-[#e8b45f] hover:bg-[#7f2019] hover:text-white"
      onClick={onClick}
      type="button"
    >
      x
    </button>
  );
}
