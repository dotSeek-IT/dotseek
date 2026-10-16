import { pocketBand } from "@/content/pricing";
import { GradientText } from "@/components/common/GradientText";
import { Reveal } from "@/components/common/Reveal";
import { Container } from "@/components/layout/Container";
import { StartEnquiryButton } from "@/components/assistant/StartEnquiryButton";
import styles from "./PocketMoneyBand.module.css";

/** Eye-catching "pocket money" starting point: a basic website, growing into portals, apps and AI. */
export function PocketMoneyBand() {
  return (
    <section id="start" className={styles.section} aria-labelledby="start-title">
      <Container>
        <Reveal variant="scale">
          <div className={styles.band}>
            <div className={styles.copy}>
              <p className={styles.kicker}>{pocketBand.kicker}</p>
              <h2 id="start-title" className={styles.heading}>
                Big plans. <GradientText>Start with pocket money.</GradientText>
              </h2>
              <p className={styles.body}>{pocketBand.body}</p>
              <ol className={styles.path} aria-label="Grow step by step">
                {pocketBand.path.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
            <div className={styles.actions}>
              <StartEnquiryButton size="md">{pocketBand.primary}</StartEnquiryButton>
              <StartEnquiryButton solution="reference" variant="secondary" size="md">
                {pocketBand.secondary}
              </StartEnquiryButton>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
