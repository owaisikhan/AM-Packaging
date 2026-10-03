import Link from "next/link";
import { Boxes } from "lucide-react";
import { formatMicron, formatMoney, formatQty } from "@/app/_lib/format-helpers";
import StockStatus from "./StockStatus";
import EmptyState from "@/app/_components/ui/EmptyState";
import Pagination from "@/app/_components/ui/Pagination";
import Badge from "@/app/_components/ui/Badge";

// The items table shared by Stock, Raw Materials and Products.
// mode "stock" links rows to the stock history; "manage" links to the edit form.
export default function ItemsTable({ rows, total, page, perPage, basePath, params, mode = "stock", isAdmin, emptyAction }) {
  if (rows.length === 0) {
    return (
      <div className="card overflow-hidden">
        <EmptyState icon={Boxes} title="Nothing matches" action={emptyAction}>
          No items match these filters. Clear the search or pick another category.
        </EmptyState>
      </div>
    );
  }

  const hrefFor = (r) =>
    mode === "manage" ? `${r.kind === "raw" ? "/admin/raw-materials" : "/admin/products"}/${r.id}` : `/admin/stock/${r.id}`;

  return (
    <div className="card overflow-hidden">
      {/* Phones: one card per item, so the stock figure is never scrolled off screen */}
      <ul className="divide-y divide-border xl:hidden">
        {rows.map((r) => (
          <li key={r.id} className={r.active ? "" : "opacity-60"}>
            <Link href={hrefFor(r)} className="flex flex-col gap-2 px-4 py-4 active:bg-background">
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block font-semibold text-heading">{r.name}</span>
                  <span className="block text-xs text-muted">
                    {r.category_name}
                    {r.code ? ` · ${r.code}` : ""}
                    {r.brand_name ? ` · ${r.brand_name}` : ""}
                  </span>
                </span>
                <span className="num shrink-0 text-right">
                  <span className="block text-base font-bold text-heading">{formatQty(r.on_hand)}</span>
                  <span className="block text-xs text-muted">{r.unit}</span>
                </span>
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <StockStatus status={r.stock_status} />
                <span className="num text-xs text-muted">Low at {formatQty(r.low_stock_level)} {r.unit}</span>
                {r.active ? null : <Badge tone="gray">Inactive</Badge>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto xl:block">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Category</th>
              <th scope="col">Details</th>
              <th scope="col" className="text-right">In stock</th>
              <th scope="col" className="text-right">Low at</th>
              <th scope="col">Status</th>
              {isAdmin ? <th scope="col" className="text-right">Rate</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const href = hrefFor(r);
              const details = [
                r.brand_name,
                r.size_label,
                formatMicron(r.micron_value),
                r.color_name,
                r.rolls_per_carton ? `${r.rolls_per_carton} rolls/ctn` : null,
              ].filter(Boolean);
              return (
                <tr key={r.id} className={r.active ? "" : "opacity-60"}>
                  <td className="min-w-[220px]">
                    <Link href={href} className="font-semibold text-heading hover:text-primary-ink">
                      {r.name}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                      {r.code ? <span className="font-mono">{r.code}</span> : null}
                      {r.active ? null : <Badge tone="gray">Inactive</Badge>}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className="text-text">{r.category_name}</span>
                    <div className="text-xs text-muted">{r.kind === "raw" ? "Raw material" : "Product"}</div>
                  </td>
                  <td className="min-w-[160px] text-sm text-secondary">{details.length ? details.join(" · ") : "None"}</td>
                  <td className="num text-right">
                    <span className="text-[15px] font-bold text-heading">{formatQty(r.on_hand)}</span>{" "}
                    <span className="text-xs text-muted">{r.unit}</span>
                  </td>
                  <td className="num text-right text-sm text-secondary">
                    {formatQty(r.low_stock_level)} {r.unit}
                  </td>
                  <td>
                    <StockStatus status={r.stock_status} />
                  </td>
                  {isAdmin ? (
                    <td className="num text-right text-sm font-semibold text-primary-ink">
                      {Number(r.default_rate) > 0 ? formatMoney(r.default_rate, { decimals: Number(r.default_rate) % 1 !== 0 }) : "None"}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} perPage={perPage} total={total} basePath={basePath} params={params} />
    </div>
  );
}
