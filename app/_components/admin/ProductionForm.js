"use client";

import { useActionState, useMemo, useState } from "react";
import { BookOpen, Check, Info, Plus, Trash2, TriangleAlert } from "lucide-react";
import { createProduction } from "@/app/_lib/actions";
import { formatQty } from "@/app/_lib/format-helpers";
import FormMessage from "@/app/_components/ui/FormMessage";
import SubmitButton from "@/app/_components/ui/SubmitButton";

let key = 0;
const r3 = (n) => Math.round(n * 1000) / 1000;
const num = (v) => {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// A material row. perUnit is set when the row came from the recipe; such a
// row follows the "how many made" box until the worker types in it.
const recipeRow = (line, made) => ({
  key: ++key,
  item_id: line.raw_item_id,
  perUnit: Number(line.qty_per_unit),
  qty: made > 0 ? String(r3(Number(line.qty_per_unit) * made)) : "",
  edited: false,
});
const blankRow = () => ({ key: ++key, item_id: "", perUnit: null, qty: "", edited: true });

function Label({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="form-label">
      {children}
      {required ? <span className="ml-0.5 text-danger-ink">*</span> : null}
    </label>
  );
}

export default function ProductionForm({ products, rawItems, recipes, today, isAdmin, initialProduct }) {
  const [state, formAction] = useActionState(createProduction, null);
  const [productId, setProductId] = useState(initialProduct ?? "");
  const [made, setMade] = useState("");
  const [rows, setRows] = useState(() =>
    initialProduct && recipes[initialProduct] ? recipes[initialProduct].lines.map((l) => recipeRow(l, 0)) : [blankRow()],
  );

  const rawById = useMemo(() => Object.fromEntries(rawItems.map((i) => [i.id, i])), [rawItems]);
  const product = products.find((p) => p.id === productId);
  const recipe = productId ? recipes[productId] : null;
  const madeN = num(made);

  function pickProduct(id) {
    setProductId(id);
    const r = recipes[id];
    setRows(r && r.lines.length ? r.lines.map((l) => recipeRow(l, madeN)) : [blankRow()]);
  }

  function changeMade(value) {
    setMade(value);
    const n = num(value);
    // Rows still following the recipe move with the quantity made
    setRows((rs) => rs.map((r) => (r.perUnit !== null && !r.edited ? { ...r, qty: n > 0 ? String(r3(r.perUnit * n)) : "" } : r)));
  }

  function update(k, field, value) {
    setRows((rs) => rs.map((r) => (r.key === k ? { ...r, [field]: value, edited: true } : r)));
  }

  function resetToRecipe() {
    if (recipe) setRows(recipe.lines.map((l) => recipeRow(l, madeN)));
  }

  const used = rows.filter((r) => r.item_id && num(r.qty) > 0);

  return (
    <form action={formAction} className="grid gap-6 2xl:grid-cols-[1fr_380px]">
      <div className="flex min-w-0 flex-col gap-6">
        <section className="card p-5 sm:p-6">
          <h2 className="card-title border-b border-border pb-4">What was made</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <div className="sm:col-span-3 lg:col-span-1">
              <Label htmlFor="item_id" required>Product</Label>
              <select id="item_id" name="item_id" value={productId} onChange={(e) => pickProduct(e.target.value)} required className="form-select">
                <option value="">Pick a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {product ? (
                <p className="mt-1 text-xs text-muted">
                  In stock now: <span className="num font-medium text-text">{formatQty(product.on_hand)} {product.unit}</span>
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="qty_made" required>How many made{product ? ` (${product.unit})` : ""}</Label>
              <input id="qty_made" name="qty_made" inputMode="decimal" value={made} onChange={(e) => changeMade(e.target.value)} required placeholder="e.g. 60" className="form-input" />
            </div>
            <div>
              <Label htmlFor="run_date" required>Date</Label>
              <input id="run_date" name="run_date" type="date" defaultValue={today} required className="form-input" />
            </div>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 className="card-title">Raw materials used</h2>
              {recipe ? (
                <p className="mt-0.5 text-xs text-muted">Filled in from the recipe. Change any amount to what was really used.</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {recipe ? (
                <button type="button" onClick={resetToRecipe} className="btn-secondary min-h-[38px] px-3 py-1.5 text-[13px]">
                  <BookOpen size={15} aria-hidden /> Back to recipe
                </button>
              ) : null}
              <button type="button" onClick={() => setRows((rs) => [...rs, blankRow()])} className="btn-secondary min-h-[38px] px-3 py-1.5 text-[13px]">
                <Plus size={15} aria-hidden /> Add material
              </button>
            </div>
          </div>

          {productId && !recipe ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-background px-4 py-3 text-sm text-muted">
              <Info size={17} className="mt-0.5 shrink-0" aria-hidden />
              {isAdmin
                ? "This product has no recipe yet, so enter the materials by hand. Set one in Settings > Recipes to fill this in next time."
                : "This product has no recipe yet, so enter the materials by hand. An admin can set one up so it fills in next time."}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-3">
            {rows.map((r, i) => {
              const it = rawById[r.item_id];
              const qty = num(r.qty);
              const expected = r.perUnit !== null && madeN > 0 ? r3(r.perUnit * madeN) : null;
              const short = it && qty > Number(it.on_hand);
              const diff = expected !== null && r.qty !== "" ? r3(qty - expected) : null;
              return (
                <div key={r.key} className="grid grid-cols-[minmax(0,1fr)_44px] gap-3 rounded-xl border border-border p-3 lg:grid-cols-[minmax(0,1fr)_170px_44px] lg:items-start">
                  <div className="col-span-2 lg:col-span-1">
                    <label htmlFor={`mat-${r.key}`} className="form-label lg:sr-only">Material {i + 1}</label>
                    <select id={`mat-${r.key}`} name="material_id" value={r.item_id} onChange={(e) => update(r.key, "item_id", e.target.value)} className="form-select">
                      <option value="">Pick a raw material</option>
                      {rawItems.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}{m.brand_name ? ` (${m.brand_name})` : ""}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                      {it ? <span>In stock: <span className="num font-medium text-text">{formatQty(it.on_hand)} {it.unit}</span></span> : null}
                      {expected !== null ? <span>Recipe: <span className="num font-medium text-text">{formatQty(expected)} {it?.unit}</span></span> : null}
                      {diff !== null && diff > 0 ? <span className="font-semibold text-[#b45309] dark:text-warning">{formatQty(diff)} over recipe</span> : null}
                      {diff !== null && diff < 0 ? <span className="font-semibold text-info">{formatQty(-diff)} under recipe</span> : null}
                    </p>
                  </div>
                  <div>
                    <label htmlFor={`qty-${r.key}`} className="form-label lg:sr-only">Used{it ? ` (${it.unit})` : ""}</label>
                    <div className="relative">
                      <input
                        id={`qty-${r.key}`}
                        name="material_qty"
                        inputMode="decimal"
                        value={r.qty}
                        onChange={(e) => update(r.key, "qty", e.target.value)}
                        placeholder="0"
                        aria-invalid={short || undefined}
                        className={`form-input pr-12 ${short ? "border-danger" : ""}`}
                      />
                      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">{it?.unit ?? ""}</span>
                    </div>
                    {short ? (
                      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-danger-ink">
                        <TriangleAlert size={13} aria-hidden /> Only {formatQty(it.on_hand)} in stock
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-end justify-end lg:items-start">
                    <button
                      type="button"
                      onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : [blankRow()]))}
                      className="flex h-11 w-11 items-center justify-center rounded-lg bg-danger text-white hover:bg-[#b91c1c]"
                      aria-label={`Remove material ${i + 1}`}
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
          <textarea id="notes" name="notes" rows={3} placeholder="e.g. Two cores split on the slitter" className="form-input min-h-[96px] resize-y" />
        </section>
      </div>

      <div className="flex flex-col gap-6">
        <section className="card p-5 sm:p-6">
          <h2 className="card-title border-b border-border pb-4">When you save</h2>
          <div className="mt-4 flex flex-col gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-primary-ink">Adds to stock</p>
              <p className="mt-1 font-semibold text-heading">
                {product && madeN > 0 ? (
                  <>
                    <span className="num">+{formatQty(madeN)} {product.unit}</span> {product.name}
                  </>
                ) : (
                  <span className="font-normal text-muted">Pick the product and how many were made</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-danger-ink">Takes out of stock</p>
              {used.length === 0 ? (
                <p className="mt-1 text-muted">No materials yet</p>
              ) : (
                <ul className="mt-1 flex flex-col gap-1.5">
                  {used.map((r) => (
                    <li key={r.key} className="flex justify-between gap-3">
                      <span className="text-secondary">{rawById[r.item_id]?.name}</span>
                      <span className="num font-semibold text-heading">-{formatQty(num(r.qty))} {rawById[r.item_id]?.unit}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
        <FormMessage state={state} />
        <SubmitButton className="btn-primary h-12 w-full text-[15px]">
          <Check size={18} aria-hidden /> Save production run
        </SubmitButton>
      </div>
    </form>
  );
}
