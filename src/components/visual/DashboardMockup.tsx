import { heroFlow } from "@/content/home";
import { Badge } from "@/components/common/Badge";
import { Icon, type IconName } from "@/components/common/Icon";
import { MockWindow } from "./MockWindow";
import styles from "./DashboardMockup.module.css";

const sidebar: { label: string; icon: IconName; active?: boolean }[] = [
  { label: "Automations", icon: "workflow", active: true },
  { label: "AI Agents", icon: "agent" },
  { label: "Integrations", icon: "plug" },
  { label: "Documents", icon: "document" },
  { label: "Insights", icon: "chart" },
];

const statusLabel = { done: "Completed", active: "Processing", queued: "Scheduled" } as const;
const statusTone = { done: "success", active: "warning", queued: "neutral" } as const;

/**
 * Hero product mockup: the DotSeek Automation Monitor running a
 * lead-to-invoice workflow, with the Operations Agent panel alongside.
 */
export function DashboardMockup() {
  return (
    <MockWindow
      title="app.dotseek.ai / automations / lead-to-invoice"
      toolbar={
        <Badge variant="status" tone="success" dot>
          Live
        </Badge>
      }
      bodyClassName={styles.layout}
    >
      <aside className={styles.sidebar}>
        <div className={styles.workspace}>
          <span className={styles.avatar}>A</span>
          <span>
            <strong>Acme Workspace</strong>
            <small>Operations</small>
          </span>
        </div>
        <ul className={styles.nav}>
          {sidebar.map((item) => (
            <li key={item.label} className={item.active ? styles.navActive : undefined}>
              <Icon name={item.icon} />
              {item.label}
            </li>
          ))}
        </ul>
        <div className={styles.usage}>
          <small>Runs this week</small>
          <strong>1,284</strong>
          <span className={styles.usageBar}>
            <i />
          </span>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.mainHead}>
          <div>
            <small>Workflow</small>
            <strong>Lead → Quote → Invoice</strong>
          </div>
          <span className={styles.runId}>Run #4821 · ACME Ltd</span>
        </div>

        <ol className={styles.flow}>
          {heroFlow.map((step, index) => (
            <li
              key={step.label}
              className={[styles.step, styles[step.status]].join(" ")}
              style={{ "--i": index } as React.CSSProperties}
            >
              <span className={styles.node}>
                {step.status === "done" ? <Icon name="check" /> : step.status === "active" ? <i className={styles.spinner} /> : null}
              </span>
              <span className={styles.stepText}>
                <strong>{step.label}</strong>
                <small>{step.system}</small>
              </span>
              <Badge variant="status" tone={statusTone[step.status]}>
                {statusLabel[step.status]}
              </Badge>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.agent}>
        <div className={styles.agentHead}>
          <span className={styles.agentIcon}>
            <Icon name="sparkle" />
          </span>
          <span>
            <strong>Operations Agent</strong>
            <small className={styles.thinking}>Analysing request…</small>
          </span>
        </div>
        <dl className={styles.fields}>
          <div>
            <dt>Customer</dt>
            <dd>ACME Ltd</dd>
          </div>
          <div>
            <dt>Request</dt>
            <dd>Generate quotation</dd>
          </div>
          <div>
            <dt>CRM</dt>
            <dd className={styles.ok}>Connected</dd>
          </div>
          <div>
            <dt>Finance</dt>
            <dd className={styles.ok}>Connected</dd>
          </div>
        </dl>
        <div className={styles.action}>
          <small>Action</small>
          <strong>
            <Icon name="check" /> Quotation generated
          </strong>
        </div>
        <div className={styles.approval}>
          <small>Awaiting approval in Teams</small>
          <span className={styles.approvalBtns}>
            <i>Approve</i>
            <i>Review</i>
          </span>
        </div>
      </div>
    </MockWindow>
  );
}
