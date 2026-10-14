import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pages } from "@/content/pages";
import { site } from "@/content/site";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Container } from "@/components/layout/Container";
import styles from "./page.module.css";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return pages.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const page = pages.find((p) => p.slug === slug);
  if (!page) return {};
  const url = `/${page.slug}`;
  return {
    title: page.seoTitle,
    description: page.description,
    alternates: { canonical: url },
    openGraph: { title: `${page.seoTitle} | ${site.name}`, description: page.description, url, images: ["/og-image.png"] },
    twitter: { title: `${page.seoTitle} | ${site.name}`, description: page.description },
    // Unfinished pages stay out of search results until published.
    robots: page.status === "draft" ? { index: false, follow: true } : undefined,
  };
}

export default async function SimplePageRoute({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const page = pages.find((p) => p.slug === slug);
  if (!page) notFound();

  return (
    <article className={styles.page}>
      <div className={`${styles.grid} bg-grid`} aria-hidden="true" />
      <Container size="narrow">
        <header className={styles.header}>
          <Badge variant="eyebrow" dot>
            {page.eyebrow}
          </Badge>
          <h1 className={styles.title}>{page.title}</h1>
          {page.updated && <p className={styles.updated}>Last updated: {page.updated}</p>}
          <p className={styles.intro}>{page.intro}</p>
        </header>

        {page.sections?.map((section) => (
          <section key={section.heading} className={styles.section}>
            <h2>{section.heading}</h2>
            {section.body?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.list && (
              <ul className={styles.list}>
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {page.status === "draft" && (
          <p className={styles.notice}>
            This page is being prepared. For any questions, email <a href={`mailto:${site.email}`}>{site.email}</a>.
          </p>
        )}

        <div className={styles.actions}>
          <Button href={site.talkCta.href}>{site.talkCta.label}</Button>
          <Button href="/" variant="secondary" arrow={false}>
            Back to home
          </Button>
        </div>
      </Container>
    </article>
  );
}
