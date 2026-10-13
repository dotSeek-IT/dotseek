import { Badge } from "@/components/common/Badge";
import { Icon, type IconName } from "@/components/common/Icon";
import type { WorkflowStage } from "@/content/home";
import { MockWindow } from "./MockWindow";
import styles from "./WorkflowDiagram.module.css";

/** Stage-specific product UI for the Capture → Measure storytelling. */
export function WorkflowDiagram({ stage }: { stage: WorkflowStage["visual"] }) {
  switch (stage) {
    case "capture":
      return <CaptureView />;
    case "understand":
      return <UnderstandView />;
    case "decide":
      return <DecideView />;
    case "automate":
      return <AutomateView />;
    case "measure":
      return <MeasureView />;
  }
}

function CaptureView() {
  const items: { icon: IconName; source: string; text: string; time: string }[] = [
    { icon: "mail", source: "sales@ inbox", text: "Request for quotation: 40 units", time: "now" },
    { icon: "globe", source: "Website form", text: "Demo request from operations lead", time: "1m" },
    { icon: "document", source: "Upload", text: "Supplier invoice INV-20931.pdf", time: "3m" },
    { icon: "webhook", source: "Shopify webhook", text: "Order #10442 flagged for review", time: "6m" },
  ];
  return (
    <MockWindow title="Unified intake" toolbar={<Badge variant="status" tone="brand" dot>Listening</Badge>}>
      <ul className={styles.inbox}>
        {items.map((item, i) => (
          <li key={item.text} style={{ "--i": i } as React.CSSProperties}>
            <span className={styles.srcIcon}>
              <Icon name={item.icon} />
            </span>
            <span className={styles.inboxText}>
              <small>{item.source}</small>
              <strong>{item.text}</strong>
            </span>
            <time>{item.time}</time>
          </li>
        ))}
      </ul>
    </MockWindow>
  );
}

function UnderstandView() {
  return (
    <MockWindow title="ai.extract(request)" toolbar={<Badge variant="tag">LLM · UK data region</Badge>}>
      <pre className={styles.code}>
        <code>
          <span className={styles.ln}>1</span>
          {"{"}
          {"\n"}
          <span className={styles.ln}>2</span>
          {"  "}
          <span className={styles.key}>&quot;intent&quot;</span>: <span className={styles.str}>&quot;quotation_request&quot;</span>,{"\n"}
          <span className={styles.ln}>3</span>
          {"  "}
          <span className={styles.key}>&quot;customer&quot;</span>: <span className={styles.str}>&quot;ACME Ltd&quot;</span>,{"\n"}
          <span className={styles.ln}>4</span>
          {"  "}
          <span className={styles.key}>&quot;crm_match&quot;</span>: <span className={styles.str}>&quot;company/88213&quot;</span>,{"\n"}
          <span className={styles.ln}>5</span>
          {"  "}
          <span className={styles.key}>&quot;items&quot;</span>: [{"{ "}
          <span className={styles.key}>&quot;sku&quot;</span>: <span className={styles.str}>&quot;LIC-PRO&quot;</span>,{" "}
          <span className={styles.key}>&quot;qty&quot;</span>: <span className={styles.num}>40</span>
          {" }"}],{"\n"}
          <span className={styles.ln}>6</span>
          {"  "}
          <span className={styles.key}>&quot;urgency&quot;</span>: <span className={styles.str}>&quot;this_week&quot;</span>,{"\n"}
          <span className={styles.ln}>7</span>
          {"  "}
          <span className={styles.key}>&quot;confidence&quot;</span>: <span className={styles.num}>0.97</span>
          {"\n"}
          <span className={styles.ln}>8</span>
          {"}"}
          <span className={styles.caret} />
        </code>
      </pre>
    </MockWindow>
  );
}

function DecideView() {
  return (
    <MockWindow title="Decision rules · Quotations">
      <div className={styles.rules}>
        <div className={styles.rule}>
          <small>IF</small>
          <span>confidence ≥ 0.9</span>
          <Badge variant="status" tone="success">Pass</Badge>
        </div>
        <div className={styles.rule}>
          <small>AND</small>
          <span>quote value &gt; £5,000</span>
          <Badge variant="status" tone="warning">True</Badge>
        </div>
        <div className={styles.branches}>
          <div className={`${styles.branch} ${styles.branchActive}`}>
            <Icon name="hr" />
            <span>
              <strong>Route to manager</strong>
              <small>Approval in Microsoft Teams</small>
            </span>
          </div>
          <div className={styles.branch}>
            <Icon name="bolt" />
            <span>
              <strong>Auto-send</strong>
              <small>Below threshold</small>
            </span>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

function AutomateView() {
  const actions = [
    { system: "HubSpot", action: "Deal created · stage: Quote sent" },
    { system: "Quote engine", action: "Q-2291.pdf generated from template" },
    { system: "Outlook", action: "Quote emailed to buyer@acme.co.uk" },
    { system: "ERP", action: "Provisional order reserved" },
    { system: "Teams", action: "Account manager notified" },
  ];
  return (
    <MockWindow title="Run #4821 · actions" toolbar={<Badge variant="status" tone="success">5 / 5 complete</Badge>}>
      <ul className={styles.actions}>
        {actions.map((a, i) => (
          <li key={a.system} style={{ "--i": i } as React.CSSProperties}>
            <span className={styles.tick}>
              <Icon name="check" />
            </span>
            <strong>{a.system}</strong>
            <span>{a.action}</span>
          </li>
        ))}
      </ul>
    </MockWindow>
  );
}

function MeasureView() {
  const rows = [
    { name: "Lead → Quote", runs: "2,140", status: "Healthy" },
    { name: "Invoice processing", runs: "3,912", status: "Healthy" },
    { name: "Support triage", runs: "6,354", status: "Review" },
  ];
  return (
    <MockWindow title="Automation performance" toolbar={<Badge variant="tag">Last 30 days</Badge>}>
      <div className={styles.measure}>
        <div className={styles.ring}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="48" className={styles.ringTrack} />
            <circle cx="60" cy="60" r="48" className={styles.ringValue} />
          </svg>
          <span>
            <strong>96%</strong>
            <small>straight-through</small>
          </span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Workflow</th>
              <th>Runs</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td>{r.runs}</td>
                <td>
                  <Badge variant="status" tone={r.status === "Healthy" ? "success" : "warning"}>
                    {r.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MockWindow>
  );
}
