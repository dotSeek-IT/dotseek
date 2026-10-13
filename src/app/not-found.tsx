import { Button } from "@/components/common/Button";
import { Container } from "@/components/layout/Container";

export default function NotFound() {
  return (
    <Container size="narrow">
      <div style={{ paddingBlock: "calc(var(--ds-header-height) + var(--ds-space-20)) var(--ds-section-space)", display: "grid", gap: "var(--ds-space-5)", justifyItems: "start" }}>
        <h1 style={{ fontSize: "var(--ds-text-h1)", fontWeight: "var(--ds-weight-regular)" }}>Page not found</h1>
        <p style={{ color: "var(--ds-color-text-muted)" }}>The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Button href="/">Back to home</Button>
      </div>
    </Container>
  );
}
