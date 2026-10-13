"use client";

import { Icon } from "@/components/common/Icon";
import { START_ENQUIRY_EVENT } from "./DotSeekAssistant";
import buttonStyles from "@/components/common/Button.module.css";

/** Opens the DotSeek Assistant and starts the guided enquiry. */
export function StartEnquiryButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={[buttonStyles.button, buttonStyles.secondary, buttonStyles.lg, className].filter(Boolean).join(" ")}
      onClick={() => window.dispatchEvent(new Event(START_ENQUIRY_EVENT))}
    >
      <Icon name="chat" className={buttonStyles.arrow} />
      <span>Start in chat</span>
    </button>
  );
}
