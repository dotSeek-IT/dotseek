import { caseStudy } from "@/content/home";
import { Badge } from "@/components/common/Badge";
import { GradientText } from "@/components/common/GradientText";
import { Icon, type IconName } from "@/components/common/Icon";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Section } from "@/components/layout/Section";
import styles from "./CaseStudy.module.css";

const columns: { key: "problem" | "automation" | "outcome"; label: string; icon: IconName }[] = [
  { key: "problem", label: "Problem", icon: "clock" },
  { key: "automation", label: "Automation", icon: "workflow" },
  { key: "outcome", label: "Outcome", icon: "check" },
];

const flow = ["Email & web form", "Sales Agent", "CRM", "Quote", "Teams approval", "Invoice"];

/**
 * Case-study slot. Shows a clearly labelled illustrative engagement until a
 * real, client-approved case study is available: never fake testimonials.
 */
export function CaseStudy() {
  return (
    <Section id="case-study" labelledBy="case-title">
      <SectionHeading
        id="case-title"
        eyebrow={caseStudy.eyebrow}
        title={
          <>
            What a DotSeek <GradientText>Automation Project</GradientText> Looks Like
          </>
        }
      />
      <Reveal variant="scale">
        <article className={styles.panel}>
          <div className={styles.glow} aria-hidden="true" />
          <header className={styles.head}>
            <Badge variant="tag">{caseStudy.label}</Badge>
            <p className={styles.context}>{caseStudy.context}</p>
          </header>

          <div className={styles.columns}>
            {columns.map((column, index) => (
              <section key={column.key} className={styles.column} aria-labelledby={`case-${column.key}`}>
                <div className={styles.columnHead}>
                  <span className={styles.icon}>
                    <Icon name={column.icon} />
                  </span>
                  <h3 id={`case-${column.key}`}>{column.label}</h3>
                  {index < columns.length - 1 && <Icon name="arrow" className={styles.arrow} aria-hidden="true" />}
                </div>
                <p>{caseStudy[column.key]}</p>
              </section>
            ))}
          </div>

          <div className={styles.flow} aria-label="Automated flow">
            {flow.map((step, index) => (
              <span key={step} className={styles.flowStep}>
                <span className={styles.flowChip}>{step}</span>
                {index < flow.length - 1 && <span className={styles.flowLine} aria-hidden="true" />}
              </span>
            ))}
          </div>
        </article>
      </Reveal>
    </Section>
  );
}
