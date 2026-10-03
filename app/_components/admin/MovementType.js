import Badge from "@/app/_components/ui/Badge";

const MAP = {
  opening: { tone: "gray", label: "Opening stock" },
  purchase: { tone: "info", label: "Purchase" },
  production_in: { tone: "success", label: "Produced" },
  production_use: { tone: "warning", label: "Used in production" },
  sale: { tone: "danger", label: "Sale" },
  adjustment: { tone: "gray", label: "Adjustment" },
};

export default function MovementType({ type }) {
  const m = MAP[type] ?? { tone: "gray", label: type };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
