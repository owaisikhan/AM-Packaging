import { CircleCheck, TriangleAlert, CircleX } from "lucide-react";
import Badge from "@/app/_components/ui/Badge";

const MAP = {
  in: { tone: "success", label: "In Stock", Icon: CircleCheck },
  low: { tone: "warning", label: "Low Stock", Icon: TriangleAlert },
  out: { tone: "danger", label: "Out of Stock", Icon: CircleX },
};

export default function StockStatus({ status }) {
  const s = MAP[status] ?? MAP.in;
  return (
    <Badge tone={s.tone}>
      <s.Icon size={13} strokeWidth={2.2} aria-hidden />
      {s.label}
    </Badge>
  );
}
