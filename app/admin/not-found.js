import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

// Shown inside the app shell when a record is not there (a mistyped link,
// or an item that was never saved).
export default function AdminNotFound() {
  return (
    <div className="card mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-muted">
        <SearchX size={26} aria-hidden />
      </span>
      <h1 className="page-title">Not found</h1>
      <p className="text-sm text-secondary">
        That page or record does not exist. The link may be mistyped, or it points to something that was never saved.
      </p>
      <Link href="/admin" className="btn-primary">
        <ArrowLeft size={17} aria-hidden /> Back to the dashboard
      </Link>
    </div>
  );
}
