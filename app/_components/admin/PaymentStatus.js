import { CircleCheck, CircleDashed, CircleAlert, Ban } from "lucide-react";
import Badge from "@/app/_components/ui/Badge";

const MAP = {
  paid: { tone: "success", label: "Paid", Icon: CircleCheck },
  partly: { tone: "warning", label: "Partly paid", Icon: CircleDashed },
  unpaid: { tone: "danger", label: "Unpaid", Icon: CircleAlert },
  void: { tone: "gray", label: "Void", Icon: Ban },
  recorded: { tone: "info", label: "Recorded", Icon: CircleCheck },
};

// Payment state of a bill. Workers do not see payments, so they get
// "Recorded" (or "Void") instead of a paid/unpaid state they cannot check.
export default function PaymentStatus({ status }) {
  const s = MAP[status] ?? MAP.recorded;
  return (
    <Badge tone={s.tone}>
      <s.Icon size={13} strokeWidth={2.2} aria-hidden />
      {s.label}
    </Badge>
  );
}
