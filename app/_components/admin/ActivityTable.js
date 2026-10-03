"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { formatDate } from "@/app/_lib/date-helpers";
import { initials } from "@/app/_lib/format-helpers";
import { ActionPill, MODULES, recordHref } from "./ActivityLabels";
import ChangesDialog from "./ChangesDialog";

const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", hour12: true });

export default function ActivityTable({ rows }) {
  const [open, setOpen] = useState(null);

  return (
    <>
      {/* Phones: one card per entry */}
      <ul className="divide-y divide-border xl:hidden">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 px-4 py-4">
            <span className="flex flex-wrap items-center justify-between gap-2">
              <ActionPill action={r.action} />
              <span className="text-xs text-muted">
                {formatDate(r.created_at)}, {timeFmt.format(new Date(r.created_at)).toLowerCase()}
              </span>
            </span>
            <span className="text-sm text-text">{r.summary}</span>
            <span className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted">{MODULES[r.module] ?? r.module}</span>
              {r.changes ? (
                <button type="button" onClick={() => setOpen(r)} className="btn-secondary min-h-[40px] px-3 py-1.5 text-[13px]">
                  <Eye size={15} aria-hidden /> View changes
                </button>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto xl:block">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">User</th>
              <th scope="col">Action</th>
              <th scope="col" className="hidden 2xl:table-cell">Module</th>
              <th scope="col">What happened</th>
              <th scope="col" className="text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const href = recordHref(r);
              return (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">
                    <div className="font-medium text-text">{formatDate(r.created_at)}</div>
                    <div className="text-xs text-muted">{timeFmt.format(new Date(r.created_at)).toLowerCase()}</div>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                        {initials(r.actor_name)}
                      </span>
                      <span className="font-medium text-heading">{r.actor_name}</span>
                    </div>
                  </td>
                  <td>
                    <ActionPill action={r.action} />
                    <div className="mt-1 text-xs text-muted 2xl:hidden">{MODULES[r.module] ?? r.module}</div>
                  </td>
                  <td className="hidden whitespace-nowrap text-sm text-secondary 2xl:table-cell">{MODULES[r.module] ?? r.module}</td>
                  <td className="min-w-[240px] text-sm text-text">
                    {href ? (
                      <Link href={href} className="hover:text-primary hover:underline">
                        {r.summary}
                      </Link>
                    ) : (
                      r.summary
                    )}
                  </td>
                  <td className="text-right">
                    {r.changes ? (
                      <button type="button" onClick={() => setOpen(r)} className="btn-secondary min-h-[38px] px-3 py-1.5 text-[13px]">
                        <Eye size={15} aria-hidden /> View changes
                      </button>
                    ) : (
                      <span className="text-xs text-muted">None</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ChangesDialog entry={open} onClose={() => setOpen(null)} />
    </>
  );
}
