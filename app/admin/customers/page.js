import { requirePageRole } from "@/app/_lib/helpers";
import ComingSoon from "@/app/_components/admin/ComingSoon";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  await requirePageRole();
  return (
    <ComingSoon
      title="Customers"
      subtitle="Who you sell to, and what they owe you."
      phase={4}
      points={["Customer list with opening balance.", "Ledger per customer: invoices, payments received and balance (udhaar).", "Record a payment received."]}
    />
  );
}
