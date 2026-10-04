import Link from "next/link";
import { cookies } from "next/headers";
import { Noto_Nastaliq_Urdu } from "next/font/google";
import { ArrowLeft, ArrowRight, CircleHelp, Lightbulb, ShieldCheck } from "lucide-react";
import { can, requirePageRole, ROLES } from "@/app/_lib/helpers";
import { DAY_ADMIN, DAY_WORKER, GUIDE_SECTIONS, ROUTINE_ICON as RoutineIcon, TROUBLE } from "@/app/_lib/guide-content";
import { DAY_ADMIN_UR, DAY_WORKER_UR, SECTIONS_UR, TROUBLE_UR, UI_UR } from "@/app/_lib/guide-content-ur";
import PageHeader from "@/app/_components/layout/PageHeader";
import Badge from "@/app/_components/ui/Badge";
import GuideLangToggle from "@/app/_components/admin/GuideLangToggle";

export const metadata = { title: "Guide" };

// Nastaliq, the script Urdu readers expect. Loaded on this page only.
const urduFont = Noto_Nastaliq_Urdu({ weight: ["400", "700"], subsets: ["arabic"], display: "swap", variable: "--font-nastaliq" });

const UI_EN = {
  title: "Guide",
  subtitleAdmin: "How to use AM Packaging, step by step. You see the worker steps and the admin steps.",
  subtitleWorker: "How to use AM Packaging, step by step. Tap a topic to jump to it.",
  crumbHome: "Home",
  jump: "Jump to a topic",
  day: "Your day",
  goodToKnow: "Good to know",
  adminsOnly: "Admins only",
  forAdmins: "For admins",
  trouble: "If something goes wrong",
};

// Shows **words** in bold: the exact button and field names on screen. In
// Urdu they stay English, kept left to right inside the Urdu sentence.
function Rich({ text, ur }) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 ? (
      <strong key={i} className={ur ? "mx-1 font-sans font-semibold text-heading" : "font-semibold text-heading"}>
        {ur ? (
          <bdi dir="ltr" lang="en">
            {part}
          </bdi>
        ) : (
          part
        )}
      </strong>
    ) : (
      part
    ),
  );
}

// The English section with its Urdu words laid over it, when there are any.
function localise(s, ur) {
  const t = ur ? SECTIONS_UR[s.id] : null;
  if (!t) return s;
  return { ...s, title: t.title, steps: t.steps, tips: t.tips, link: s.link && { ...s.link, urLabel: t.linkLabel } };
}

function Section({ s, ui, ur, badge }) {
  const Icon = s.icon;
  const Arrow = ur ? ArrowLeft : ArrowRight;
  return (
    <section id={s.id} className="card scroll-mt-24 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-ink">
          <Icon size={20} aria-hidden />
        </span>
        <h2 className={`card-title min-w-0 flex-1 ${ur ? "leading-[2]" : ""}`}>{s.title}</h2>
        {s.who === "admin" && badge ? (
          <Badge tone="info">
            <ShieldCheck size={13} aria-hidden /> {ui.adminsOnly}
          </Badge>
        ) : null}
      </div>
      <ol className="mt-4 flex flex-col gap-3">
        {s.steps.map((step, i) => (
          <li key={i} className={`flex gap-3 text-text ${ur ? "text-[17px] leading-[2.3]" : "text-base leading-relaxed"}`}>
            <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary-ink" aria-hidden>
              {i + 1}
            </span>
            <span className="min-w-0 pt-0.5">
              <Rich text={step} ur={ur} />
            </span>
          </li>
        ))}
      </ol>
      {s.tips?.length ? (
        <div className="mt-4 rounded-xl border border-border bg-background p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-heading">
            <Lightbulb size={16} aria-hidden /> {ui.goodToKnow}
          </p>
          <ul className={`mt-2 flex list-disc flex-col gap-1.5 ps-5 text-text ${ur ? "text-[16px] leading-[2.3]" : "text-[15px] leading-relaxed"}`}>
            {s.tips.map((t, i) => (
              <li key={i}>
                <Rich text={t} ur={ur} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {s.link ? (
        <Link href={s.link.href} className="btn-primary mt-5 w-full justify-center sm:w-auto">
          {ur ? (
            <>
              <bdi dir="ltr" lang="en" className="font-sans">
                {s.link.urLabel ?? s.link.label}
              </bdi>{" "}
              {ui.open}
            </>
          ) : (
            s.link.label
          )}{" "}
          <Arrow size={17} aria-hidden />
        </Link>
      ) : null}
    </section>
  );
}

export default async function GuidePage({ searchParams }) {
  const user = await requirePageRole();
  const isAdmin = user.role === ROLES.ADMIN;
  const sp = await searchParams;
  const saved = (await cookies()).get("guide_lang")?.value;
  const ur = (sp.lang ?? saved) === "ur";
  const ui = ur ? UI_UR : UI_EN;
  const sections = GUIDE_SECTIONS.map((s) => localise(s, ur));
  // Workers see the sections for what they have been allowed to do.
  const allowed = (s) => !s.perm || can(user, s.perm);
  const everyone = sections.filter((s) => (s.who === "all" || (!isAdmin && s.perm)) && allowed(s));
  const adminOnly = isAdmin ? sections.filter((s) => s.who === "admin") : [];
  const day = isAdmin ? (ur ? DAY_ADMIN_UR : DAY_ADMIN) : ur ? DAY_WORKER_UR : DAY_WORKER;
  const trouble = ur ? TROUBLE_UR : TROUBLE;
  const urText = ur ? "font-urdu" : "";

  return (
    <div className={`flex flex-col gap-6 ${urduFont.variable}`}>
      <PageHeader
        title={ur ? <span className="font-urdu font-bold leading-[1.9]" lang="ur" dir="rtl">{ui.title}</span> : ui.title}
        subtitle={<span className={ur ? "font-urdu text-[15px] leading-[2.2]" : ""} lang={ur ? "ur" : undefined} dir={ur ? "rtl" : undefined}>{isAdmin ? ui.subtitleAdmin : ui.subtitleWorker}</span>}
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Guide" }]}
        actions={<GuideLangToggle lang={ur ? "ur" : "en"} />}
      />

      <div className={`mx-auto flex w-full max-w-3xl flex-col gap-6 ${urText}`} lang={ur ? "ur" : "en"} dir={ur ? "rtl" : "ltr"}>
        <nav aria-label="Guide topics" className="card p-5 sm:p-6">
          <h2 className={`card-title ${ur ? "leading-[2]" : ""}`}>{ui.jump}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {[...everyone, ...adminOnly].map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className={`btn-secondary min-h-[44px] ${ur ? "text-[15px] leading-[2]" : "text-[14px]"}`}>
                  {s.title.replace(/ \(.*\)$/, "")}
                </a>
              </li>
            ))}
            <li>
              <a href="#trouble" className={`btn-secondary min-h-[44px] ${ur ? "text-[15px] leading-[2]" : "text-[14px]"}`}>
                {ui.trouble}
              </a>
            </li>
          </ul>
        </nav>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-ink">
              <RoutineIcon size={20} aria-hidden />
            </span>
            <h2 className={`card-title ${ur ? "leading-[2]" : ""}`}>{ui.day}</h2>
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {day.map((d, i) => (
              <li key={i} className={`flex gap-3 text-text ${ur ? "text-[17px] leading-[2.3]" : "text-base leading-relaxed"}`}>
                <span className={`${ur ? "mt-4" : "mt-2.5"} h-2 w-2 shrink-0 rounded-full bg-primary`} aria-hidden />
                <span className="min-w-0">
                  <Rich text={d} ur={ur} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        {everyone.map((s) => (
          <Section key={s.id} s={s} ui={ui} ur={ur} badge={isAdmin} />
        ))}

        {adminOnly.length ? (
          <>
            <h2 className="mt-2 flex items-center gap-2 text-lg font-bold text-heading">
              <ShieldCheck size={20} aria-hidden /> {ui.forAdmins}
            </h2>
            {adminOnly.map((s) => (
              <Section key={s.id} s={s} ui={ui} ur={ur} badge={isAdmin} />
            ))}
          </>
        ) : null}

        <section id="trouble" className="card scroll-mt-24 p-5 sm:p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-ink">
              <CircleHelp size={20} aria-hidden />
            </span>
            <h2 className={`card-title ${ur ? "leading-[2]" : ""}`}>{ui.trouble}</h2>
          </div>
          <dl className="mt-4 flex flex-col gap-4">
            {trouble.map((t) => (
              <div key={t.q}>
                <dt className={`font-semibold text-heading ${ur ? "text-[17px] leading-[2.3]" : "text-base"}`}>{t.q}</dt>
                <dd className={`mt-1 text-text ${ur ? "text-[17px] leading-[2.3]" : "text-base leading-relaxed"}`}>
                  <Rich text={t.a} ur={ur} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
