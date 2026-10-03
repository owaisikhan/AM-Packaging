"use client";

import clsx from "clsx";

// Toggle pills, as on the reference dashboard (Daily / Weekly / Monthly).
export default function Pills({ options, value, onChange, label }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={clsx(
            "min-h-[36px] pointer-coarse:min-h-[44px] rounded-full border px-4 text-[13px] font-semibold",
            value === o.value
              ? "border-primary bg-primary-light text-primary-ink"
              : "border-border bg-surface text-secondary hover:border-primary hover:text-primary-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
