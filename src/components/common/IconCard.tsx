import { Icon, type IconName } from "./Icon";
import styles from "./IconCard.module.css";

type IconCardProps = {
  icon: IconName;
  title: string;
  body: string;
  /** Optional small label shown above the title (e.g. the outcome measured). */
  meta?: string;
};

/** Feature-grid card: yellow icon, title, muted body (reference feature grid). */
export function IconCard({ icon, title, body, meta }: IconCardProps) {
  return (
    <article className={`${styles.card} ds-spotlight`}>
      <span className={styles.icon}>
        <Icon name={icon} />
      </span>
      {meta && <span className={styles.meta}>{meta}</span>}
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.body}>{body}</p>
    </article>
  );
}
