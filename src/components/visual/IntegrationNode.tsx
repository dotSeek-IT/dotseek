import { Icon } from "@/components/common/Icon";
import styles from "./IntegrationNode.module.css";

/** The DotSeek automation layer drawn between two rows of systems. */
export function IntegrationNode() {
  return (
    <div className={styles.layer} aria-hidden="true">
      <span className={styles.line} />
      <span className={styles.core}>
        <span className={styles.coreIcon}>
          <Icon name="sparkle" />
        </span>
        DotSeek automation layer
        <span className={styles.pulse} />
      </span>
      <span className={styles.line} />
    </div>
  );
}
