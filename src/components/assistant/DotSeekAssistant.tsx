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
import { solutionById, type SolutionId } from "@/content/solutions";
import { Icon } from "@/components/common/Icon";
import dynamic from "next/dynamic";
import { PlanCard } from "@/components/plan/PlanCard";
import { ReferenceCard } from "@/components/plan/ReferenceCard";
import { EnquiryModal } from "./EnquiryModal";
import { offerFor } from "@/lib/plan/offer";
import { EnquiryControls } from "./EnquiryControls";
import { EnquiryReview } from "./EnquiryReview";
import { enquiryMailto, solutionNoun, solutionTitle, useEnquiry } from "./useEnquiry";
import styles from "./DotSeekAssistant.module.css";

/** The full estimate & architecture view is loaded the first time it opens. */
const PlanDialog = dynamic(() => import("@/components/plan/PlanDialog").then((m) => m.PlanDialog), { ssr: false });

/**
 * Dispatch this window event from any page to open the chat enquiry:
 *   window.dispatchEvent(new CustomEvent(START_ENQUIRY_EVENT, { detail: { solution: "website" } }))
 * `detail.solution` is optional (no solution = ask what they need; "consult" = describe the problem).
 */
export const START_ENQUIRY_EVENT = "dotseek:start-enquiry";
export type StartEnquiryDetail = { solution?: SolutionId | "consult" | "reference" };

/** In-band control frame from /api/assistant (consultant tool call). */
const CONTROL_MARKER = "\u0001";

type Message = {
  id: number;
  from: "bot" | "user";
  text: string;
  links?: AssistantLink[];
  /** True while the reply is still streaming in. */
  streaming?: boolean;
  /** Enquiry-flow messages are never sent to the AI chat endpoint. */
  kind?: "enquiry";
  /** Consultant suggestion card: starts the tailored enquiry for this solution. */
  startSolution?: SolutionId;
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

/** Turns site paths (/contact, /#agents) and emails into links. */
const LINK_PATTERN = /(\/(?:#[a-z-]+|[a-z-]+(?:#[a-z-]+)?)(?=[\s.,;:!?)]|$)|[\w.+-]+@[\w-]+\.[\w.]+)/gi;

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
    return (
      <a key={i} href={`mailto:${part}`}>
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
      // The estimate dialog handles its own Esc; don't close the chat behind it.
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) close();
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
  }, [messages]);

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
        const visible = received.split(CONTROL_MARKER)[0];
        const shown = visible.includes(REPLACE_MARKER) ? visible.split(REPLACE_MARKER).pop() ?? "" : visible;
        updateMessage(botId, { text: shown });
      }
      const [visible, control] = received.split(CONTROL_MARKER);
      const finalText = visible.includes(REPLACE_MARKER) ? visible.split(REPLACE_MARKER).pop() ?? "" : visible;

      // The consultant decided the visitor is ready: offer the tailored enquiry.
      let startSolution: SolutionId | undefined;
      let reason = "";
      if (control) {
        try {
          const frame = JSON.parse(control) as { type?: string; solution?: string; reason?: string };
          if (frame.type === "start_enquiry" && solutionById(frame.solution ?? "")) {
            startSolution = frame.solution as SolutionId;
            reason = frame.reason ?? "";
          }
        } catch {
          /* ignore a malformed frame */
        }
      }

      if (!finalText.trim() && !startSolution) {
        answerOffline(botId, question, intent);
        return;
      }
      updateMessage(botId, {
        text: [finalText.trim(), startSolution && reason && !finalText.includes(reason) ? reason : ""].filter(Boolean).join("\n\n"),
        streaming: false,
        startSolution,
      });
      setSuggestions(startSolution ? [] : intent?.next ?? ["enquiry", "pricing", "process"]);
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
  const pushEnquiry = (from: "bot" | "user", text: string, extra: Partial<Message> = {}) =>
    setMessages((list) => [...list, { id: nextId.current++, from, text, kind: "enquiry", ...extra }]);

  const chatTranscript = () =>
    messages
      .filter((m) => m.id !== 0 && m.text && !m.streaming && m.kind !== "enquiry")
      .map((m) => ({ role: m.from === "user" ? ("user" as const) : ("assistant" as const), content: m.text }));

  const enquiry = useEnquiry({
    botSay: (text, extra) => pushEnquiry("bot", text, extra),
    userSay: (text) => pushEnquiry("user", text),
    transcript: chatTranscript,
    hasTranscript: chatTranscript().some((t) => t.role === "user"),
  });
  const enquiryState = enquiry.state;
  const plan = enquiry.plan;
  const offerQuote = plan ? offerFor(enquiry.offer, plan.solution, plan.build) : null;
  const [planOpen, setPlanOpen] = useState(false);
  const [answersOpen, setAnswersOpen] = useState(false);
  /** The customer's private enquiry page, shown in a modal after sending. */
  const [enquiryView, setEnquiryView] = useState<{ url: string; title: string } | null>(null);
  const planTitle = enquiryState?.brief?.title || `${solutionTitle(enquiryState?.answers.solution_id ?? plan?.solution)} plan`;

  const modifyRequirements = () => {
    setPlanOpen(false);
    setAnswersOpen(true);
    pushEnquiry("bot", "Choose any answer below to change it. Your estimate and architecture update automatically.");
  };

  const startEnquiry = (solution?: SolutionId | "consult" | "reference") => {
    if (busy) return;
    setOpen(true);
    setSuggestions([]);
    if (solution === "reference") {
      enquiry.startReference();
      return;
    }
    if (solution === "consult") {
      enquiry.start(undefined, { announce: "I'm not sure what I need" });
      return;
    }
    enquiry.start(solution);
  };

  // Let any page start the enquiry (contact page, solution cards...).
  useEffect(() => {
    const onStart = (event: Event) => {
      const detail = (event as CustomEvent<StartEnquiryDetail | undefined>).detail;
      if (enquiry.state) {
        setOpen(true);
        return;
      }
      startEnquiry(detail?.solution);
    };
    window.addEventListener(START_ENQUIRY_EVENT, onStart);
    return () => window.removeEventListener(START_ENQUIRY_EVENT, onStart);
  });

  // "Start a fresh quote" links in emails (/?quote=new): open the assistant on a new enquiry, once.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("quote") !== "new") return;
    url.searchParams.delete("quote");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    window.dispatchEvent(new CustomEvent<StartEnquiryDetail>(START_ENQUIRY_EVENT, { detail: {} }));
  }, []);

  // After an enquiry finishes or is cancelled, bring back the starter chips.
  const hadEnquiry = useRef(false);
  useEffect(() => {
    if (enquiryState) hadEnquiry.current = true;
    else if (hadEnquiry.current) {
      hadEnquiry.current = false;
      setPlanOpen(false);
      setSuggestions(assistantMeta.starters);
    }
  }, [enquiryState]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void ask(draft);
    setDraft("");
  };

  const navigate = () => setOpen(false);

  return (
    <div className={styles.root}>
      {enquiryView && <EnquiryModal url={enquiryView.url} title={enquiryView.title} onClose={() => setEnquiryView(null)} />}
      {planOpen && plan && enquiryState && (
        <PlanDialog
          plan={plan}
          solutionTitle={solutionTitle(plan.solution)}
          brief={enquiryState.brief}
          briefStatus={enquiryState.briefStatus}
          choices={enquiryState.choices}
          onChoices={enquiry.setChoices}
          onFitBudget={enquiry.fitBudget}
          offer={offerQuote}
          negotiation={enquiryState.negotiation}
          onNegotiate={enquiry.setNegotiation}
          reference={enquiryState.reference}
          getOptions={enquiry.getOptions}
          onApplyOption={enquiry.applyOption}
          onMakeCheaper={enquiry.makeCheaper}
          onContinue={
            enquiryState.phase === "plan"
              ? () => {
                  setPlanOpen(false);
                  enquiry.continueToSend();
                }
              : undefined
          }
          onConsult={
            enquiryState.phase === "plan"
              ? () => {
                  setPlanOpen(false);
                  enquiry.requestConsultation();
                }
              : undefined
          }
          onModify={modifyRequirements}
          contact={{
            name: enquiryState.answers.name,
            email: enquiryState.answers.email,
            company: enquiryState.answers.company,
            phone: enquiryState.answers.phone,
          }}
          onContact={enquiry.setContact}
          onClose={() => setPlanOpen(false)}
        />
      )}
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
                    {message.startSolution && (
                      <span className={styles.links}>
                        <button
                          type="button"
                          className={styles.startCard}
                          onClick={() => startEnquiry(message.startSolution)}
                          disabled={Boolean(enquiryState) || busy}
                        >
                          Start my {solutionNoun(message.startSolution)} enquiry <Icon name="arrow" />
                        </button>
                      </span>
                    )}
                    {message.links && (
                      <span className={styles.links}>
                        {message.links.map((link) =>
                          link.href.includes("/enquiry/") ? (
                            // The private enquiry page opens in a modal, like the quotation, so the chat stays put.
                            <button
                              key={link.href}
                              type="button"
                              className={styles.linkButton}
                              onClick={() =>
                                setEnquiryView({
                                  url: link.href,
                                  title: `Your enquiry${message.text.match(/\((DS-[A-Z0-9]+)\)/)?.[1] ? ` ${message.text.match(/\((DS-[A-Z0-9]+)\)/)![1]}` : ""}`,
                                })
                              }
                            >
                              {link.label} <Icon name="arrow" />
                            </button>
                          ) : /^https?:\/\//.test(link.href) || link.href === "/privacy" ? (
                            // Pages outside the site layout (the private enquiry page) or long reads
                            // open in a new tab, so the chat, estimate and quotation stay as they are.
                            <a key={link.href} href={link.href} target="_blank" rel="noopener">
                              {link.label} <Icon name="arrow" />
                              <span className="sr-only"> (opens in a new tab)</span>
                            </a>
                          ) : link.href.startsWith("/") ? (
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
            {enquiryState?.reference && enquiry.referencePlan && (
              <ReferenceCard analysis={enquiryState.reference} plan={enquiry.referencePlan} />
            )}
            {enquiryState && plan && enquiryState.planSeen && enquiryState.phase !== "recommending" && (
              <PlanCard plan={plan} title={planTitle} offer={offerQuote} onOpen={() => setPlanOpen(true)} />
            )}
            {enquiryState?.phase === "plan" && (
              <EnquiryReview
                answers={enquiryState.answers}
                briefStatus={enquiryState.briefStatus}
                disabled={false}
                onEdit={(id) => {
                  setAnswersOpen(false);
                  enquiry.edit(id);
                }}
                answersOnly
                expanded={answersOpen}
              />
            )}
            {enquiryState && ["review", "sending", "failed"].includes(enquiryState.phase) && (
              <EnquiryReview
                answers={enquiryState.answers}
                brief={enquiryState.brief}
                briefStatus={enquiryState.briefStatus}
                disabled={enquiryState.phase === "sending"}
                onEdit={enquiry.edit}
              />
            )}
          </div>

          {enquiryState ? (
            <EnquiryControls
              key={`${enquiry.currentStep?.id ?? "none"}-${enquiryState.phase}-${enquiryState.editing ?? ""}`}
              phase={enquiryState.phase}
              step={enquiry.currentStep}
              editing={Boolean(enquiryState.editing)}
              solutions={enquiry.solutions}
              recommendation={enquiryState.recommendation}
              hasTranscript={chatTranscript().some((t) => t.role === "user")}
              includeTranscript={enquiryState.includeTranscript}
              hasPlan={Boolean(plan)}
              emailCopy={enquiryState.emailCopy}
              consultation={enquiryState.consultation}
              onToggleEmailCopy={enquiry.setEmailCopy}
              onToggleConsultation={enquiry.setConsultation}
              onOpenPlan={() => setPlanOpen(true)}
              onReference={(url) => void enquiry.submitReference(url)}
              onSkipReference={enquiry.skipReference}
              onContinue={enquiry.continueToSend}
              onConsult={enquiry.requestConsultation}
              error={enquiryState.error}
              mailtoHref={enquiryMailto(enquiryState.answers, plan)}
              onAnswer={enquiry.answer}
              onChoose={enquiry.choose}
              onSend={() => void enquiry.send()}
              onRestart={enquiry.restart}
              onCancel={enquiry.cancel}
              onCancelEdit={enquiry.cancelEdit}
              onToggleTranscript={enquiry.setIncludeTranscript}
            />
          ) : (
            <>
          {suggestions.length > 0 && !busy && (
            <div className={styles.chips} aria-label="Suggested questions">
              {suggestions.map((id) => {
                if (id === "reference") {
                  return (
                    <button key={id} type="button" className={styles.chip} onClick={() => startEnquiry("reference")}>
                      {intentLabels[id]}
                    </button>
                  );
                }
                if (id === "enquiry") {
                  return (
                    <button key={id} type="button" className={`${styles.chip} ${styles.chipPrimary}`} onClick={() => startEnquiry()}>
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
            <Link href="/privacy" target="_blank" rel="noopener">
              Privacy<span className="sr-only"> (opens in a new tab)</span>
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
    <svg viewBox="0 0 32 32" width="22" height="22" focusable="false">
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeDasharray="46 18" strokeLinecap="round" />
      <circle cx="16" cy="16" r="4" fill="currentColor" />
    </svg>
  );
}
