"use client";

import { useActionState, useEffect, useRef } from "react";
import { Banknote } from "lucide-react";
import { recordCustomerPayment, recordSupplierPayment } from "@/app/_lib/actions";
import { formatMoney } from "@/app/_lib/format-helpers";
import FormMessage from "@/app/_components/ui/FormMessage";
import SubmitButton from "@/app/_components/ui/SubmitButton";

const KINDS = {
  supplier: { action: recordSupplierPayment, party: "supplier_id", doc: "purchase_id", docNo: "purchase_no", docLabel: "bill", by: "Paid by", none: "No particular bill (general payment)" },
  customer: { action: recordCustomerPayment, party: "customer_id", doc: "sale_id", docNo: "invoice_no", docLabel: "invoice", by: "Received by", none: "No particular invoice (general payment)" },
};

// Record a payment (admin): paid to a supplier, or received from a customer.
// Either fixed to one document (docId) or with an optional pick list of
// that party's open bills or invoices.
export default function PaymentForm({ kind = "supplier", supplierId, partyId, purchaseId = null, docId = null, openBills = [], today, suggested }) {
  const k = KINDS[kind];
  const party = partyId ?? supplierId;
  const fixedDoc = docId ?? purchaseId;
  const [state, formAction] = useActionState(k.action, null);
  const formRef = useRef(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name={k.party} value={party} />
      {fixedDoc ? (
        <input type="hidden" name={k.doc} value={fixedDoc} />
      ) : (
        <div>
          <label htmlFor="pay-bill" className="form-label">Against {k.docLabel} (optional)</label>
          <select id="pay-bill" name={k.doc} defaultValue="" className="form-select">
            <option value="">{k.none}</option>
            {openBills.map((b) => (
              <option key={b.id} value={b.id}>
                {b[k.docNo]}, {formatMoney(Math.max(b.total - b.paid, 0))} left
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pay-amount" className="form-label">
            Amount (Rs)<span className="ml-0.5 text-danger-ink">*</span>
          </label>
          <input
            id="pay-amount"
            name="amount"
            inputMode="decimal"
            required
            defaultValue={suggested ? String(suggested) : ""}
            placeholder="e.g. 50000"
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor="pay-date" className="form-label">Date</label>
          <input id="pay-date" name="payment_date" type="date" defaultValue={today} className="form-input" />
        </div>
        <div>
          <label htmlFor="pay-method" className="form-label">{k.by}</label>
          <select id="pay-method" name="method" defaultValue="cash" className="form-select">
            <option value="cash">Cash</option>
            <option value="bank">Bank transfer</option>
            <option value="cheque">Cheque</option>
            <option value="online">Online / IBFT</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="pay-ref" className="form-label">Cheque / transaction no.</label>
          <input id="pay-ref" name="reference" placeholder="e.g. Chq 004417" className="form-input" />
        </div>
      </div>
      <div>
        <label htmlFor="pay-note" className="form-label">Note</label>
        <input id="pay-note" name="note" placeholder="e.g. Paid by Usman at their office" className="form-input" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary h-11 w-full">
        <Banknote size={18} aria-hidden /> Save payment
      </SubmitButton>
    </form>
  );
}
