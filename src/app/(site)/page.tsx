import { Hero } from "@/components/home/Hero";
import { TrustedCompanies } from "@/components/home/TrustedCompanies";
import { ManifestoSection } from "@/components/home/ManifestoSection";
import { SolutionsCatalogue } from "@/components/home/SolutionsCatalogue";
import { PocketMoneyBand } from "@/components/home/PocketMoneyBand";
import { AutomationCapabilities } from "@/components/home/AutomationCapabilities";
import { WorkflowSection } from "@/components/home/WorkflowSection";
import { AIAgentsSection } from "@/components/home/AIAgentsSection";
import { BusinessSolutions } from "@/components/home/BusinessSolutions";
import { IntegrationSection } from "@/components/home/IntegrationSection";
import { ProcessSection } from "@/components/home/ProcessSection";
import { ResultsSection } from "@/components/home/ResultsSection";
import { CaseStudy } from "@/components/home/CaseStudy";
import { FAQSection } from "@/components/home/FAQSection";
import { CTASection } from "@/components/home/CTASection";
import { ScrollFlowLine } from "@/components/visual/ScrollFlowLine";
import { site } from "@/content/site";
import styles from "./page.module.css";

// Homepage as a WebPage with the DotSeek banner as its main image, so search results use
// the current banner (the logo comes from the Organization data and the favicon).
const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${site.url}/#webpage`,
  url: `${site.url}/`,
  name: site.seoTitle,
  description: site.seoDescription,
  inLanguage: "en-GB",
  isPartOf: { "@id": `${site.url}/#website` },
  about: { "@id": `${site.url}/#organization` },
  primaryImageOfPage: { "@type": "ImageObject", url: `${site.url}/og-image.png`, width: 1200, height: 630 },
};

export default function HomePage() {
  return (
    <div className={styles.flow}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <ScrollFlowLine />
      <Hero />
      <TrustedCompanies />
      <PocketMoneyBand />
      <ManifestoSection />
      <SolutionsCatalogue />
      <AutomationCapabilities />
      <WorkflowSection />
      <AIAgentsSection />
      <BusinessSolutions />
      <IntegrationSection />
      <ProcessSection />
      <ResultsSection />
      <CaseStudy />
      <FAQSection />
      <CTASection />
    </div>
  );
}
