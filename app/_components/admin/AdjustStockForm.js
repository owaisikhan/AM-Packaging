"use client";

import { useActionState, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { adjustStock } from "@/app/_lib/actions";
import { formatQty } from "@/app/_lib/format-helpers";
import FormMessage from "@/app/_components/ui/FormMessage";
import SubmitButton from "@/app/_components/ui/SubmitButton";

export default function AdjustStockForm({ items, initialItem, today }) {
  const [state, formAction] = useActionState(adjustStock, null);
  const [itemId, setItemId] = useState(initialItem);
  const [type, setType] = useState("opening");
  const [direction, setDirection] = useState("add");
  const [qty, setQty] = useState("");

  const item = useMemo(() => items.find((i) => i.id === itemId), [items, itemId]);
  const n = Number(String(qty).replace(/,/g, ""));
  const signed = Number.isFinite(n) && n > 0 ? (type === "adjustment" && direction === "remove" ? -n : n) : 0;
  const after = item ? Number(item.on_hand) + signed : null;

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="card p-5 sm:p-6">
        <h2 className="card-title border-b border-border pb-4">Stock entry</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="item_id" className="form-label">
              Item<span className="ml-0.5 text-danger-ink">*</span>
            </label>
            <select id="item_id" name="item_id" value={itemId} onChange={(e) => setItemId(e.target.value)} required className="form-select">
              <option value="">Pick an item</option>
              <optgroup label="Raw materials">
                {items.filter((i) => i.kind === "raw").map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}{i.brand_name ? ` (${i.brand_name})` : ""}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Products">
                {items.filter((i) => i.kind === "finished").map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <fieldset className="sm:col-span-2">
            <legend className="form-label">Type of entry</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { v: "opening", t: "Opening stock", d: "The first count when you start using the app." },
                { v: "adjustment", t: "Adjustment", d: "A correction after a count: damage, loss, found stock." },
              ].map((o) => (
                <label
                  key={o.v}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${type === o.v ? "border-primary bg-primary-light" : "border-border"}`}
                >
                  <input type="radio" name="type" value={o.v} checked={type === o.v} onChange={() => setType(o.v)} className="mt-1 accent-[var(--color-primary)]" />
                  <span>
                    <span className="block text-sm font-semibold text-heading">{o.t}</span>
                    <span className="block text-xs text-secondary">{o.d}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {type === "adjustment" ? (
            <div className="sm:col-span-2">
              <label htmlFor="direction" className="form-label">Add or remove</label>
              <select id="direction" name="direction" value={direction} onChange={(e) => setDirection(e.target.value)} className="form-select">
                <option value="add">Add to stock (found more than recorded)</option>
                <option value="remove">Remove from stock (damaged, lost, counted short)</option>
              </select>
            </div>
          ) : null}

          <div>
            <label htmlFor="qty" className="form-label">
              Quantity{item ? ` (${item.unit})` : ""}<span className="ml-0.5 text-danger-ink">*</span>
            </label>
            <input id="qty" name="qty" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} required placeholder="e.g. 120" className="form-input" />
          </div>
          <div>
            <label htmlFor="movement_date" className="form-label">Date</label>
            <input id="movement_date" name="movement_date" type="date" defaultValue={today} className="form-input" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="note" className="form-label">
              {type === "adjustment" ? "Reason" : "Note"}
              {type === "adjustment" ? <span className="ml-0.5 text-danger-ink">*</span> : null}
            </label>
            <input
              id="note"
              name="note"
              required={type === "adjustment"}
              placeholder={type === "adjustment" ? "e.g. 2 cartons water damaged" : "e.g. Counted on 1 October"}
              className="form-input"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="card p-5 sm:p-6">
          <h2 className="card-title border-b border-border pb-4">Stock check</h2>
          <dl className="mt-4 flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">In stock now</dt>
              <dd className="num font-semibold text-heading">{item ? `${formatQty(item.on_hand)} ${item.unit}` : "Pick an item"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">This entry</dt>
              <dd className={`num font-semibold ${signed < 0 ? "text-danger-ink" : "text-primary-ink"}`}>
                {item && signed !== 0 ? `${signed > 0 ? "+" : "-"}${formatQty(Math.abs(signed))} ${item.unit}` : "None"}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-border pt-3">
              <dt className="font-semibold text-heading">After saving</dt>
              <dd className={`num text-lg font-bold ${after !== null && after < 0 ? "text-danger-ink" : "text-primary-ink"}`}>
                {after !== null ? `${formatQty(after)} ${item.unit}` : "None"}
              </dd>
            </div>
          </dl>
          {after !== null && after < 0 ? (
            <p className="mt-3 text-xs font-medium text-danger-ink">Stock cannot go below zero. Lower the quantity.</p>
          ) : null}
        </div>
        <FormMessage state={state} />
        <SubmitButton className="btn-primary h-12 w-full text-[15px]">
          <Save size={18} aria-hidden /> Save stock entry
        </SubmitButton>
      </div>
    </form>
  );
}
