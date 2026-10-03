import { Ban, CircleCheck, TriangleAlert } from "lucide-react";
import Badge from "@/app/_components/ui/Badge";

// Status of a production run, with a second pill when more material was
// used than the recipe says.
export default function RunStatus({ status, overRecipe = 0 }) {
  if (status === "void") {
    return (
      <Badge tone="gray">
        <Ban size={13} strokeWidth={2.2} aria-hidden /> Void
      </Badge>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge tone="success">
        <CircleCheck size={13} strokeWidth={2.2} aria-hidden /> Recorded
      </Badge>
      {overRecipe > 0 ? (
        <Badge tone="warning">
          <TriangleAlert size={13} strokeWidth={2.2} aria-hidden /> Over recipe
        </Badge>
      ) : null}
    </span>
  );
}
