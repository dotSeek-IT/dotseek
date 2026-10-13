"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  assistantMeta,
  fallback,
  intentLabels,
  intents,
  type AssistantLink,
  type Intent,
} from "@/content/assistant";
import { enquiryCopy, enquiryIntro, enquiryLabels, enquirySteps, type EnquiryAnswers } from "@/content/enquiry";
import { site } from "@/content/site";
import { Icon } from "@/components/common/Icon";
import { EnquiryControls, type EnquiryPhase } from "./EnquiryControls";
import styles from "./DotSeekAssistant.module.css";

/** Dispatch this window event (e.g. from a page button) to open the chat enquiry. */
export const START_ENQUIRY_EVENT = "dotseek:start-enquiry";

type EnquiryState = { step: number; answers: EnquiryAnswers; phase: EnquiryPhase; error?: string };

function enquirySummary(answers: EnquiryAnswers): string {
  return (Object.keys(enquiryLabels) as (keyof typeof enquiryLabels)[])
    .filter((key) => answers[key])
    .map((key) => `- ${enquiryLabels[key]}: ${answers[key]}`)
    .join("\n");
}

type Message = {
  id: number;
  from: "bot" | "user";
  text: string;
  links?: AssistantLink[];
  /** True while the reply is still streaming in. */
  streaming?: boolean;
  /** Enquiry-flow messages are never sent to the AI. */
  kind?: "enquiry";
};

/** Marker the API sends when a partially streamed reply must be replaced. */
const REPLACE_MARKER = "\u0000";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Offline fallback: scores intents by keyword hits and returns the best match. */
function matchIntent(input: string): Intent {
  const text = ` ${input.toLowerCase().replace(/[^a-z0-9£&+\s]/g, " ").replace(/\s+/g, " ")} `;
  let best: Intent = fallback;
  let bestScore = 0;
  for (const intent of intents) {
    let score = 0;
    for (const keyword of intent.keywords) {
      if (new RegExp(`\\b${escape(keyword)}\\b`).test(text)) score += keyword.includes(" ") ? 2 : 1;
    }
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }
  return best;
}

/** Turns site paths (/contact, /#agents), emails and phone numbers into links. */
const LINK_PATTERN = /(\/(?:#[a-z-]+|[a-z-]+(?:#[a-z-]+)?)(?=[\s.,;:!?)]|$)|[\w.+-]+@[\w-]+\.[\w.]+|\+44[\d ]{10,14}\d)/gi;

function linkify(text: string, onNavigate: () => void): ReactNode[] {
  return text.split(LINK_PATTERN).map((part, i) => {
    if (i % 2 === 0) return part;
    if (part.startsWith("/")) {
      return (
        <Link key={i} href={part} onClick={onNavigate}>
          {part}
        </Link>
      );
    }
    const href = part.includes("@") ? `mailto:${part}` : `tel:${part.replace(/\s/g, "")}`;
    return (
      <a key={i} href={href}>
        {part}
      </a>
    );
  });
}

/** Renders plain-text replies: blank lines split paragraphs, "- " lines become bullets. */
function RichText({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((block, b) => {
      const lines = block.split("\n");
      if (lines.every((line) => /^\s*[-•]\s+/.test(line))) {
        return (
          <ul key={b}>
            {lines.map((line, l) => (
              <li key={l}>{linkify(line.replace(/^\s*[-•]\s+/, ""), onNavigate)}</li>
            ))}
          </ul>
        );
      }
      return (
        <p key={b}>
          {lines.map((line, l) => (
            <Fragment key={l}>
              {l > 0 && <br />}
              {linkify(line, onNavigate)}
            </Fragment>
          ))}
        </p>
      );
    });
}

const byId = (id: string) => intents.find((intent) => intent.id === id);

/**
 * DotSeek Assistant: floating chat answered by Claude through /api/assistant
 * (streamed). If the API is unavailable it falls back to the built-in
 * keyword answers in content/assistant.ts. Non-modal dialog; Esc closes and
 * focus returns to the launcher.
 */
export function DotSeekAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: 0, from: "bot", text: assistantMeta.greeting.join("\n\n") },
  ]);
  const [suggestions, setSuggestions] = useState<string[]>(assistantMeta.starters);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [seen, setSeen] = useState(false);
  /** Switches to built-in answers when the AI endpoint isn't available. */
  const [offline, setOffline] = useState(false);
  const [enquiry, setEnquiry] = useState<EnquiryState | null>(null);
  const nextId = useRef(1);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const panelId = useId();

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    setSeen(true);
    // On touch devices don't auto-open the keyboard; it resizes the viewport.
    if (!window.matchMedia("(pointer: coarse)").matches) inputRef.current?.focus({ preventScroll: true });

    // The mobile bottom sheet covers the page: stop the page scrolling behind it.
    const sheet = window.matchMedia("(max-width: 559px)").matches;
    const root = document.documentElement;
    if (sheet) {
      root.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (sheet) {
        root.style.overflow = "";
        document.body.style.overflow = "";
      }
    };
  }, [open, close]);

  // Keep the newest message in view before the browser paints (no jump), and
  // again when the log resizes (e.g. enquiry controls or keyboard change height).
  useLayoutEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, enquiry?.step, enquiry?.phase]);

  useEffect(() => {
    const log = logRef.current;
    if (!open || !log) return;
    const observer = new ResizeObserver(() => {
      log.scrollTop = log.scrollHeight;
    });
    observer.observe(log);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const updateMessage = (id: number, patch: Partial<Message>) =>
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const answerOffline = (botId: number, question: string, intent?: Intent) => {
    const match = intent ?? matchIntent(question);
    updateMessage(botId, { text: match.answer.join("\n\n"), links: match.links, streaming: false });
    setSuggestions(match.next ?? assistantMeta.starters);
  };

  const ask = async (text: string, intent?: Intent) => {
    const question = text.trim();
    if (!question || busy) return;

    if (offline) {
      const botMessageId = nextId.current++;
      setMessages((list) => [
        ...list,
        { id: nextId.current++, from: "user", text: question },
        { id: botMessageId, from: "bot", text: "", streaming: true },
      ]);
      setSuggestions([]);
      setBusy(true);
      window.setTimeout(() => {
        answerOffline(botMessageId, question, intent);
        setBusy(false);
      }, 500);
      return;
    }

    const userMessage: Message = { id: nextId.current++, from: "user", text: question };
    const botId = nextId.current++;
    const history = [...messages, userMessage]
      .filter((m) => m.text && !m.streaming && m.kind !== "enquiry")
      .map((m) => ({ role: m.from === "user" ? "user" : "assistant", content: m.text }));

    setMessages((list) => [...list, userMessage, { id: botId, from: "bot", text: "", streaming: true }]);
    setSuggestions([]);
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let received = "";

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      if (response.status === 429) {
        const { error } = (await response.json().catch(() => ({}))) as { error?: string };
        updateMessage(botId, { text: error ?? "Too many messages. Please try again shortly.", streaming: false });
        setSuggestions(["contact"]);
        return;
      }
      if (!response.ok || !response.body) {
        if (response.status === 503) setOffline(true);
        answerOffline(botId, question, intent);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += decoder.decode(value, { stream: true });
        const shown = received.includes(REPLACE_MARKER) ? received.split(REPLACE_MARKER).pop() ?? "" : received;
        updateMessage(botId, { text: shown });
      }
      const finalText = received.includes(REPLACE_MARKER) ? received.split(REPLACE_MARKER).pop() ?? "" : received;
      if (!finalText.trim()) {
        answerOffline(botId, question, intent);
        return;
      }
      updateMessage(botId, { text: finalText, streaming: false });
      setSuggestions(intent?.next ?? ["contact", "pricing", "process"]);
    } catch {
      if (controller.signal.aborted) return;
      // Network or mid-stream failure: keep any partial answer, otherwise answer offline.
      if (received.trim()) {
        updateMessage(botId, {
          text: `${received.trim()}\n\nSorry, the connection dropped. You can ask again or contact the team at /contact.`,
          streaming: false,
        });
      } else {
        answerOffline(botId, question, intent);
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  // ---------- Guided enquiry ----------
  const pushEnquiry = (...items: Omit<Message, "id" | "kind">[]) =>
    setMessages((list) => [...list, ...items.map((m) => ({ ...m, id: nextId.current++, kind: "enquiry" as const }))]);

  const startEnquiry = useCallback(() => {
    setOpen(true);
    setSuggestions([]);
    setEnquiry({ step: 0, answers: {}, phase: "asking" });
    setMessages((list) => [
      ...list,
      { id: nextId.current++, from: "user", text: enquiryCopy.start, kind: "enquiry" },
      { id: nextId.current++, from: "bot", text: enquiryIntro, kind: "enquiry" },
      { id: nextId.current++, from: "bot", text: enquirySteps[0].question, kind: "enquiry" },
    ]);
  }, []);

  const answerEnquiry = (value: string) => {
    if (!enquiry) return;
    const step = enquirySteps[enquiry.step];
    const answers = { ...enquiry.answers, [step.id]: value };
    const next = enquiry.step + 1;
    pushEnquiry({ from: "user", text: value || enquiryCopy.skip });
    if (next < enquirySteps.length) {
      pushEnquiry({ from: "bot", text: enquirySteps[next].question });
      setEnquiry({ step: next, answers, phase: "asking" });
    } else {
      pushEnquiry({ from: "bot", text: `${enquiryCopy.review}\n\n${enquirySummary(answers)}` });
      setEnquiry({ step: next, answers, phase: "review" });
    }
  };

  const sendEnquiry = async () => {
    if (!enquiry) return;
    setEnquiry({ ...enquiry, phase: "sending", error: undefined });
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: enquiry.answers }),
      });
      if (!response.ok) {
        const { error } = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(response.status === 429 || response.status === 400 ? error : undefined);
      }
      pushEnquiry({ from: "bot", text: enquiryCopy.sent });
      setEnquiry(null);
      setSuggestions(assistantMeta.starters.filter((id) => id !== "enquiry"));
    } catch (error) {
      pushEnquiry({ from: "bot", text: enquiryCopy.failed });
      setEnquiry({ ...enquiry, phase: "failed", error: error instanceof Error ? error.message || undefined : undefined });
    }
  };

  const restartEnquiry = () => {
    pushEnquiry({ from: "bot", text: `Let's start again.\n\n${enquirySteps[0].question}` });
    setEnquiry({ step: 0, answers: {}, phase: "asking" });
  };

  const cancelEnquiry = () => {
    pushEnquiry({ from: "bot", text: enquiryCopy.cancelled });
    setEnquiry(null);
    setSuggestions(assistantMeta.starters);
  };

  const enquiryMailto = enquiry
    ? `mailto:${site.email}?subject=${encodeURIComponent(`Website enquiry: ${enquiry.answers.area ?? "Automation"}`)}&body=${encodeURIComponent(
        enquirySummary(enquiry.answers).replace(/^- /gm, ""),
      )}`
    : `mailto:${site.email}`;

  // Let any page start the enquiry (e.g. the contact page button).
  useEffect(() => {
    const onStart = () => {
      if (!enquiry) startEnquiry();
      else setOpen(true);
    };
    window.addEventListener(START_ENQUIRY_EVENT, onStart);
    return () => window.removeEventListener(START_ENQUIRY_EVENT, onStart);
  }, [enquiry, startEnquiry]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void ask(draft);
    setDraft("");
  };

  const navigate = () => setOpen(false);

  return (
    <div className={styles.root}>
      {open && (
        <section id={panelId} className={styles.panel} role="dialog" aria-label={assistantMeta.name}>
          <header className={styles.head}>
            <span className={styles.avatar} aria-hidden="true">
              <AssistantMark />
            </span>
            <span className={styles.headText}>
              <strong>{assistantMeta.name}</strong>
              <small>
                <i aria-hidden="true" /> {offline ? assistantMeta.offlineStatus : assistantMeta.status}
              </small>
            </span>
            <button type="button" className={styles.close} onClick={close} aria-label="Close assistant">
              <Icon name="close" />
            </button>
          </header>

          <div ref={logRef} className={styles.log} role="log" aria-live="polite" aria-relevant="additions" aria-busy={busy}>
            {messages.map((message) => (
              <div key={message.id} className={`${styles.message} ${styles[message.from]}`}>
                {message.from === "bot" && (
                  <span className={styles.msgAvatar} aria-hidden="true">
                    <AssistantMark />
                  </span>
                )}
                {message.streaming && !message.text ? (
                  <div className={`${styles.bubble} ${styles.typing}`} aria-label="Assistant is typing">
                    <i />
                    <i />
                    <i />
                  </div>
                ) : (
                  <div className={styles.bubble}>
                    <span className="sr-only">{message.from === "bot" ? `${assistantMeta.name}:` : "You:"}</span>
                    {message.from === "bot" ? (
                      <RichText text={message.text} onNavigate={navigate} />
                    ) : (
                      <p>{message.text}</p>
                    )}
                    {message.streaming && <span className={styles.caret} aria-hidden="true" />}
                    {message.links && (
                      <span className={styles.links}>
                        {message.links.map((link) =>
                          link.href.startsWith("/") ? (
                            <Link key={link.href} href={link.href} onClick={navigate}>
                              {link.label} <Icon name="arrow" />
                            </Link>
                          ) : (
                            <a key={link.href} href={link.href}>
                              {link.label} <Icon name="arrow" />
                            </a>
                          ),
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {enquiry ? (
            <EnquiryControls
              key={`${enquiry.step}-${enquiry.phase}`}
              step={enquirySteps[enquiry.step]}
              phase={enquiry.phase}
              error={enquiry.error}
              mailtoHref={enquiryMailto}
              onAnswer={answerEnquiry}
              onSend={() => void sendEnquiry()}
              onRestart={restartEnquiry}
              onCancel={cancelEnquiry}
              onNavigate={navigate}
            />
          ) : (
            <>
          {suggestions.length > 0 && !busy && (
            <div className={styles.chips} aria-label="Suggested questions">
              {suggestions.map((id) => {
                if (id === "enquiry") {
                  return (
                    <button key={id} type="button" className={`${styles.chip} ${styles.chipPrimary}`} onClick={startEnquiry}>
                      {intentLabels[id]}
                    </button>
                  );
                }
                const intent = byId(id);
                if (!intent) return null;
                return (
                  <button key={id} type="button" className={styles.chip} onClick={() => void ask(intentLabels[id] ?? id, intent)}>
                    {intentLabels[id] ?? id}
                  </button>
                );
              })}
            </div>
          )}

          <form className={styles.form} onSubmit={onSubmit}>
            <label htmlFor={`${panelId}-input`} className="sr-only">
              Ask the DotSeek Assistant a question
            </label>
            <input
              ref={inputRef}
              id={`${panelId}-input`}
              className={styles.input}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={assistantMeta.inputPlaceholder}
              autoComplete="off"
              maxLength={1000}
            />
            <button type="submit" className={styles.send} aria-label="Send" disabled={!draft.trim() || busy}>
              <Icon name="arrow" />
            </button>
          </form>
            </>
          )}
          <p className={styles.disclaimer}>
            {offline ? assistantMeta.offlineDisclaimer : assistantMeta.disclaimer}{" "}
            <Link href="/privacy" onClick={navigate}>
              Privacy
            </Link>
          </p>
        </section>
      )}

      <button
        ref={launcherRef}
        type="button"
        className={`${styles.launcher} ${open ? styles.launcherOpen : ""}`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? "Close DotSeek Assistant" : "Open DotSeek Assistant"}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? <Icon name="close" /> : <Icon name="chat" />}
        {!open && <span className={styles.launcherLabel}>Ask DotSeek</span>}
        {!seen && !open && <span className={styles.ping} aria-hidden="true" />}
      </button>
    </div>
  );
}

function AssistantMark() {
  return (
    <svg viewBox="0 0 32 32" focusable="false">
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeDasharray="46 18" strokeLinecap="round" />
      <circle cx="16" cy="16" r="4" fill="currentColor" />
    </svg>
  );
}
