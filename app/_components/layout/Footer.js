export default function Footer({ companyName }) {
  return (
    <footer className="app-footer mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface px-6 py-5 text-[13px] text-muted">
      <span>
        Copyright {new Date().getFullYear()} {companyName}. All rights reserved.
      </span>
    </footer>
  );
}
