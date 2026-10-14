"use client";

import { Button } from "@/components/common/Button";
import type { SolutionId } from "@/content/solutions";
import { START_ENQUIRY_EVENT, type StartEnquiryDetail } from "./DotSeekAssistant";

type StartEnquiryButtonProps = {
  /** Pre-route to a solution, "consult" to describe a problem, "reference" to start from a reference site, or omit to ask. */
  solution?: SolutionId | "consult" | "reference";
  children?: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
};

/** Opens the DotSeek Assistant and starts the (tailored) guided enquiry. */
export function StartEnquiryButton({
  solution,
  children = "Start in chat",
  variant = "primary",
  size = "lg",
  className,
}: StartEnquiryButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() =>
        window.dispatchEvent(new CustomEvent<StartEnquiryDetail>(START_ENQUIRY_EVENT, { detail: { solution } }))
      }
    >
      {children}
    </Button>
  );
}
