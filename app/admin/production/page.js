import { requirePageRole } from "@/app/_lib/helpers";
import ComingSoon from "@/app/_components/admin/ComingSoon";

export const metadata = { title: "Production" };

export default async function ProductionPage() {
  await requirePageRole();
  return (
    <ComingSoon
      title="Production"
      subtitle="Record each manufacturing run: what was made and the raw materials used."
      phase={3}
      points={[
        "Pick the product and how many were made; materials fill in from its recipe and can be corrected.",
        "Saving adds the finished stock and takes the raw materials out in one step.",
        "Recipe vs actual use is kept for the wastage report.",
      ]}
    />
  );
}
