import { can, getCurrentUser } from "@/app/_lib/helpers";
import { buildReport, REPORT_TABS, reportToCsv, resolveRange } from "@/app/_lib/reports";
import { todayISO } from "@/app/_lib/date-helpers";

// The open report tab as a CSV file: the same tables as the page.
export async function GET(request) {
  const user = await getCurrentUser();
  if (!can(user, "reports")) {
    return new Response("You do not have permission to download reports. Ask an admin.", { status: 403 });
  }
  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const tab = REPORT_TABS.find((t) => t.id === sp.tab) ?? REPORT_TABS[0];
  if (tab.id === "balances" && !can(user, "balances")) {
    return new Response("You do not have permission to see balances. Ask an admin.", { status: 403 });
  }
  const today = todayISO();
  const range = resolveRange(sp, today);
  const report = await buildReport(tab.id, range, today);
  const csv = reportToCsv(tab.label, range, report);
  const name = `${tab.id}-report-${report.asOf ? today : `${range.from}-to-${range.to}`}.csv`;
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
