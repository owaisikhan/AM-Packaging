import Link from "next/link";
import { SearchX } from "lucide-react";

// For addresses outside the app (a mistyped link from a message).
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="card flex max-w-md flex-col items-center gap-4 px-6 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-muted">
          <SearchX size={26} aria-hidden />
        </span>
        <h1 className="page-title">Page not found</h1>
        <p className="text-sm text-secondary">That address does not exist in AM Packaging. Check the link, or open the app from the start.</p>
        <Link href="/admin" className="btn-primary">Open AM Packaging</Link>
      </div>
    </main>
  );
}
