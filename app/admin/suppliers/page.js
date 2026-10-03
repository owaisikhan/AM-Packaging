import { requirePageRole } from "@/app/_lib/helpers";
import ComingSoon from "@/app/_components/admin/ComingSoon";

export const metadata = { title: "Suppliers" };

export default async function SuppliersPage() {
  await requirePageRole();
  return (
    <ComingSoon
      title="Suppliers"
      subtitle="Who you buy from, and what you owe them."
      phase={2}
      points={["Supplier list with opening balance.", "Ledger per supplier: purchases, payments made and balance.", "Record a payment to a supplier."]}
    />
  );
}
