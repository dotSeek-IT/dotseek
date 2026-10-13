import type { Metadata } from "next";
import Link from "next/link";
import { contact } from "@/content/contact";
import { site, socialLinks } from "@/content/site";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { GradientText } from "@/components/common/GradientText";
import { Icon } from "@/components/common/Icon";
import { Reveal } from "@/components/common/Reveal";
import { SpotlightGroup } from "@/components/common/SpotlightGroup";
import { StartEnquiryButton } from "@/components/assistant/StartEnquiryButton";
import { Container } from "@/components/layout/Container";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: contact.seoTitle,
  description: contact.description,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `${contact.seoTitle} | ${site.name}`,
    description: contact.description,
    url: "/contact",
    images: ["/og-image.png"],
  },
  twitter: { title: `${contact.seoTitle} | ${site.name}`, description: contact.description },
};

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  url: `${site.url}/contact`,
  name: contact.seoTitle,
  mainEntity: {
    "@type": "Organization",
    "@id": `${site.url}/#organization`,
    name: site.name,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: site.email,
      telephone: site.phone,
      areaServed: "GB",
      availableLanguage: "English",
    },
  },
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }} />
      <div className={`${styles.grid} bg-grid`} aria-hidden="true" />

      <Container>
        <header className={styles.header}>
          <Badge variant="eyebrow" dot>
            {contact.eyebrow}
          </Badge>
          <h1 className={styles.title}>
            <span className={styles.lead}>Let&apos;s Talk About What You</span> <GradientText>Want to Automate</GradientText>
          </h1>
          <p className={styles.intro}>{contact.intro}</p>
        </header>

        <div className={styles.layout}>
          <SpotlightGroup as="ul" className={styles.methods} role="list">
            {contact.methods.map((method, index) => (
              <Reveal as="li" key={method.label} index={index}>
                <article className={`${styles.method} ds-spotlight`}>
                  <span className={styles.methodIcon}>
                    <Icon name={method.icon} />
                  </span>
                  <div className={styles.methodText}>
                    <h2 className={styles.methodLabel}>{method.label}</h2>
                    {method.href ? (
                      <a href={method.href} className={styles.methodValue}>
                        {method.value}
                      </a>
                    ) : (
                      <p className={styles.methodValue}>{method.value}</p>
                    )}
                    <p className={styles.methodDetail}>{method.detail}</p>
                  </div>
                  {method.href && method.action && (
                    <a href={method.href} className={styles.methodAction} aria-label={`${method.action}: ${method.value}`}>
                      <Icon name="arrow" />
                    </a>
                  )}
                </article>
              </Reveal>
            ))}
            <Reveal as="li" index={3}>
              <div className={styles.social}>
                <span>Follow DotSeek</span>
                <ul role="list" className={styles.socialList}>
                  {socialLinks.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`${site.name} on ${link.label}`}>
                        <Icon name={link.icon} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </SpotlightGroup>

          <Reveal variant="scale" className={styles.enquiry}>
            <div className={styles.enquiryGlow} aria-hidden="true" />
            <h2 className={styles.enquiryTitle}>{contact.enquiry.heading}</h2>
            <p className={styles.enquiryBody}>{contact.enquiry.body}</p>
            <ul className={styles.checklist}>
              {contact.enquiry.checklist.map((item) => (
                <li key={item}>
                  <Icon name="check" />
                  {item}
                </li>
              ))}
            </ul>
            <div className={styles.enquiryButtons}>
              <StartEnquiryButton />
              <Button href={contact.enquiry.href} size="lg" variant="secondary" arrow={false}>
                {contact.enquiry.action}
              </Button>
            </div>
            <p className={styles.enquiryNote}>
              Answer a few quick questions in the DotSeek Assistant, or open your email app with a ready-to-fill template addressed to {site.email}. See our{" "}
              <Link href="/privacy">Privacy policy</Link> for how we handle your details.
            </p>
          </Reveal>
        </div>

        <section className={styles.next} aria-labelledby="next-title">
          <h2 id="next-title" className={styles.nextTitle}>
            {contact.next.heading}
          </h2>
          <ol className={styles.steps}>
            {contact.next.steps.map((step, index) => (
              <Reveal as="li" key={step.number} index={index} className={styles.step}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {step.number}
                </span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </Reveal>
            ))}
          </ol>
        </section>
      </Container>
    </div>
  );
}
