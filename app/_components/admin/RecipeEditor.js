"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { saveRecipe } from "@/app/_lib/actions";
import { formatQty } from "@/app/_lib/format-helpers";
import FormMessage from "@/app/_components/ui/FormMessage";
import SubmitButton from "@/app/_components/ui/SubmitButton";

let rowKey = 0;
const newRow = (raw_item_id = "", qty_per_unit = "") => ({ key: ++rowKey, raw_item_id, qty_per_unit: String(qty_per_unit) });

// The materials one unit of a product uses. Production pre-fills from this
// and the worker corrects it before saving the run.
export default function RecipeEditor({ products, rawItems, productId, recipe }) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveRecipe, null);
  const [rows, setRows] = useState(() =>
    recipe?.lines?.length ? recipe.lines.map((l) => newRow(l.raw_item_id, Number(l.qty_per_unit))) : [newRow()],
  );
  const [made, setMade] = useState("10");

  const rawById = useMemo(() => Object.fromEntries(rawItems.map((r) => [r.id, r])), [rawItems]);
  const product = products.find((p) => p.id === productId);

  function update(key, field, value) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  const madeN = Number(made) > 0 ? Number(made) : 0;

  return (
    <form key={productId ?? "none"} action={formAction} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="card p-5 sm:p-6">
        <div className="border-b border-border pb-4">
          <label htmlFor="recipe-product" className="form-label">Product</label>
          <select
            id="recipe-product"
            value={productId ?? ""}
            onChange={(e) => router.push(`/admin/settings?tab=recipes${e.target.value ? `&product=${e.target.value}` : ""}`)}
            className="form-select"
          >
            <option value="">Pick a product to set its recipe</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {!product ? (
          <p className="py-10 text-center text-sm text-muted">Pick a product above to see or set the materials it uses.</p>
        ) : (
          <div className="mt-5 flex flex-col gap-4">
            <input type="hidden" name="item_id" value={productId} />
            <p className="text-sm text-muted">
              Materials used to make <span className="font-semibold text-heading">1 {product.unit}</span> of {product.name}.
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Raw material</th>
                    <th scope="col">Per 1 {product.unit}</th>
                    <th scope="col"><span className="sr-only">Remove</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key}>
                      <td className="min-w-[240px]">
                        <select
                          name="raw_item_id"
                          value={r.raw_item_id}
                          onChange={(e) => update(r.key, "raw_item_id", e.target.value)}
                          aria-label="Raw material"
                          className="form-select"
                        >
                          <option value="">Pick a material</option>
                          {rawItems.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}{m.brand_name ? ` (${m.brand_name})` : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="min-w-[160px]">
                        <div className="flex items-center gap-2">
                          <input
                            name="qty_per_unit"
                            inputMode="decimal"
                            value={r.qty_per_unit}
                            onChange={(e) => update(r.key, "qty_per_unit", e.target.value)}
                            aria-label="Quantity per unit"
                            placeholder="e.g. 72"
                            className="form-input w-32"
                          />
                          <span className="text-sm text-muted">{rawById[r.raw_item_id]?.unit ?? ""}</span>
                        </div>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : [newRow()]))}
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger text-white hover:bg-[#b91c1c]"
                          aria-label="Remove this material"
                        >
                          <Trash2 size={16} aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={() => setRows((rs) => [...rs, newRow()])} className="btn-secondary self-start">
              <Plus size={17} aria-hidden /> Add material
            </button>
            <div>
              <label htmlFor="recipe-notes" className="form-label">Notes</label>
              <input id="recipe-notes" name="notes" defaultValue={recipe?.notes ?? ""} placeholder="e.g. Standard pack, 72 rolls per carton" className="form-input" />
            </div>
          </div>
        )}
      </div>

      {product ? (
        <div className="flex flex-col gap-6">
          <div className="card p-5 sm:p-6">
            <h2 className="card-title border-b border-border pb-4">Check the numbers</h2>
            <label htmlFor="recipe-made" className="form-label mt-4">If you make</label>
            <div className="flex items-center gap-2">
              <input id="recipe-made" inputMode="decimal" value={made} onChange={(e) => setMade(e.target.value)} className="form-input w-28" />
              <span className="text-sm text-muted">{product.unit}, it uses:</span>
            </div>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {rows.filter((r) => r.raw_item_id && Number(r.qty_per_unit) > 0).map((r) => (
                <li key={r.key} className="flex justify-between gap-3">
                  <span className="text-secondary">{rawById[r.raw_item_id]?.name}</span>
                  <span className="num font-semibold text-heading">
                    {formatQty(Number(r.qty_per_unit) * madeN)} {rawById[r.raw_item_id]?.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <FormMessage state={state} />
          <SubmitButton className="btn-primary h-12 w-full text-[15px]">
            <Save size={18} aria-hidden /> Save recipe
          </SubmitButton>
        </div>
      ) : null}
    </form>
  );
}
