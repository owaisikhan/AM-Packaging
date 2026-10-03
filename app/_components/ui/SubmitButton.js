"use client";

import { useFormStatus } from "react-dom";
import Spinner from "./Spinner";

// Submit button that disables itself and says what it is doing while the
// action runs, so nothing is saved twice.
export default function SubmitButton({ children, pendingLabel = "Saving...", className = "btn-primary", ...rest }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} {...rest}>
      {pending ? (
        <>
          <Spinner /> {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
