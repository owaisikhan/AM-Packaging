"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Info, Plus, Trash2 } from "lucide-react";
import { createPurchase } from "@/app/_lib/actions";
import { formatMoney, formatQty } from "@/app/_lib/format-helpers";
import FormMessage from "@/app/_components/ui/FormMessage";
import SubmitButton from "@/app/_components/ui/SubmitButton";
import MoneyRow from "@/app/_components/ui/MoneyRow";

let key = 0;
const blankRow = () => ({ key: ++key, item_id: "", qty: "", rate: "" });
const num = (v) => {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const r2 = (n) => Math.round(n * 100) / 100;

function Label({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="form-label">
      {children}
      {required ? <span className="ml-0.5 text-danger">*</span> : null}
    </label>
  );
}

// New purchase. The totals on the right are a preview; post_purchase in the
// database works the real ones out again from the lines.
export default function PurchaseForm({ suppliers, items, settings, isAdmin, today, initialSupplier }) {
  const [state, formAction] = useActionState(createPurchase, null);
  const [rows, setRows] = useState(() => [blankRow()]);
  const [discount, setDiscount] = useState("");
  const [other, setOther] = useState("");
  const [gstOn, setGstOn] = useState(Boolean(settings?.gst_enabled));
  const [gstRate, setGstRate] = useState(String(Number(settings?.gst_rate ?? 18)));
  const [paid, setPaid] = useState("");

  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);

  function update(k, field, value) {
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== k) return r;
        const next = { ...r, [field]: value };
        // Picking an item fills in its usual rate, if the rate is still empty
        if (field === "item_id" && value && r.rate === "" && Number(byId[value]?.default_rate) > 0) {
          next.rate = String(Number(byId[value].default_rate));
        }
        return next;
      }),
    );
  }

  const subtotal = r2(rows.reduce((s, r) => s + r2(num(r.qty) * num(r.rate)), 0));
  const disc = num(discount);
  const gst = gstOn ? r2(((subtotal - disc) * num(gstRate)) / 100) : 0;
  const grand = r2(subtotal - disc + gst + num(other));
  const due = Math.max(r2(grand - num(paid)), 0);

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="flex min-w-0 flex-col gap-6">
        <section className="card p-5 sm:p-6">
          <h2 className="card-title border-b border-border pb-4">Purchase information</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <div className="sm:col-span-3 lg:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="supplier_id" required>Supplier</Label>
                <Link href="/admin/suppliers/new" target="_blank" className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  New supplier <ExternalLink size={12} aria-hidden />
                </Link>
              </div>
              <select id="supplier_id" name="supplier_id" defaultValue={initialSupplier ?? ""} required className="form-select">
                <option value="">Pick a supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="supplier_ref">Their bill no.</Label>
              <input id="supplier_ref" name="supplier_ref" placeholder="e.g. LF-2291" className="form-input" />
            </div>
            <div>
              <Label htmlFor="purchase_date" required>Purchase date</Label>
              <input id="purchase_date" name="purchase_date" type="date" defaultValue={today} required className="form-input" />
            </div>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <h2 className="card-title">Items bought</h2>
            <button type="button" onClick={() => setRows((rs) => [...rs, blankRow()])} className="btn-secondary min-h-[38px] px-3 py-1.5 text-[13px]">
              <Plus size={15} aria-hidden /> Add item row
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <div className="hidden grid-cols-[minmax(0,1fr)_110px_110px_124px_44px] gap-3 rounded-lg bg-background px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted lg:grid">
              <span>Raw material</span>
              <span>Quantity</span>
              <span>Rate (Rs)</span>
              <span className="text-right">Amount</span>
              <span className="sr-only">Remove</span>
            </div>
            {rows.map((r, i) => {
              const it = byId[r.item_id];
              const amount = r2(num(r.qty) * num(r.rate));
              return (
                <div
                  key={r.key}
                  className="grid grid-cols-2 gap-3 rounded-xl border border-border p-3 lg:grid-cols-[minmax(0,1fr)_110px_110px_124px_44px] lg:items-start lg:rounded-none lg:border-0 lg:border-b lg:px-3 lg:py-3"
                >
                  <div className="col-span-2 lg:col-span-1">
                    <label htmlFor={`item-${r.key}`} className="form-label lg:sr-only">Raw material {i + 1}</label>
                    <select id={`item-${r.key}`} name="line_item_id" value={r.item_id} onChange={(e) => update(r.key, "item_id", e.target.value)} className="form-select">
                      <option value="">Pick a raw material</option>
                      {items.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}{m.brand_name ? ` (${m.brand_name})` : ""}
                        </option>
                      ))}
                    </select>
                    {it ? (
                      <p className="mt-1 text-xs text-muted">
                        In stock: <span className="num font-medium text-text">{formatQty(it.on_hand)} {it.unit}</span>
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label htmlFor={`qty-${r.key}`} className="form-label lg:sr-only">Quantity{it ? ` (${it.unit})` : ""}</label>
                    <input id={`qty-${r.key}`} name="line_qty" inputMode="decimal" value={r.qty} onChange={(e) => update(r.key, "qty", e.target.value)} placeholder={it ? it.unit : "0"} className="form-input" />
                  </div>
                  <div>
                    <label htmlFor={`rate-${r.key}`} className="form-label lg:sr-only">Rate (Rs)</label>
                    <input id={`rate-${r.key}`} name="line_rate" inputMode="decimal" value={r.rate} onChange={(e) => update(r.key, "rate", e.target.value)} placeholder="0" className="form-input" />
                  </div>
                  <div className="flex flex-col justify-center lg:block lg:pt-2.5 lg:text-right">
                    <span className="text-xs text-muted lg:hidden">Amount</span>
                    <span className="num text-[15px] font-bold text-heading">{formatMoney(amount, { decimals: amount % 1 !== 0 })}</span>
                  </div>
                  <div className="flex items-center justify-end lg:pt-0.5">
                    <button
                      type="button"
                      onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : [blankRow()]))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger text-white hover:bg-[#dc2626]"
                      aria-label={`Remove row ${i + 1}`}
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <Label htmlFor="notes">Notes</Label>
          <textarea id="notes" name="notes" rows={3} placeholder="e.g. Delivered by their truck, two rolls slightly dented" className="form-input min-h-[96px] resize-y" />
        </section>
      </div>

      <div className="flex flex-col gap-6">
        <section className="card p-5 sm:p-6">
          <h2 className="card-title border-b border-border pb-4">Bill total</h2>
          <div className="mt-4 flex flex-col gap-3.5">
            <MoneyRow label="Items subtotal">{formatMoney(subtotal, { decimals: subtotal % 1 !== 0 })}</MoneyRow>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="discount" className="text-sm text-muted">Discount (Rs)</label>
              <input id="discount" name="discount" inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" className="form-input w-32 text-right" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="other_charges" className="text-sm text-muted">Freight / other (Rs)</label>
              <input id="other_charges" name="other_charges" inputMode="decimal" value={other} onChange={(e) => setOther(e.target.value)} placeholder="0" className="form-input w-32 text-right" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm text-muted">
                <input type="checkbox" name="gst_enabled" checked={gstOn} onChange={(e) => setGstOn(e.target.checked)} className="h-5 w-5 accent-[var(--color-primary)]" />
                GST
              </label>
              <div className="flex items-center gap-2">
                <input name="gst_rate" inputMode="decimal" value={gstRate} onChange={(e) => setGstRate(e.target.value)} disabled={!gstOn} aria-label="GST rate in percent" className="form-input w-20 text-right" />
                <span className="text-sm text-muted">%</span>
              </div>
            </div>
            {gstOn ? <MoneyRow label="GST amount">{formatMoney(gst, { decimals: gst % 1 !== 0 })}</MoneyRow> : null}
            <div className="border-t border-border pt-4">
              <MoneyRow label="Grand total" strong tone="primary">{formatMoney(grand, { decimals: grand % 1 !== 0 })}</MoneyRow>
            </div>
            {disc > subtotal ? <p className="text-xs font-medium text-danger">The discount is more than the items total.</p> : null}
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="card-title border-b border-border pb-4">Payment</h2>
          {isAdmin ? (
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <Label htmlFor="amount_paid">Amount paid now (Rs)</Label>
                <input id="amount_paid" name="amount_paid" inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0, if paying later" className="form-input" />
              </div>
              {num(paid) > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div>
                    <Label htmlFor="payment_method">Paid by</Label>
                    <select id="payment_method" name="payment_method" defaultValue="cash" className="form-select">
                      <option value="cash">Cash</option>
                      <option value="bank">Bank transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="online">Online / IBFT</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="payment_reference">Cheque / transaction no.</Label>
                    <input id="payment_reference" name="payment_reference" placeholder="e.g. Chq 004417" className="form-input" />
                  </div>
                </div>
              ) : null}
              <MoneyRow label="Left to pay on this bill" tone={due > 0 ? "danger" : "primary"}>{formatMoney(due, { decimals: due % 1 !== 0 })}</MoneyRow>
            </div>
          ) : (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-background px-4 py-3 text-sm text-muted">
              <Info size={17} className="mt-0.5 shrink-0" aria-hidden />
              Payments to suppliers are recorded by an admin. Save the purchase and tell an admin what was paid.
            </p>
          )}
        </section>

        <FormMessage state={state} />
        <SubmitButton className="btn-primary h-12 w-full text-[15px]">
          <Check size={18} aria-hidden /> Save purchase
        </SubmitButton>
        <p className="-mt-3 text-center text-xs text-muted">Saving adds these quantities to stock.</p>
      </div>
    </form>
  );
}
