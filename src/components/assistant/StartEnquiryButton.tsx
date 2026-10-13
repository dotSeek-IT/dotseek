"use client";

import { Button } from "@/components/common/Button";
import { START_ENQUIRY_EVENT } from "./DotSeekAssistant";

/** Opens the DotSeek Assistant and starts the guided enquiry. */
export function StartEnquiryButton({
  variant = "primary",
  className,
}: {
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Button
      variant={variant}
      size="lg"
      className={className}
      onClick={() => window.dispatchEvent(new Event(START_ENQUIRY_EVENT))}
    >
      Start in chat
    </Button>
  );
}
