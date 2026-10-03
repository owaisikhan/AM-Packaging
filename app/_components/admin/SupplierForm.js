"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { saveSupplier } from "@/app/_lib/actions";
import FormMessage from "@/app/_components/ui/FormMessage";
import SubmitButton from "@/app/_components/ui/SubmitButton";

function Field({ id, label, required, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
        {required ? <span className="ml-0.5 text-danger-ink">*</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export default function SupplierForm({ supplier = null, isAdmin, afterSave }) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveSupplier, null);

  useEffect(() => {
    if (state?.ok && afterSave) router.push(afterSave.replace(":id", state.id));
  }, [state, afterSave, router]);

  return (
    <form action={formAction} className="card flex max-w-3xl flex-col gap-5 p-5 sm:p-6">
      {supplier ? <input type="hidden" name="id" value={supplier.id} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id="sup-name" label="Supplier name" required>
            <input id="sup-name" name="name" defaultValue={supplier?.name} required placeholder="e.g. Lahore Films Co" className="form-input" />
          </Field>
        </div>
        <Field id="sup-contact" label="Contact person">
          <input id="sup-contact" name="contact_person" defaultValue={supplier?.contact_person} placeholder="e.g. Tariq Mehmood" className="form-input" />
        </Field>
        <Field id="sup-phone" label="Phone">
          <input id="sup-phone" name="phone" type="tel" defaultValue={supplier?.phone} placeholder="e.g. 0300 4412233" className="form-input" />
        </Field>
        <div className="sm:col-span-2">
          <Field id="sup-address" label="Address">
            <input id="sup-address" name="address" defaultValue={supplier?.address} placeholder="e.g. Sundar Industrial Estate, Lahore" className="form-input" />
          </Field>
        </div>
        {isAdmin ? (
          <Field
            id="sup-opening"
            label="Opening balance (Rs)"
            hint="What you already owed them before using this app. Use a minus sign if they owe you."
          >
            <input id="sup-opening" name="opening_balance" inputMode="decimal" defaultValue={supplier ? Number(supplier.opening_balance) : ""} placeholder="e.g. 25000, or 0" className="form-input" />
          </Field>
        ) : null}
        {isAdmin && supplier ? (
          <Field id="sup-active" label="Status" hint="Inactive suppliers leave the pick list on new purchases.">
            <select id="sup-active" name="active" defaultValue={supplier.active ? "true" : "false"} className="form-select">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </Field>
        ) : null}
        <div className="sm:col-span-2">
          <Field id="sup-notes" label="Notes">
            <textarea id="sup-notes" name="notes" rows={3} defaultValue={supplier?.notes} placeholder="e.g. Jumbo rolls, all microns" className="form-input min-h-[90px] resize-y" />
          </Field>
        </div>
      </div>
      {!isAdmin ? (
        <p className="rounded-xl bg-background px-4 py-3 text-xs text-muted">An admin enters any money already owed to this supplier.</p>
      ) : null}
      <FormMessage state={state} />
      <SubmitButton className="btn-primary h-12 w-full text-[15px] sm:w-auto sm:self-end sm:px-8">
        <Save size={18} aria-hidden /> {supplier ? "Save changes" : "Save supplier"}
      </SubmitButton>
    </form>
  );
}
