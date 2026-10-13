import { faqs } from "@/content/home";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Section } from "@/components/layout/Section";
import { site } from "@/content/site";
import styles from "./FAQSection.module.css";

/** Native <details> accordion: keyboard and screen-reader friendly by default. */
// FAQPage structured data: makes these answers eligible for rich results.
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.items.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export function FAQSection() {
  return (
    <Section id="faq" labelledBy="faq-title" container="narrow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <SectionHeading id="faq-title" title={faqs.heading} body={faqs.body} />
      <div className={styles.list}>
        {faqs.items.map((item, index) => (
          <Reveal key={item.q} index={index}>
            <details className={styles.item} name="faq">
              <summary className={styles.question}>
                {item.q}
                <span className={styles.toggle} aria-hidden="true">
                  <Icon name="plus" />
                </span>
              </summary>
              <p className={styles.answer}>{item.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
      <Reveal className={styles.more}>
        <h3>Still have questions?</h3>
        <p>Talk to an AI automation specialist about your processes.</p>
        <Button href={site.talkCta.href} variant="secondary" arrow={false}>
          Contact DotSeek
        </Button>
      </Reveal>
    </Section>
  );
}
