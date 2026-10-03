"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { saveCustomer } from "@/app/_lib/actions";
import FormMessage from "@/app/_components/ui/FormMessage";
import SubmitButton from "@/app/_components/ui/SubmitButton";

function Field({ id, label, required, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export default function CustomerForm({ customer = null, isAdmin, afterSave }) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveCustomer, null);

  useEffect(() => {
    if (state?.ok && afterSave) router.push(afterSave.replace(":id", state.id));
  }, [state, afterSave, router]);

  return (
    <form action={formAction} className="card flex max-w-3xl flex-col gap-5 p-5 sm:p-6">
      {customer ? <input type="hidden" name="id" value={customer.id} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id="cus-name" label="Customer name" required>
            <input id="cus-name" name="name" defaultValue={customer?.name} required placeholder="e.g. Faisalabad Traders" className="form-input" />
          </Field>
        </div>
        <Field id="cus-contact" label="Contact person">
          <input id="cus-contact" name="contact_person" defaultValue={customer?.contact_person} placeholder="e.g. Haji Aslam" className="form-input" />
        </Field>
        <Field id="cus-phone" label="Phone">
          <input id="cus-phone" name="phone" type="tel" defaultValue={customer?.phone} placeholder="e.g. 0321 6654321" className="form-input" />
        </Field>
        <div className="sm:col-span-2">
          <Field id="cus-address" label="Address">
            <input id="cus-address" name="address" defaultValue={customer?.address} placeholder="e.g. Kotwali Road, Faisalabad" className="form-input" />
          </Field>
        </div>
        <Field id="cus-ntn" label="NTN / STRN" hint="Printed on the invoice if given.">
          <input id="cus-ntn" name="ntn" defaultValue={customer?.ntn} placeholder="e.g. 1234567-8" className="form-input" />
        </Field>
        {isAdmin ? (
          <Field
            id="cus-opening"
            label="Opening balance (Rs)"
            hint="What they already owed you before using this app. Use a minus sign if you owe them (advance)."
          >
            <input id="cus-opening" name="opening_balance" inputMode="decimal" defaultValue={customer ? Number(customer.opening_balance) : ""} placeholder="e.g. 25000, or 0" className="form-input" />
          </Field>
        ) : null}
        {isAdmin && customer ? (
          <Field id="cus-active" label="Status" hint="Inactive customers leave the pick list on new invoices.">
            <select id="cus-active" name="active" defaultValue={customer.active ? "true" : "false"} className="form-select">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </Field>
        ) : null}
        <div className="sm:col-span-2">
          <Field id="cus-notes" label="Notes">
            <textarea id="cus-notes" name="notes" rows={3} defaultValue={customer?.notes} placeholder="e.g. Takes 48mm brown tape monthly" className="form-input min-h-[90px] resize-y" />
          </Field>
        </div>
      </div>
      {!isAdmin ? (
        <p className="rounded-xl bg-background px-4 py-3 text-xs text-muted">An admin enters any money this customer already owed.</p>
      ) : null}
      <FormMessage state={state} />
      <SubmitButton className="btn-primary h-12 w-full text-[15px] sm:w-auto sm:self-end sm:px-8">
        <Save size={18} aria-hidden /> {customer ? "Save changes" : "Save customer"}
      </SubmitButton>
    </form>
  );
}
