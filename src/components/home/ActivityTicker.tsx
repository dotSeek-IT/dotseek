import { activity } from "@/content/home";
import { Icon } from "@/components/common/Icon";
import styles from "./ActivityTicker.module.css";

/** Live-feeling stream of automation events under the hero copy. Illustrative UI. */
export function ActivityTicker() {
  const row = (hidden: boolean) => (
    <ul className={styles.list} aria-hidden={hidden || undefined}>
      {activity.map((item) => (
        <li key={item.label} className={styles.item}>
          <span className={styles.check}>
            <Icon name="check" />
          </span>
          <strong>{item.label}</strong>
          <span className={styles.detail}>{item.detail}</span>
          <span className={styles.time}>{item.time}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={styles.ticker}>
      <span className={styles.live}>
        <i aria-hidden="true" /> Live automations
      </span>
      <div className={styles.viewport} aria-label="Example automation activity">
        <div className={styles.track}>
          {row(false)}
          {row(true)}
        </div>
      </div>
    </div>
  );
}
