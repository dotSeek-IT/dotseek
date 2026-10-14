import { solutions } from "@/content/home";
import { GradientText } from "@/components/common/GradientText";
import { Icon, type IconName } from "@/components/common/Icon";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Section } from "@/components/layout/Section";
import { SpotlightGroup } from "@/components/common/SpotlightGroup";
import styles from "./BusinessSolutions.module.css";

const icons: IconName[] = ["sales", "support", "ops", "finance", "chart"];

export function BusinessSolutions() {
  return (
    <Section id="departments" labelledBy="departments-title">
      <SectionHeading
        id="departments-title"
        eyebrow={solutions.eyebrow}
        title={
          <>
            Automation for <GradientText>Every Department</GradientText>
          </>
        }
        body={solutions.body}
      />

      <SpotlightGroup as="ul" className={styles.grid} role="list">
        {solutions.items.map((item, index) => (
          <Reveal as="li" key={item.title} index={index % 3} className={index > 2 ? styles.wide : undefined}>
            <article className={`${styles.card} ds-spotlight`}>
              <div className={styles.cardHead}>
                <span className={styles.icon}>
                  <Icon name={icons[index]} />
                </span>
                <span className={styles.index}>0{index + 1}</span>
              </div>
              <h3 className={styles.title}>{item.title}</h3>
              <p className={styles.summary}>{item.summary}</p>
              <ul className={styles.list}>
                {item.items.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </SpotlightGroup>

      <Reveal className={styles.industries}>
        <h3 id="industries" className={styles.industriesTitle}>
          Industries we automate for
        </h3>
        <ul className={styles.industryList} role="list">
          {solutions.industries.map((industry) => (
            <li key={industry}>{industry}</li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
