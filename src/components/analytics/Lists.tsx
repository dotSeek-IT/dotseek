"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/common/Icon";
import { flagEmoji } from "@/lib/countries";
import { fmtMoney, useAnalytics } from "./AnalyticsContext";
import { EmptyState, MetricSwitch } from "./Panel";
import styles from "./Dashboard.module.css";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";

const STATUS: Record<string, { label: string; tone: string }> = {
  awaiting: { label: "Awaiting decision", tone: "info" },
  accepted: { label: "Accepted", tone: "success" },
  declined: { label: "Declined", tone: "warning" },
  none: { label: "Not sent", tone: "muted" },
};

/** Deterministic findings from the data; click one to apply its filter. */
export function InsightsPanel() {
  const { data, setFilter } = useAnalytics();
  if (!data.insights.length)
    return <EmptyState text="Not enough activity yet for reliable insights. They appear once there are enough visits and quotes to compare." />;
  return (
    <ul className={styles.insights}>
      {data.insights.map((i) => (
        <li key={i.id} data-tone={i.tone}>
          <span className={styles.insightIcon} aria-hidden="true">
            {i.tone === "up" ? "↑" : i.tone === "down" ? "↓" : "•"}
          </span>
          <span className="sr-only">{i.tone === "up" ? "Positive: " : i.tone === "down" ? "Needs attention: " : "Finding: "}</span>
          <p>{i.text}</p>
          {i.filter && (
            <button type="button" className={styles.insightAction} onClick={() => setFilter(i.filter!.dim, i.filter!.value)}>
              Focus
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Recent and highest value quotes, linking to each enquiry. */
export function QuotesList() {
  const { data, hover } = useAnalytics();
  const [view, setView] = useState<"recent" | "top">("recent");
  const rows = view === "recent" ? data.quotes.recent : data.quotes.top;
  return (
    <>
      <div className={styles.toolbarRow}>
        <MetricSwitch
          label="Quotes view"
          value={view}
          options={[
            { value: "recent", label: "Recent" },
            { value: "top", label: "Highest value" },
          ]}
          onChange={setView}
        />
      </div>
      {!rows.length ? (
        <EmptyState text="No quotes sent for the selected period." />
      ) : (
        <ul className={styles.quoteList}>
          {rows.map((q) => {
            const lit =
              (hover?.dim === "country" && hover.value === q.country) ||
              (hover?.dim === "source" && hover.value === q.source) ||
              (hover?.dim === "device" && hover.value.toLowerCase() === q.device.toLowerCase());
            const st = STATUS[q.status] ?? STATUS.awaiting!;
            return (
              <li key={q.id} data-active={lit ? "" : undefined}>
                <Link href={`/admin/enquiries/${q.id}`} className={styles.quoteItem}>
                  <span className={styles.quoteAvatar} aria-hidden="true">
                    {initials(q.name)}
                  </span>
                  <span className={styles.quoteMain}>
                    <strong>
                      {q.name || "Customer"}
                      {q.company ? `, ${q.company}` : ""}
                    </strong>
                    <span>
                      {q.ref} · {q.service} · {flagEmoji(q.country)} {q.countryName}
                    </span>
                  </span>
                  <span className={styles.quoteStatus} data-tone={st.tone}>
                    {st.label}
                  </span>
                  <span className={styles.quoteValue}>
                    {fmtMoney(q.value, data.currency)}
                    <small>{new Date(q.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</small>
                  </span>
                  <Icon name="arrow" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
