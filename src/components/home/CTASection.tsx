import { cta } from "@/content/home";
import { Button } from "@/components/common/Button";
import { GradientText } from "@/components/common/GradientText";
import { Reveal } from "@/components/common/Reveal";
import { Container } from "@/components/layout/Container";
import styles from "./CTASection.module.css";

export function CTASection() {
  return (
    <section id="contact" className={styles.cta} aria-labelledby="cta-title">
      <div className={styles.floor} aria-hidden="true" />
      <Container>
        <Reveal className={styles.inner}>
          <h2 id="cta-title" className={styles.title}>
            <span className={styles.lead}>{cta.heading}</span> <GradientText>{cta.highlight}</GradientText>
          </h2>
          <p className={styles.body}>{cta.body}</p>
          <div className={styles.actions}>
            <Button href={cta.primary.href} size="lg">
              {cta.primary.label}
            </Button>
            <Button href={cta.secondary.href} variant="secondary" size="lg" arrow={false}>
              {cta.secondary.label}
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
