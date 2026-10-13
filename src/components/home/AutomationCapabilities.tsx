import type { ReactNode } from "react";
import { capabilities } from "@/content/home";
import { GradientText } from "@/components/common/GradientText";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Section } from "@/components/layout/Section";
import {
  AgentChatVisual,
  CustomerVisual,
  DocumentVisual,
  InsightsVisual,
  IntegrationVisual,
  MiniWorkflowVisual,
} from "@/components/visual/CapabilityVisuals";
import { AutomationCard } from "@/components/visual/AutomationCard";
import { SpotlightGroup } from "@/components/common/SpotlightGroup";
import styles from "./AutomationCapabilities.module.css";

type Key = keyof typeof capabilities.items;

const layout: { key: Key; visual: ReactNode; className: string; layout?: "stacked" | "split" }[] = [
  { key: "agents", visual: <AgentChatVisual />, className: styles.agents },
  { key: "workflow", visual: <MiniWorkflowVisual />, className: styles.workflow },
  { key: "documents", visual: <DocumentVisual />, className: styles.third },
  { key: "customer", visual: <CustomerVisual />, className: styles.third },
  { key: "integration", visual: <IntegrationVisual />, className: styles.third },
  { key: "insights", visual: <InsightsVisual />, className: styles.insights, layout: "split" },
];

export function AutomationCapabilities() {
  return (
    <Section id="capabilities" labelledBy="capabilities-title">
      <SectionHeading
        id="capabilities-title"
        eyebrow={capabilities.eyebrow}
        title={
          <>
            Everything You Need to Automate <GradientText>Real Business Work</GradientText>
          </>
        }
        body={capabilities.body}
      />
      <SpotlightGroup className={styles.bento}>
        {layout.map((item, index) => (
          <Reveal key={item.key} className={item.className} index={index % 3}>
            <AutomationCard
              title={capabilities.items[item.key].title}
              body={capabilities.items[item.key].body}
              visual={item.visual}
              layout={item.layout}
            />
          </Reveal>
        ))}
      </SpotlightGroup>
    </Section>
  );
}
