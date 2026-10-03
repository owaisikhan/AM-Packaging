import { Hammer } from "lucide-react";
import PageHeader from "@/app/_components/layout/PageHeader";

// Placeholder for a section that is planned but not built yet. The database
// side of it already exists; this says plainly that the screen does not.
export default function ComingSoon({ title, subtitle, phase, points }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} subtitle={subtitle} crumbs={[{ label: "Home", href: "/admin" }, { label: title }]} />
      <div className="card flex flex-col items-center px-6 py-14 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
          <Hammer size={26} strokeWidth={1.8} aria-hidden />
        </span>
        <p className="text-base font-semibold text-heading">This screen is being built (phase {phase})</p>
        <ul className="mt-3 max-w-lg list-disc space-y-1 pl-5 text-left text-sm text-muted">
          {points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
