"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/common/Button";

/** Form submit button (standard Button) with a pending state. */
export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  size = "md",
  className,
}: {
  children: React.ReactNode;
  pendingText: string;
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending} arrow={variant === "primary" && !pending} className={className}>
      {pending ? pendingText : children}
    </Button>
  );
}
