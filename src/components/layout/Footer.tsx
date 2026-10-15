import Link from "next/link";
import { footerColumns, site, socialLinks } from "@/content/site";
import { Button } from "@/components/common/Button";
import { StartEnquiryButton } from "@/components/assistant/StartEnquiryButton";
import { Icon } from "@/components/common/Icon";
import { Logo } from "@/components/common/Logo";
import { Container } from "./Container";
import styles from "./Footer.module.css";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.strip}>
          <div>
            <h2 className={styles.stripTitle}>Have a process that should run itself?</h2>
            <p className={styles.stripBody}>Tell us about it and we&apos;ll reply with how DotSeek would automate it.</p>
          </div>
          <div className={styles.stripActions}>
            <Button href={`mailto:${site.email}`} size="md">
              Email our team
            </Button>
            <StartEnquiryButton variant="secondary" size="md">
              Start an enquiry
            </StartEnquiryButton>
          </div>
        </div>

        <div className={styles.top}>
          <div className={styles.brand}>
            <Logo />
            <p className={styles.summary}>{site.description}</p>
            <ul role="list" className={styles.contact}>
              <li>
                <Icon name="mail" />
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
              <li>
                <Icon name="location" />
                <span>{site.location}</span>
              </li>
            </ul>
          </div>

          <nav aria-label="Footer" className={styles.columns}>
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h2 className={styles.columnTitle}>{column.title}</h2>
                <ul role="list" className={styles.links}>
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className={styles.bottom}>
          <p>
            © {year} {site.name}. {site.category}.
          </p>
          <ul role="list" className={styles.social}>
            {socialLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  {...(link.href === "#" ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                  aria-label={`${site.name} on ${link.label}`}
                >
                  <Icon name={link.icon} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
      <div className={styles.wordmark} aria-hidden="true">
        DotSeek
      </div>
    </footer>
  );
}
