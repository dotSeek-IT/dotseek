import { Fragment, type CSSProperties } from "react";
import { hero } from "@/content/home";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Container } from "@/components/layout/Container";
import { HeroBackdrop } from "@/components/visual/HeroBackdrop";
import { ActivityTicker } from "./ActivityTicker";
import { HeroAutomationVisual } from "./HeroAutomationVisual";
import styles from "./Hero.module.css";

/** Splits a phrase into word spans for the staggered blur-in headline reveal. */
function Words({ text, offset, className }: { text: string; offset: number; className?: string }) {
  return text.split(" ").map((word, i) => (
    <Fragment key={`${word}-${i}`}>
      <span className={[styles.word, className].filter(Boolean).join(" ")} style={{ "--w": offset + i } as CSSProperties}>
        {word}
      </span>{" "}
    </Fragment>
  ));
}

export function Hero() {
  const leadCount = hero.titleLead.split(" ").length;

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <HeroBackdrop />

      <Container className={styles.inner}>
        <div className={styles.copy}>
          <Badge variant="eyebrow" className={styles.enter} dot>
            {hero.eyebrow}
          </Badge>
          <h1 id="hero-title" className={styles.title} aria-label={`${hero.titleLead} ${hero.titleHighlight}`}>
            <span aria-hidden="true">
              <Words text={hero.titleLead} offset={0} className={styles.lead} />
              <Words text={hero.titleHighlight} offset={leadCount} className={styles.highlight} />
            </span>
          </h1>
          <p className={`${styles.body} ${styles.enter} ${styles.d2}`}>{hero.body}</p>
          <div className={`${styles.actions} ${styles.enter} ${styles.d3}`}>
            <Button href={hero.primary.href} size="lg">
              {hero.primary.label}
            </Button>
            <Button href={hero.secondary.href} variant="secondary" size="lg" arrow={false}>
              {hero.secondary.label}
            </Button>
          </div>
        </div>

        <div className={`${styles.ticker} ${styles.enter} ${styles.d4}`}>
          <ActivityTicker />
        </div>

        <HeroAutomationVisual />
      </Container>
    </section>
  );
}
