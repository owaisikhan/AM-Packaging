import { requirePageRole } from "@/app/_lib/helpers";
import ComingSoon from "@/app/_components/admin/ComingSoon";

export const metadata = { title: "Sales & Invoices" };

export default async function SalesPage() {
  await requirePageRole();
  return (
    <ComingSoon
      title="Sales & Invoices"
      subtitle="Sales to customers and printable invoices."
      phase={4}
      points={[
        "New sale with line items, discount, GST and the amount received.",
        "Printable invoice with the company details from Settings.",
        "Finished stock goes down when the sale is saved; a sale larger than the stock is refused.",
      ]}
    />
  );
}
