"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { saveSettings } from "@/app/_lib/actions";
import FormMessage from "@/app/_components/ui/FormMessage";
import SubmitButton from "@/app/_components/ui/SubmitButton";

function Field({ label, name, defaultValue, placeholder, hint, required, wide, type = "text" }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label htmlFor={`set-${name}`} className="form-label">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </label>
      <input id={`set-${name}`} name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} required={required} className="form-input" />
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

// Company details and invoice options. The printed invoice reads all of these.
export default function CompanySettingsForm({ settings }) {
  const [state, formAction] = useActionState(saveSettings, null);
  const s = settings ?? {};

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-2">
      <div className="card p-5 sm:p-6">
        <h2 className="card-title border-b border-border pb-4">Company</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Company name" name="company_name" defaultValue={s.company_name} required wide />
          <Field label="Short name" name="short_name" defaultValue={s.short_name} placeholder="e.g. AM Packaging" />
          <Field label="Tagline" name="tagline" defaultValue={s.tagline} />
          <Field label="Address" name="address" defaultValue={s.address} wide />
          <Field label="Phone" name="phone" defaultValue={s.phone} placeholder="e.g. 0300 1234567" />
          <Field label="Email" name="email" type="email" defaultValue={s.email} placeholder="e.g. sales@ampackaging.pk" />
          <Field label="NTN" name="ntn" defaultValue={s.ntn} placeholder="National Tax Number" />
          <Field label="STRN" name="strn" defaultValue={s.strn} placeholder="Sales Tax Registration Number" />
          <Field label="Logo address (URL)" name="logo_url" defaultValue={s.logo_url} placeholder="Leave empty to use the AM tile" hint="A link to the logo image, shown on invoices." wide />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="card p-5 sm:p-6">
          <h2 className="card-title border-b border-border pb-4">Invoices & numbering</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-border px-4 sm:col-span-2">
              <input type="checkbox" name="gst_enabled" defaultChecked={s.gst_enabled} className="h-5 w-5 accent-[var(--color-primary)]" />
              <span className="text-sm font-medium text-heading">Add GST to new invoices by default</span>
            </label>
            <Field label="GST rate (%)" name="gst_rate" defaultValue={s.gst_rate ?? 18} required />
            <Field label="Invoice number prefix" name="invoice_prefix" defaultValue={s.invoice_prefix} placeholder="e.g. INV-" hint="Next invoice reads like INV-00001." />
            <Field label="Purchase number prefix" name="purchase_prefix" defaultValue={s.purchase_prefix} placeholder="e.g. PUR-" />
            <Field label="Production run prefix" name="production_prefix" defaultValue={s.production_prefix} placeholder="e.g. PRD-" />
            <div className="sm:col-span-2">
              <label htmlFor="set-invoice_terms" className="form-label">Payment terms (printed on invoices)</label>
              <textarea id="set-invoice_terms" name="invoice_terms" rows={3} defaultValue={s.invoice_terms} placeholder="e.g. Payment due within 30 days. Bank: ..." className="form-input min-h-[90px] resize-y" />
            </div>
            <Field label="Invoice footer" name="invoice_footer" defaultValue={s.invoice_footer} wide />
          </div>
        </div>
        <FormMessage state={state} />
        <SubmitButton className="btn-primary h-12 w-full text-[15px]">
          <Save size={18} aria-hidden /> Save settings
        </SubmitButton>
      </div>
    </form>
  );
}
