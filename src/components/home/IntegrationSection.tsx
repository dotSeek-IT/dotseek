import { integrations, systems } from "@/content/home";
import { Badge } from "@/components/common/Badge";
import { GradientText } from "@/components/common/GradientText";
import { LogoCloud } from "@/components/common/LogoCloud";
import { Reveal } from "@/components/common/Reveal";
import { Container } from "@/components/layout/Container";
import { IntegrationNode } from "@/components/visual/IntegrationNode";
import styles from "./IntegrationSection.module.css";

const half = Math.ceil(integrations.items.length / 2);

/** "AI + your existing systems": DotSeek's core differentiator. */
export function IntegrationSection() {
  return (
    <section id="systems" className={styles.section} aria-labelledby="systems-title">
      <Container>
        <Reveal className={styles.header}>
          <div className={styles.headLeft}>
            <Badge variant="eyebrow" dot>
              {systems.eyebrow}
            </Badge>
            <h2 id="systems-title" className={styles.title}>
              <span className={styles.titleGradient}>AI That Works With Your Business,</span>{" "}
              <GradientText>Not Against It</GradientText>
            </h2>
          </div>
          <p className={styles.body}>{systems.body}</p>
        </Reveal>
      </Container>

      <Reveal className={styles.rows} variant="scale">
        <LogoCloud items={integrations.items.slice(0, half)} label="Business applications" variant="tile" speed={45} />
        <IntegrationNode />
        <LogoCloud items={integrations.items.slice(half)} label="Data and cloud platforms" variant="tile" speed={45} reverse />
      </Reveal>

      <Container>
        <ul className={styles.points} role="list">
          {systems.points.map((point, index) => (
            <Reveal as="li" key={point.title} index={index}>
              <h3>{point.title}</h3>
              <p>{point.body}</p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
