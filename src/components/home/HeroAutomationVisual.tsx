import { DashboardMockup } from "@/components/visual/DashboardMockup";
import { Icon } from "@/components/common/Icon";
import styles from "./HeroAutomationVisual.module.css";

/** Dashboard mockup + floating context cards. Decorative; summarised for AT. */
export function HeroAutomationVisual() {
  return (
    <figure className={styles.visual}>
      <figcaption className="sr-only">
        Illustration of the DotSeek Automation Monitor: a lead to invoice workflow where a lead is received, qualified
        by AI, recorded in the CRM and quoted, then awaits manager approval before invoicing and the customer reminder.
      </figcaption>
      <div className={styles.frame} aria-hidden="true">
        <div className={styles.cornerGlow} />
        <DashboardMockup />

        <div className={`${styles.float} ${styles.floatLeft}`}>
          <span className={styles.floatIcon}>
            <Icon name="mail" />
          </span>
          <span>
            <strong>New enquiry</strong>
            <small>Captured from website</small>
          </span>
        </div>

        <div className={`${styles.float} ${styles.floatRight}`}>
          <span className={styles.floatIcon}>
            <Icon name="plug" />
          </span>
          <span>
            <strong>6 systems connected</strong>
            <small>CRM · ERP · Teams · Xero</small>
          </span>
        </div>
      </div>
    </figure>
  );
}
