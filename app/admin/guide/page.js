import Link from "next/link";
import { ArrowRight, CircleHelp, Lightbulb, ShieldCheck } from "lucide-react";
import { requirePageRole, ROLES } from "@/app/_lib/helpers";
import { DAY_ADMIN, DAY_WORKER, GUIDE_SECTIONS, ROUTINE_ICON as RoutineIcon, TROUBLE } from "@/app/_lib/guide-content";
import PageHeader from "@/app/_components/layout/PageHeader";
import Badge from "@/app/_components/ui/Badge";

export const metadata = { title: "Guide" };

// Shows **words** in bold: the exact button and field names on screen.
function Rich({ text }) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 ? (
      <strong key={i} className="font-semibold text-heading">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

function Section({ s }) {
  const Icon = s.icon;
  return (
    <section id={s.id} className="card scroll-mt-24 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-ink">
          <Icon size={20} aria-hidden />
        </span>
        <h2 className="card-title min-w-0 flex-1">{s.title}</h2>
        {s.who === "admin" ? (
          <Badge tone="info">
            <ShieldCheck size={13} aria-hidden /> Admins only
          </Badge>
        ) : null}
      </div>
      <ol className="mt-4 flex flex-col gap-3">
        {s.steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-base leading-relaxed text-text">
            <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary-ink" aria-hidden>
              {i + 1}
            </span>
            <span className="min-w-0 pt-0.5">
              <Rich text={step} />
            </span>
          </li>
        ))}
      </ol>
      {s.tips?.length ? (
        <div className="mt-4 rounded-xl border border-border bg-background p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-heading">
            <Lightbulb size={16} aria-hidden /> Good to know
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed text-text">
            {s.tips.map((t, i) => (
              <li key={i}>
                <Rich text={t} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {s.link ? (
        <Link href={s.link.href} className="btn-primary mt-5 w-full justify-center sm:w-auto">
          {s.link.label} <ArrowRight size={17} aria-hidden />
        </Link>
      ) : null}
    </section>
  );
}

export default async function GuidePage() {
  const user = await requirePageRole();
  const isAdmin = user.role === ROLES.ADMIN;
  const everyone = GUIDE_SECTIONS.filter((s) => s.who === "all");
  const adminOnly = isAdmin ? GUIDE_SECTIONS.filter((s) => s.who === "admin") : [];
  const day = isAdmin ? DAY_ADMIN : DAY_WORKER;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Guide"
        subtitle={
          isAdmin
            ? "How to use AM Packaging, step by step. You see the worker steps and the admin steps."
            : "How to use AM Packaging, step by step. Tap a topic to jump to it."
        }
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Guide" }]}
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <nav aria-label="Guide topics" className="card p-5 sm:p-6">
          <h2 className="card-title">Jump to a topic</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {[...everyone, ...adminOnly].map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="btn-secondary min-h-[44px] text-[14px]">
                  {s.title.replace(/ \(.*\)$/, "")}
                </a>
              </li>
            ))}
            <li>
              <a href="#trouble" className="btn-secondary min-h-[44px] text-[14px]">
                If something goes wrong
              </a>
            </li>
          </ul>
        </nav>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-ink">
              <RoutineIcon size={20} aria-hidden />
            </span>
            <h2 className="card-title">Your day</h2>
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {day.map((d, i) => (
              <li key={i} className="flex gap-3 text-base leading-relaxed text-text">
                <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                <span className="min-w-0">
                  <Rich text={d} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        {everyone.map((s) => (
          <Section key={s.id} s={s} />
        ))}

        {adminOnly.length ? (
          <>
            <h2 className="mt-2 flex items-center gap-2 text-lg font-bold text-heading">
              <ShieldCheck size={20} aria-hidden /> For admins
            </h2>
            {adminOnly.map((s) => (
              <Section key={s.id} s={s} />
            ))}
          </>
        ) : null}

        <section id="trouble" className="card scroll-mt-24 p-5 sm:p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-ink">
              <CircleHelp size={20} aria-hidden />
            </span>
            <h2 className="card-title">If something goes wrong</h2>
          </div>
          <dl className="mt-4 flex flex-col gap-4">
            {TROUBLE.map((t) => (
              <div key={t.q}>
                <dt className="text-base font-semibold text-heading">{t.q}</dt>
                <dd className="mt-1 text-base leading-relaxed text-text">{t.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
