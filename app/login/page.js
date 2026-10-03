import { Package2 } from "lucide-react";
import { siteConfig } from "@/app/_lib/siteConfig";
import { isDemoMode } from "@/app/_lib/config";
import LoginForm from "@/app/_components/admin/LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }) {
  const { next = "" } = await searchParams;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#f0fbf5_0%,#e8f6f0_45%,#e3eefc_100%)] px-4 py-10 dark:bg-[linear-gradient(135deg,#0f172a_0%,#10231c_100%)]">
      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-3 shadow-sm">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
          <Package2 size={22} aria-hidden />
        </span>
        <span className="flex flex-col border-l border-border pl-3 leading-tight">
          <span className="text-lg font-bold text-heading">{siteConfig.appName}</span>
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary-ink">{siteConfig.appTagline}</span>
        </span>
      </div>

      <div className="w-full max-w-[440px] overflow-hidden rounded-[20px] border border-border bg-surface shadow-[0_8px_40px_rgb(34_181_115/0.12)]">
        <div className="h-1 bg-[linear-gradient(90deg,#3b82f6,#22b573)]" aria-hidden />
        <div className="px-6 py-9 sm:px-9">
          <h1 className="text-center text-2xl font-bold text-heading">Welcome back!</h1>
          <p className="mt-2 text-center text-sm text-muted">Sign in to {siteConfig.fullName}.</p>
          <LoginForm next={next} demo={isDemoMode} />
          <p className="mt-7 border-t border-border pt-6 text-center text-sm text-muted">
            No account yet, or forgot your password? Ask an admin to set it up for you.
          </p>
        </div>
      </div>
    </main>
  );
}
