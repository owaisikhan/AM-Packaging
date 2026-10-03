import clsx from "clsx";

// A label on the left and a figure on the right, for totals and summaries.
export default function MoneyRow({ label, children, strong = false, tone, className }) {
  return (
    <div className={clsx("flex items-baseline justify-between gap-4", strong ? "py-1" : "", className)}>
      <span className={strong ? "text-base font-bold text-heading" : "text-sm text-muted"}>{label}</span>
      <span
        className={clsx(
          "num text-right",
          strong ? "text-xl font-extrabold" : "text-sm font-semibold",
          tone === "primary" ? "text-primary" : tone === "danger" ? "text-danger" : "text-heading",
        )}
      >
        {children}
      </span>
    </div>
  );
}
