import clsx from "clsx";

const TONES = {
  primary: "bg-[rgb(34_181_115/0.1)] text-primary-ink",
  info: "bg-[rgb(59_130_246/0.1)] text-info",
  warning: "bg-[rgb(245_158_11/0.1)] text-warning",
  danger: "bg-[rgb(239_68_68/0.1)] text-danger-ink",
};

const VALUE_TONES = {
  primary: "text-primary-ink",
  info: "text-heading",
  warning: "text-[#b45309] dark:text-warning",
  danger: "text-danger-ink",
  plain: "text-heading",
};

// Count card from the reference list pages: tinted icon tile, small caps
// label, big figure. The figure never wraps.
export default function StatCard({ icon: Icon, label, value, tone = "primary", valueTone, note }) {
  return (
    <div className="stat-card max-sm:flex-col max-sm:items-start max-sm:gap-3 max-sm:p-4 max-[400px]:px-3.5">
      <span className={clsx("stat-icon max-sm:h-10 max-sm:w-10 max-sm:rounded-xl", TONES[tone])}>
        <Icon size={22} strokeWidth={1.8} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-muted sm:text-[13px]">{label}</p>
        <p className={clsx("num text-[18px] font-bold leading-tight min-[400px]:text-[21px] sm:text-[26px]", VALUE_TONES[valueTone ?? tone] ?? VALUE_TONES.plain)}>
          {value}
        </p>
        {note ? <p className="mt-0.5 text-xs text-secondary">{note}</p> : null}
      </div>
    </div>
  );
}
