import { agents } from "@/content/home";
import { Badge } from "@/components/common/Badge";
import { GradientText } from "@/components/common/GradientText";
import { Icon } from "@/components/common/Icon";
import { Reveal } from "@/components/common/Reveal";
import { Section } from "@/components/layout/Section";
import { AgentCard } from "@/components/visual/AgentCard";
import { SpotlightGroup } from "@/components/common/SpotlightGroup";
import styles from "./AIAgentsSection.module.css";

export function AIAgentsSection() {
  return (
    <Section id="agents" labelledBy="agents-title">
      <Reveal className={styles.header}>
        <div className={styles.headLeft}>
          <Badge variant="eyebrow" dot>
            {agents.eyebrow}
          </Badge>
          <h2 id="agents-title" className={styles.title}>
            <span className={styles.titleGradient}>AI Agents That Work</span> <GradientText>Across Your Business</GradientText>
          </h2>
        </div>
        <div className={styles.headRight}>
          <p>{agents.body}</p>
          <ul className={styles.guardrails} aria-label="Agent guardrails">
            {agents.guardrails.map((item) => (
              <li key={item}>
                <Icon name="shield" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <p className={styles.swipeHint} aria-hidden="true">
        Swipe to explore all six agents <Icon name="arrow" />
      </p>
      <SpotlightGroup as="ul" className={styles.grid} role="list">
        {agents.items.map((agent, index) => (
          <Reveal as="li" key={agent.name} index={index % 3}>
            <AgentCard agent={agent} />
          </Reveal>
        ))}
      </SpotlightGroup>
    </Section>
  );
}
