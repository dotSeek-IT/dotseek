import { process } from "@/content/home";
import { GradientText } from "@/components/common/GradientText";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Section } from "@/components/layout/Section";
import styles from "./ProcessSection.module.css";

export function ProcessSection() {
  return (
    <Section id="process" tone="raised" labelledBy="process-title">
      <SectionHeading
        id="process-title"
        eyebrow={process.eyebrow}
        title={
          <>
            From First Conversation to <GradientText>Automation in Production</GradientText>
          </>
        }
        body={process.body}
      />
      <ol className={styles.steps}>
        {process.steps.map((step, index) => (
          <Reveal as="li" key={step.number} index={index} className={styles.step}>
            <span className={styles.marker} aria-hidden="true">
              {step.number}
            </span>
            <h3 className={styles.title}>
              <span className="sr-only">Step {step.number}: </span>
              {step.title}
            </h3>
            <p className={styles.body}>{step.body}</p>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
