"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

// Shown inside the app shell when a page fails to load (most often the
// connection to the database dropped). The menu stays usable.
export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="card mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fee2e2] text-danger-ink dark:bg-[#450a0a]">
        <TriangleAlert size={26} aria-hidden />
      </span>
      <h1 className="page-title">This page did not load</h1>
      <p className="text-sm text-secondary">
        Nothing was saved or lost. Check the internet connection and try again. If it keeps happening, tell an admin
        {error?.digest ? <> and give them this code: <span className="font-mono font-semibold text-heading">{error.digest}</span></> : null}.
      </p>
      <div className="flex flex-wrap justify-center gap-2.5">
        <button type="button" onClick={() => reset()} className="btn-primary">
          <RotateCcw size={17} aria-hidden /> Try again
        </button>
        <Link href="/admin" className="btn-secondary">Go to the dashboard</Link>
      </div>
    </div>
  );
}
