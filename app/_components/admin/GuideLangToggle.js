"use client";

import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";

// Switches the Guide between English and Urdu. The choice is kept in a
// cookie so the Guide opens in the same language from the menu next time.
export default function GuideLangToggle({ lang }) {
  const router = useRouter();
  const next = lang === "ur" ? "en" : "ur";

  function choose() {
    document.cookie = `guide_lang=${next}; path=/; max-age=31536000; samesite=lax`;
    router.replace(`/admin/guide?lang=${next}`, { scroll: false });
  }

  return (
    <button type="button" onClick={choose} className="btn-secondary min-h-[44px]" lang={next} aria-label={next === "ur" ? "Show the guide in Urdu" : "Show the guide in English"}>
      <Languages size={17} aria-hidden />
      {next === "ur" ? <span className="font-urdu text-[17px] leading-none">اردو</span> : "English"}
    </button>
  );
}
