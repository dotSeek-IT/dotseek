import { solutionCatalogue, solutionsSection } from "@/content/solutions";
import { GradientText } from "@/components/common/GradientText";
import { Icon } from "@/components/common/Icon";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { SpotlightGroup } from "@/components/common/SpotlightGroup";
import { Section } from "@/components/layout/Section";
import { StartEnquiryButton } from "@/components/assistant/StartEnquiryButton";
import styles from "./SolutionsCatalogue.module.css";

/**
 * The full DotSeek platform: every solution type, each starting a tailored
 * enquiry in the AI consultant, plus a "not sure what you need?" entry.
 */
export function SolutionsCatalogue() {
  return (
    <Section id="solutions" labelledBy="solutions-title">
      <SectionHeading
        id="solutions-title"
        eyebrow={solutionsSection.eyebrow}
        title={
          <>
            Digital and AI Solutions <GradientText>for Any Business</GradientText>
          </>
        }
        body={solutionsSection.body}
      />

      <SpotlightGroup as="ul" className={styles.grid} role="list">
        {solutionCatalogue.map((solution, index) => (
          <Reveal as="li" key={solution.id} index={index % 3} className={index === 0 ? styles.featured : undefined}>
            <article className={`${styles.card} ds-spotlight`}>
              <div className={styles.cardHead}>
                <span className={styles.icon}>
                  <Icon name={solution.icon} />
                </span>
                {index === 0 && <span className={styles.core}>Our core</span>}
              </div>
              <h3 className={styles.title}>{solution.title}</h3>
              <p className={styles.summary}>{solution.summary}</p>
              <ul className={styles.examples} aria-label={`${solution.title} examples`}>
                {solution.examples.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
              <StartEnquiryButton solution={solution.id} variant="secondary" size="sm" className={styles.action}>
                Start enquiry
              </StartEnquiryButton>
            </article>
          </Reveal>
        ))}

        <Reveal as="li" index={1} className={styles.consultItem}>
          <article className={styles.consult}>
            <div className={styles.consultGlow} aria-hidden="true" />
            <span className={styles.icon}>
              <Icon name="sparkle" />
            </span>
            <h3 className={styles.title}>{solutionsSection.consult.title}</h3>
            <p className={styles.summary}>{solutionsSection.consult.body}</p>
            <StartEnquiryButton solution="consult" size="md" className={styles.action}>
              {solutionsSection.consult.action}
            </StartEnquiryButton>
          </article>
        </Reveal>
      </SpotlightGroup>
    </Section>
  );
}
