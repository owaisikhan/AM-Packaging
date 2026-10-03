import { getCurrentUser } from "@/app/_lib/helpers";
import { getActivityForExport } from "@/app/_lib/data-service";

const LIMIT = 5000;

function csvCell(value) {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// CSV download of the activity log with the page's filters (admins only).
export async function GET(request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return new Response("Only an admin can export the activity log.", { status: 403 });
  }

  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const rows = await getActivityForExport(sp, LIMIT);

  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const lines = [["Date and time (PKT)", "User", "Action", "Module", "Record", "What happened"].join(",")];
  for (const r of rows) {
    lines.push([fmt.format(new Date(r.created_at)), r.actor_name, r.action, r.module, r.record_label, r.summary].map(csvCell).join(","));
  }
  if (rows.length === LIMIT) {
    lines.push(csvCell(`Only the newest ${LIMIT} entries are included. Narrow the dates to export the rest.`));
  }

  const stamp = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
  return new Response(`﻿${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="activity-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
