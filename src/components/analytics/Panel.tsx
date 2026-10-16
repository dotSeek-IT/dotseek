import type { ReactNode } from "react";
import styles from "./Dashboard.module.css";

/** Dashboard card: title, optional controls, and honest loading, empty or collecting states. */
export function Panel({
  id,
  title,
  description,
  actions,
  empty,
  children,
  className,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** When set, the panel shows this message instead of a chart (never empty axes). */
  empty?: string | null;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={[styles.panel, className].filter(Boolean).join(" ")} aria-labelledby={`${id}-title`}>
      <header className={styles.panelHead}>
        <div>
          <h2 id={`${id}-title`}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className={styles.panelActions}>{actions}</div>}
      </header>
      {empty ? <EmptyState text={empty} /> : children}
    </section>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className={styles.emptyState} role="status">
      <span aria-hidden="true" className={styles.emptyMark} />
      <p>{text}</p>
    </div>
  );
}

/** Skeleton in the shape of a chart while its code or data loads. */
export function ChartSkeleton({ height }: { height: number }) {
  return (
    <div className={styles.skeleton} style={{ height }} aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

/** Segmented metric switch used by several charts. */
export function MetricSwitch<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className={styles.segment} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
