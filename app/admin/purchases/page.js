import { requirePageRole } from "@/app/_lib/helpers";
import ComingSoon from "@/app/_components/admin/ComingSoon";

export const metadata = { title: "Purchases" };

export default async function PurchasesPage() {
  await requirePageRole();
  return (
    <ComingSoon
      title="Purchases"
      subtitle="Raw material bought from suppliers."
      phase={2}
      points={[
        "New purchase with line items, discount, GST and the amount paid.",
        "Raw stock goes up when the purchase is saved.",
        "Admins can void a purchase with a reason; the stock comes back out.",
      ]}
    />
  );
}
