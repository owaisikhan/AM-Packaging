"use client";

import { useEffect, useRef } from "react";
import { X, FileSearch } from "lucide-react";

function show(value) {
  if (value === null || value === undefined || value === "") return "(empty)";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function humanKey(key) {
  return key.replace(/_/g, " ").replace(/\bid\b/, "ID");
}

// Turns the stored changes into rows of field / before / after.
function toRows(changes) {
  if (!changes) return [];
  if (changes.before !== undefined || changes.after !== undefined) {
    const before = changes.before ?? {};
    const after = changes.after ?? {};
    if (Array.isArray(before) || Array.isArray(after)) {
      return [{ field: "materials", from: before, to: after }];
    }
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
      (k) => !["id", "created_at", "updated_at", "created_by"].includes(k),
    );
    return keys.map((k) => ({ field: k, from: before[k], to: after[k] }));
  }
  return Object.entries(changes).map(([k, v]) => ({ field: k, from: v?.from, to: v?.to }));
}

export default function ChangesDialog({ entry, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (entry && dialog && !dialog.open) dialog.showModal();
  }, [entry]);

  if (!entry) return null;
  const rows = toRows(entry.changes);
  const isCreate = entry.changes?.after !== undefined && entry.changes?.before === undefined;
  const isDelete = entry.changes?.before !== undefined && entry.changes?.after === undefined;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      className="m-auto w-[min(720px,calc(100vw-24px))] rounded-[20px] border border-border bg-surface p-0 text-text shadow-lg backdrop:bg-black/50"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-ink">
            <FileSearch size={19} aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-bold text-heading">What changed</h2>
            <p className="mt-0.5 text-sm text-muted">{entry.summary}</p>
          </div>
        </div>
        <button type="button" onClick={() => ref.current?.close()} className="btn-ghost" aria-label="Close">
          <X size={18} aria-hidden />
        </button>
      </div>
      <div className="max-h-[60vh] overflow-auto px-6 py-5">
        {rows.length === 0 ? (
          <p className="text-sm text-muted">No field details were recorded for this entry.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Field</th>
                {isCreate ? null : <th scope="col">Before</th>}
                {isDelete ? null : <th scope="col">After</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.field}>
                  <td className="whitespace-nowrap font-medium capitalize text-heading">{humanKey(r.field)}</td>
                  {isCreate ? null : <td className="break-all text-sm text-danger-ink">{show(r.from)}</td>}
                  {isDelete ? null : <td className="break-all text-sm font-medium text-primary-ink">{show(r.to)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex justify-end border-t border-border px-6 py-4">
        <button type="button" onClick={() => ref.current?.close()} className="btn-secondary">
          Close
        </button>
      </div>
    </dialog>
  );
}
