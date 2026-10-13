import { integrations } from "@/content/home";
import { LogoCloud } from "@/components/common/LogoCloud";
import { Container } from "@/components/layout/Container";
import styles from "./TrustedCompanies.module.css";

/** Integration strip: systems DotSeek connects (not client endorsements). */
export function TrustedCompanies() {
  return (
    <section id="integrations" className={styles.section} aria-labelledby="integrations-title">
      <Container>
        <h2 id="integrations-title" className={styles.title}>
          {integrations.heading}
        </h2>
      </Container>
      <LogoCloud items={integrations.items} label="Systems DotSeek integrates with" speed={55} />
    </section>
  );
}
