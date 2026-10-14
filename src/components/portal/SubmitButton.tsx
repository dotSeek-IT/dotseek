"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/common/Button";

/** Form submit button (standard primary Button) with a pending state. */
export function SubmitButton({ children, pendingText }: { children: React.ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} arrow={!pending}>
      {pending ? pendingText : children}
    </Button>
  );
}
