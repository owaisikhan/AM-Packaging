// What a table shows when there is nothing to list: what it means, and
// what to do next.
export default function EmptyState({ icon: Icon, title, children, action = null }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon ? (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
          <Icon size={26} strokeWidth={1.8} aria-hidden />
        </span>
      ) : null}
      <p className="text-base font-semibold text-heading">{title}</p>
      {children ? <p className="mt-1 max-w-md text-sm text-muted">{children}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
