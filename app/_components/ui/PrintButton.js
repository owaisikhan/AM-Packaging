"use client";

import { Printer } from "lucide-react";

// Opens the browser's print dialog, where "Save as PDF" is also offered.
export default function PrintButton({ label = "Print / Save as PDF" }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-secondary">
      <Printer size={17} aria-hidden /> {label}
    </button>
  );
}
