import { Badge } from "@/components/common/Badge";
import { Icon } from "@/components/common/Icon";
import { MockWindow } from "./MockWindow";
import styles from "./CapabilityVisuals.module.css";

/* Small product-UI vignettes used in the capability bento. All decorative. */

export function AgentChatVisual() {
  return (
    <MockWindow title="Sales Agent · conversation" bodyClassName={styles.chat}>
      <div className={`${styles.bubble} ${styles.user}`}>
        Can you send ACME a quote for 40 licences with annual billing?
      </div>
      <div className={styles.agentRow}>
        <span className={styles.agentDot}>
          <Icon name="sparkle" />
        </span>
        <div className={`${styles.bubble} ${styles.agent}`}>
          <p>Found ACME Ltd in HubSpot · pricing tier B applied.</p>
          <ul className={styles.toolCalls}>
            <li>
              <Icon name="check" /> crm.lookup(&quot;ACME Ltd&quot;)
            </li>
            <li>
              <Icon name="check" /> pricing.calculate(40, &quot;annual&quot;)
            </li>
            <li className={styles.pending}>
              <i /> quote.create → awaiting approval
            </li>
          </ul>
        </div>
      </div>
      <div className={styles.composer}>
        <span>Ask the agent or assign a task…</span>
        <i>
          <Icon name="arrow" />
        </i>
      </div>
    </MockWindow>
  );
}

export function MiniWorkflowVisual() {
  const nodes = [
    { label: "Trigger", detail: "Form submitted", icon: "bolt" },
    { label: "AI step", detail: "Classify request", icon: "sparkle" },
    { label: "Condition", detail: "Value > £5k?", icon: "workflow" },
    { label: "Action", detail: "Create task in ERP", icon: "check" },
  ] as const;

  return (
    <div className={styles.miniFlow}>
      {nodes.map((node, index) => (
        <div key={node.label} className={styles.miniNode} style={{ "--i": index } as React.CSSProperties}>
          <span className={styles.miniIcon}>
            <Icon name={node.icon} />
          </span>
          <span>
            <small>{node.label}</small>
            <strong>{node.detail}</strong>
          </span>
        </div>
      ))}
    </div>
  );
}

export function DocumentVisual() {
  const fields = [
    ["Supplier", "Northwind Supplies"],
    ["Invoice no.", "INV-20931"],
    ["Total", "£4,280.00"],
    ["PO match", "PO-7781 ✓"],
  ];
  return (
    <div className={styles.doc}>
      <div className={styles.paper}>
        <span className={styles.paperHead} />
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className={styles.paperLine} style={{ width: `${88 - ((i * 13) % 40)}%` }} />
        ))}
        <span className={styles.scan} />
      </div>
      <dl className={styles.extracted}>
        {fields.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
        <Badge variant="status" tone="success">
          Validated · routed to Finance
        </Badge>
      </dl>
    </div>
  );
}

export function CustomerVisual() {
  return (
    <div className={styles.customer}>
      <div className={styles.ticket}>
        <span className={styles.channel}>WhatsApp</span>
        <p>Hi, can I change my delivery date?</p>
      </div>
      <div className={`${styles.ticket} ${styles.reply}`}>
        <span className={styles.channel}>DotSeek Assistant · 4s</span>
        <p>Done, moved to Thursday. You&apos;ll get a confirmation email shortly.</p>
      </div>
      <div className={styles.metaRow}>
        <Badge variant="status" tone="brand">
          Intent: reschedule
        </Badge>
        <Badge variant="status" tone="success">
          Resolved
        </Badge>
      </div>
    </div>
  );
}

export function IntegrationVisual() {
  const systems = ["CRM", "ERP", "Email", "SQL", "Stripe", "Teams"];
  return (
    <div className={styles.hub}>
      <svg className={styles.hubLines} viewBox="0 0 300 180" width="300" height="180" preserveAspectRatio="none" aria-hidden="true">
        {[
          [40, 30],
          [150, 18],
          [260, 30],
          [40, 150],
          [150, 162],
          [260, 150],
        ].map(([x, y]) => (
          <line key={`${x}-${y}`} x1="150" y1="90" x2={x} y2={y} />
        ))}
      </svg>
      <span className={styles.hubCore}>
        <Icon name="sparkle" />
      </span>
      {systems.map((system, index) => (
        <span key={system} className={styles.hubNode} data-pos={index}>
          {system}
        </span>
      ))}
    </div>
  );
}

export function InsightsVisual() {
  const bars = [38, 52, 46, 64, 58, 74, 70, 86, 80, 94];
  return (
    <MockWindow
      title="Operations insights"
      toolbar={<Badge variant="tag">This quarter</Badge>}
      bodyClassName={styles.insights}
    >
      <div className={styles.kpis}>
        <div>
          <small>Automated runs</small>
          <strong>12,406</strong>
        </div>
        <div>
          <small>Exceptions</small>
          <strong>1.8%</strong>
        </div>
        <div>
          <small>Avg. cycle time</small>
          <strong>3m 12s</strong>
        </div>
      </div>
      <div className={styles.chart}>
        {bars.map((h, i) => (
          <span key={i} style={{ "--h": `${h}%`, "--i": i } as React.CSSProperties} />
        ))}
      </div>
      <div className={styles.insightNote}>
        <Icon name="sparkle" />
        <p>
          <strong>AI insight:</strong> approvals over £10k wait 2.4× longer. Consider a delegated approver.
        </p>
      </div>
    </MockWindow>
  );
}
