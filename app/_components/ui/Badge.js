import clsx from "clsx";

// A status pill. Always carries a word, never colour alone.
export default function Badge({ tone = "gray", children, className }) {
  return <span className={clsx("badge", `badge-${tone}`, className)}>{children}</span>;
}
