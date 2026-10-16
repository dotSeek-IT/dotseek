"use client";

import { answerRows, type Answers } from "@/content/enquiryFlows";
import { LogoMark } from "@/components/common/LogoMark";
import type { Brief } from "./useEnquiry";
import styles from "./DotSeekAssistant.module.css";

type EnquiryReviewProps = {
  answers: Answers;
  brief?: Brief;
  briefStatus: "idle" | "loading" | "ready" | "unavailable";
  disabled: boolean;
  onEdit: (stepId: string) => void;
  /** Collapsible answers only (the plan card carries the estimate). */
  answersOnly?: boolean;
  /** Open the collapsible answers (after "Modify requirements"). */
  expanded?: boolean;
};

/** Review card shown in the chat log: every answer with an Edit button, plus the AI project brief. */
export function EnquiryReview({ answers, brief, briefStatus, disabled, onEdit, answersOnly, expanded }: EnquiryReviewProps) {
  const rows = answerRows(answers);
  const list = (
    <dl className={styles.reviewList}>
      {rows.map((row) => (
        <div key={row.id} className={styles.reviewRow}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
          <button type="button" className={styles.editButton} onClick={() => onEdit(row.id)} disabled={disabled} aria-label={`Edit ${row.label}`}>
            Edit
          </button>
        </div>
      ))}
    </dl>
  );

  if (answersOnly) {
    return (
      <details className={styles.review} open={expanded}>
        <summary className={styles.reviewSummary}>Review or change your answers ({rows.length})</summary>
        {list}
      </details>
    );
  }

  return (
    <section className={styles.review} aria-label="Enquiry summary">
      <div className={styles.briefBox} aria-live="polite">
        <p className={styles.reviewKicker}>Project brief</p>
        {briefStatus === "loading" && (
          <p className={styles.thinkingRow}>
            <LogoMark spin size={18} className={styles.loaderMark} />
            Preparing your project brief…
          </p>
        )}
        {briefStatus === "ready" && brief && (
          <>
            <h3 className={styles.briefTitle}>{brief.title}</h3>
            <p>{brief.overview}</p>
            <BriefList title="Suggested features" items={brief.suggestedFeatures} />
            <BriefList title="Possible technology" items={brief.suggestedTechnology} />
            <BriefList title="We'll clarify" items={brief.openQuestions} />
            <p className={styles.reviewNote}>AI suggestions, confirmed with you by the DotSeek team.</p>
          </>
        )}
        {briefStatus === "unavailable" && (
          <p className={styles.reviewNote}>The team will prepare your project brief after reviewing your answers.</p>
        )}
      </div>
      {list}
    </section>
  );
}

function BriefList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className={styles.briefListTitle}>{title}</p>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
