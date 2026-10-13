import { Hero } from "@/components/home/Hero";
import { TrustedCompanies } from "@/components/home/TrustedCompanies";
import { ManifestoSection } from "@/components/home/ManifestoSection";
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
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.flow}>
      <ScrollFlowLine />
      <Hero />
      <TrustedCompanies />
      <ManifestoSection />
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
