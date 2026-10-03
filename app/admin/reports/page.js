import { requirePageRole, ROLES } from "@/app/_lib/helpers";
import ComingSoon from "@/app/_components/admin/ComingSoon";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requirePageRole(ROLES.ADMIN);
  return (
    <ComingSoon
      title="Reports"
      subtitle="Charts and tables for sales, purchases, production, stock, balances and profit."
      phase={5}
      points={[
        "Sales and purchases by month, customer and supplier.",
        "Production per product, and raw material use with recipe vs actual.",
        "Receivables and payables with ageing, and gross profit by month.",
      ]}
    />
  );
}
