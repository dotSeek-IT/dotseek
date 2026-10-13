import type { Agent } from "@/content/home";
import { Icon } from "@/components/common/Icon";
import styles from "./AgentCard.module.css";

/** An AI agent as a connected business capability: role, tasks, systems. */
export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <article className={`${styles.card} ds-spotlight`}>
      <header className={styles.head}>
        <span className={styles.icon}>
          <Icon name={agent.icon} />
        </span>
        <span className={styles.status}>
          <i aria-hidden="true" /> Active in workflow
        </span>
      </header>
      <h3 className={styles.name}>{agent.name}</h3>
      <p className={styles.role}>{agent.role}</p>
      <ul className={styles.tasks}>
        {agent.tasks.map((task) => (
          <li key={task}>
            <Icon name="check" />
            {task}
          </li>
        ))}
      </ul>
      <footer className={styles.systems}>
        <span className="sr-only">Connected systems:</span>
        {agent.systems.map((system) => (
          <span key={system} className={styles.system}>
            {system}
          </span>
        ))}
      </footer>
    </article>
  );
}
