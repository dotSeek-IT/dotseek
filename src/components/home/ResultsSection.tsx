import { results } from "@/content/home";
import { GradientText } from "@/components/common/GradientText";
import { IconCard } from "@/components/common/IconCard";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Section } from "@/components/layout/Section";
import { SpotlightGroup } from "@/components/common/SpotlightGroup";
import styles from "./ResultsSection.module.css";

/** Outcome categories: deliberately no invented percentages. */
export function ResultsSection() {
  return (
    <Section id="results" labelledBy="results-title">
      <SectionHeading
        id="results-title"
        eyebrow={results.eyebrow}
        title={
          <>
            What Automation <GradientText>Changes for Your Business</GradientText>
          </>
        }
        body={results.body}
      />
      <SpotlightGroup as="ul" className={styles.grid} role="list">
        {results.items.map((item, index) => (
          <Reveal as="li" key={item.title} index={index % 3}>
            <IconCard icon={item.icon} title={item.title} body={item.body} meta={item.metric} />
          </Reveal>
        ))}
      </SpotlightGroup>
    </Section>
  );
}
