"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save } from "lucide-react";
import { saveItem, quickAddUnit } from "@/app/_lib/actions";
import FormMessage from "@/app/_components/ui/FormMessage";
import SubmitButton from "@/app/_components/ui/SubmitButton";
import Spinner from "@/app/_components/ui/Spinner";

function Field({ label, htmlFor, required, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="form-label">
        {label}
        {required ? <span className="ml-0.5 text-danger-ink">*</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

// Add or edit a raw material or a product. Which fields show depends on the
// kind: products get size, micron, colour and rolls per carton up front.
export default function ItemForm({ kind, item, lookups, listHref }) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveItem, null);
  const [units, setUnits] = useState(lookups.units);
  const [unitId, setUnitId] = useState(item?.unit_id ?? "");
  const [adding, setAdding] = useState(false);
  const [unitMsg, setUnitMsg] = useState(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state?.ok && !item) router.push(listHref);
  }, [state, item, router, listHref]);

  const categories = lookups.categories.filter((c) => c.kind === kind && (c.active || c.id === item?.category_id));
  const isProduct = kind === "finished";

  function addUnit(form) {
    const name = form.querySelector("#new-unit-name").value;
    const short = form.querySelector("#new-unit-short").value;
    startTransition(async () => {
      const res = await quickAddUnit(name, short);
      setUnitMsg(res);
      if (res.ok) {
        setUnits((u) => [...u, res.unit].sort((a, b) => a.name.localeCompare(b.name)));
        setUnitId(res.unit.id);
        setAdding(false);
      }
    });
  }

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <input type="hidden" name="kind" value={kind} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      <div className="card p-5 sm:p-6">
        <h2 className="card-title border-b border-border pb-4">{isProduct ? "Product details" : "Raw material details"}</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Name" htmlFor="name" required hint={isProduct ? "As it should appear on invoices." : null}>
              <input
                id="name"
                name="name"
                defaultValue={item?.name}
                required
                placeholder={isProduct ? "e.g. Tape 46mm x 72yd 40 mic Clear" : "e.g. Jumbo Roll 40 micron Clear"}
                className="form-input"
              />
            </Field>
          </div>

          <Field label="Category" htmlFor="category_id" required hint="Add categories in Settings.">
            <select id="category_id" name="category_id" defaultValue={item?.category_id ?? ""} required className="form-select">
              <option value="">Pick a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Code" htmlFor="code" hint="Optional short code, unique per item.">
            <input id="code" name="code" defaultValue={item?.code ?? ""} placeholder="e.g. T46-72-40C" className="form-input" />
          </Field>

          <Field label="Counted in (unit)" htmlFor="unit_id" required>
            <div className="flex gap-2">
              <select id="unit_id" name="unit_id" value={unitId} onChange={(e) => setUnitId(e.target.value)} required className="form-select">
                <option value="">Pick a unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.short_name})
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => setAdding((a) => !a)} className="btn-secondary shrink-0 px-3" aria-label="Add a new unit" title="Add a new unit">
                <Plus size={18} aria-hidden />
              </button>
            </div>
          </Field>

          <Field label="Brand" htmlFor="brand_id">
            <select id="brand_id" name="brand_id" defaultValue={item?.brand_id ?? ""} className="form-select">
              <option value="">No brand</option>
              {lookups.brands.filter((b) => b.active || b.id === item?.brand_id).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>

          {adding ? (
            <div className="rounded-xl border border-border bg-background p-4 sm:col-span-2">
              <p className="mb-3 text-sm font-semibold text-heading">New unit</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
                <input id="new-unit-name" placeholder="e.g. Kilogram" aria-label="Unit name" className="form-input" />
                <input id="new-unit-short" placeholder="e.g. kg" aria-label="Short form" className="form-input" />
                <button
                  type="button"
                  disabled={pending}
                  onClick={(e) => addUnit(e.currentTarget.closest("div.rounded-xl"))}
                  className="btn-primary"
                >
                  {pending ? <Spinner /> : <Plus size={17} aria-hidden />} Add unit
                </button>
              </div>
            </div>
          ) : null}
          {unitMsg && !unitMsg.ok ? (
            <div className="sm:col-span-2">
              <FormMessage state={unitMsg} />
            </div>
          ) : null}

          <Field label="Size" htmlFor="size_id" hint={isProduct ? null : "Leave empty if size does not apply."}>
            <select id="size_id" name="size_id" defaultValue={item?.size_id ?? ""} className="form-select">
              <option value="">No size</option>
              {lookups.sizes.filter((s) => s.active || s.id === item?.size_id).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Micron" htmlFor="micron_id">
            <select id="micron_id" name="micron_id" defaultValue={item?.micron_id ?? ""} className="form-select">
              <option value="">No micron</option>
              {lookups.microns.filter((m) => m.active || m.id === item?.micron_id).map((m) => (
                <option key={m.id} value={m.id}>
                  {Number(m.value)} micron
                </option>
              ))}
            </select>
          </Field>

          <Field label="Color / type" htmlFor="color_id">
            <select id="color_id" name="color_id" defaultValue={item?.color_id ?? ""} className="form-select">
              <option value="">None</option>
              {lookups.colors.filter((c) => c.active || c.id === item?.color_id).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          {isProduct ? (
            <Field label="Rolls per carton" htmlFor="rolls_per_carton" hint="For tape cartons. Leave empty for other products.">
              <input id="rolls_per_carton" name="rolls_per_carton" inputMode="numeric" defaultValue={item?.rolls_per_carton ?? ""} placeholder="e.g. 72" className="form-input" />
            </Field>
          ) : null}

          <div className="sm:col-span-2">
            <Field label="Notes" htmlFor="notes">
              <textarea id="notes" name="notes" rows={3} defaultValue={item?.notes ?? ""} className="form-input min-h-[96px] resize-y" />
            </Field>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="card p-5 sm:p-6">
          <h2 className="card-title border-b border-border pb-4">Stock & pricing</h2>
          <div className="mt-5 flex flex-col gap-5">
            <Field label="Low-stock level" htmlFor="low_stock_level" hint="The item shows as Low Stock at or below this quantity.">
              <input id="low_stock_level" name="low_stock_level" inputMode="decimal" defaultValue={item?.low_stock_level ?? ""} placeholder="e.g. 50" className="form-input" />
            </Field>
            <Field
              label={isProduct ? "Default sale rate (Rs)" : "Default purchase rate (Rs)"}
              htmlFor="default_rate"
              hint="Filled in on new bills; can be changed per bill."
            >
              <input id="default_rate" name="default_rate" inputMode="decimal" defaultValue={item?.default_rate ?? ""} placeholder="e.g. 4800" className="form-input" />
            </Field>
            {!item ? (
              <p className="rounded-xl bg-background px-4 py-3 text-xs text-muted">
                Stock starts at zero. Enter today&apos;s count as opening stock on the Stock page after saving.
              </p>
            ) : null}
          </div>
        </div>
        <FormMessage state={state} />
        <SubmitButton className="btn-primary h-12 w-full text-[15px]">
          <Save size={18} aria-hidden /> {item ? "Save changes" : isProduct ? "Save product" : "Save raw material"}
        </SubmitButton>
      </div>
    </form>
  );
}
