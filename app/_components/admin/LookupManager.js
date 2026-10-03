"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteLookup, saveLookup } from "@/app/_lib/actions";
import FormMessage from "@/app/_components/ui/FormMessage";
import SubmitButton from "@/app/_components/ui/SubmitButton";

// One editable list from Settings (brands, sizes, microns, colors, units,
// categories). fields: [{ name, label, type: "text" | "number" | "kind", placeholder }]
function EditRow({ table, fields, row, onDone }) {
  const [state, formAction] = useActionState(saveLookup, null);
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <tr>
      <td colSpan={fields.length + 1}>
        <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <input type="hidden" name="table" value={table} />
          <input type="hidden" name="id" value={row.id} />
          {fields.map((f) => (
            <FieldInput key={f.name} field={f} defaultValue={row[f.name]} />
          ))}
          <div className="flex gap-2">
            <SubmitButton className="btn-primary" pendingLabel="Saving...">
              <Check size={17} aria-hidden /> Save
            </SubmitButton>
            <button type="button" onClick={onDone} className="btn-secondary" aria-label="Cancel">
              <X size={17} aria-hidden />
            </button>
          </div>
        </form>
        <div className="mt-2">
          <FormMessage state={state?.ok ? null : state} />
        </div>
      </td>
    </tr>
  );
}

function FieldInput({ field, defaultValue }) {
  if (field.type === "kind") {
    return (
      <select name={field.name} defaultValue={defaultValue ?? "raw"} aria-label={field.label} className="form-select sm:w-48">
        <option value="raw">Raw material</option>
        <option value="finished">Product</option>
      </select>
    );
  }
  return (
    <input
      name={field.name}
      defaultValue={defaultValue === null || defaultValue === undefined ? "" : String(Number.isFinite(Number(defaultValue)) && field.type === "number" ? Number(defaultValue) : defaultValue)}
      inputMode={field.type === "number" ? "decimal" : undefined}
      placeholder={field.placeholder}
      aria-label={field.label}
      required
      className="form-input sm:flex-1"
    />
  );
}

function DeleteButton({ table, id, label }) {
  const [state, formAction] = useActionState(deleteLookup, null);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(`Delete ${label}? This cannot be undone.`)) e.preventDefault();
      }}
      className="inline"
    >
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn-ghost text-danger-ink hover:bg-[#fee2e2] hover:text-[#dc2626]" aria-label={`Delete ${label}`} title="Delete">
        <Trash2 size={16} aria-hidden />
      </button>
      {state && !state.ok ? <span className="mt-1 block max-w-xs text-left text-xs text-danger-ink">{state.message}</span> : null}
    </form>
  );
}

const fmtNum = (v) => new Intl.NumberFormat("en-PK", { maximumFractionDigits: 2 }).format(Number(v));

// Per-list setup. Kept here (not passed from the page) because the column
// renderers are functions, which cannot cross from a server component.
const CONFIG = {
  item_categories: {
    title: "Categories",
    singular: "category",
    hint: "Groups for raw materials and products. Add a new product type here, for example Packing Twine.",
    fields: [
      { name: "name", label: "Name", placeholder: "e.g. Packing Twine" },
      { name: "kind", label: "Used for", type: "kind" },
    ],
    display: [
      { label: "Name", render: (r) => r.name, className: "font-semibold text-heading" },
      { label: "Used for", render: (r) => (r.kind === "raw" ? "Raw materials" : "Products"), className: "text-sm text-secondary" },
    ],
  },
  brands: {
    title: "Brands",
    singular: "brand",
    hint: "Brands of paper tubes, cartons and other materials.",
    fields: [{ name: "name", label: "Brand name", placeholder: "e.g. Star Tubes" }],
    display: [{ label: "Brand", render: (r) => r.name, className: "font-semibold text-heading" }],
  },
  sizes: {
    title: "Sizes",
    singular: "size",
    hint: "Tape sizes as width in mm and length in yards.",
    fields: [
      { name: "width_mm", label: "Width (mm)", type: "number", placeholder: "e.g. 48" },
      { name: "length_yd", label: "Length (yards)", type: "number", placeholder: "e.g. 72" },
    ],
    display: [
      { label: "Size", render: (r) => r.label, className: "font-semibold text-heading num" },
      { label: "Width", render: (r) => `${fmtNum(r.width_mm)} mm`, className: "num text-sm text-secondary" },
      { label: "Length", render: (r) => `${fmtNum(r.length_yd)} yd`, className: "num text-sm text-secondary" },
    ],
  },
  microns: {
    title: "Microns",
    singular: "micron",
    hint: "Film thickness options for jumbo rolls and tape.",
    fields: [{ name: "value", label: "Micron", type: "number", placeholder: "e.g. 40" }],
    display: [{ label: "Micron", render: (r) => `${fmtNum(r.value)} micron`, className: "font-semibold text-heading num" }],
  },
  colors: {
    title: "Colors / Types",
    singular: "color / type",
    hint: "Clear, brown, printed and so on.",
    fields: [{ name: "name", label: "Name", placeholder: "e.g. Clear" }],
    display: [{ label: "Color / type", render: (r) => r.name, className: "font-semibold text-heading" }],
  },
  units: {
    title: "Units",
    singular: "unit",
    hint: "What items are counted in. The short form shows next to every quantity.",
    fields: [
      { name: "name", label: "Unit name", placeholder: "e.g. Kilogram" },
      { name: "short_name", label: "Short form", placeholder: "e.g. kg" },
    ],
    display: [
      { label: "Unit", render: (r) => r.name, className: "font-semibold text-heading" },
      { label: "Short form", render: (r) => r.short_name, className: "text-sm text-secondary" },
    ],
  },
};

export default function LookupManager({ table, rows }) {
  const { title, singular, hint, fields, display } = CONFIG[table];
  const [editing, setEditing] = useState(null);
  const [state, formAction] = useActionState(saveLookup, null);
  const formRef = useRef(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="card-title">{title}</h2>
          {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">Nothing here yet. Add the first one on the right.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {display.map((d) => (
                    <th key={d.label} scope="col">{d.label}</th>
                  ))}
                  <th scope="col" className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) =>
                  editing === row.id ? (
                    <EditRow key={row.id} table={table} fields={fields} row={row} onDone={() => setEditing(null)} />
                  ) : (
                    <tr key={row.id}>
                      {display.map((d) => (
                        <td key={d.label} className={d.className}>{d.render(row)}</td>
                      ))}
                      <td className="whitespace-nowrap text-right">
                        <button type="button" onClick={() => setEditing(row.id)} className="btn-ghost" aria-label={`Edit ${display[0].render(row)}`} title="Edit">
                          <Pencil size={16} aria-hidden />
                        </button>
                        <DeleteButton table={table} id={row.id} label={String(display[0].render(row))} />
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form ref={formRef} action={formAction} className="card flex flex-col gap-4 self-start p-5 sm:p-6">
        <h3 className="card-title border-b border-border pb-4">Add a {singular}</h3>
        <input type="hidden" name="table" value={table} />
        {fields.map((f) => (
          <div key={f.name}>
            <label className="form-label" htmlFor={`new-${table}-${f.name}`}>{f.label}</label>
            {f.type === "kind" ? (
              <select id={`new-${table}-${f.name}`} name={f.name} defaultValue="raw" className="form-select">
                <option value="raw">Raw material</option>
                <option value="finished">Product</option>
              </select>
            ) : (
              <input
                id={`new-${table}-${f.name}`}
                name={f.name}
                inputMode={f.type === "number" ? "decimal" : undefined}
                placeholder={f.placeholder}
                required
                className="form-input"
              />
            )}
          </div>
        ))}
        <FormMessage state={state} />
        <SubmitButton className="btn-primary h-11 w-full" pendingLabel="Adding...">
          <Plus size={18} aria-hidden /> Add
        </SubmitButton>
      </form>
    </div>
  );
}
