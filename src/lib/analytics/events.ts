/**
 * Journey steps recorded on an anonymous analytics session (see lib/analytics/store.ts).
 * The browser reports the chat steps; the server records "quote_sent" when an enquiry
 * is saved, and "accepted" comes from the quote outcome the team sets on the enquiry.
 */
export const CLIENT_EVENTS = [
  "chat_opened",
  "chat_started",
  "service_selected",
  "budget_selected",
  "quote_generated",
  "quote_viewed",
  "quote_requested",
] as const;
export type ClientEvent = (typeof CLIENT_EVENTS)[number];
export type JourneyEvent = ClientEvent | "quote_sent";
