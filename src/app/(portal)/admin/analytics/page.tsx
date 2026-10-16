import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/common/Icon";
import { AnalyticsDashboard } from "@/components/analytics/Dashboard";
import { AdminFrame } from "@/components/portal/Chrome";
import { isAdmin } from "@/lib/admin/auth";
import { buildDashboard } from "@/lib/analytics/engine";
import { parseQuery } from "@/lib/analytics/query";
import styles from "@/components/portal/Admin.module.css";
import portal from "@/components/portal/Portal.module.css";

export const metadata: Metadata = { title: "Analytics", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Admin analytics: one connected dashboard (shared filters, linked highlighting).
 * The first view renders on the server from the URL; the dashboard then updates
 * itself through /api/admin/analytics without reloading the page.
 */
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const sp = await searchParams;
  const query = parseQuery((k) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  });
  const initial = await buildDashboard(query.filters, query.display);

  return (
    <AdminFrame active="analytics">
      <div className={styles.page}>
        <div className={styles.backRow}>
          <Link href="/admin" className={styles.backLink}>
            <Icon name="arrow" />
            Back to inbox
          </Link>
        </div>
        <div className={styles.head}>
          <div>
            <p className={portal.kicker}>Admin</p>
            <h1>Analytics</h1>
            <p className={styles.lead}>
              Where visitors come from, how they move through the chat and which quotes become business. Every chart shares the filters: click
              a country, source or service to focus the whole page. Visits are counted anonymously on our own server.
            </p>
          </div>
        </div>
        <AnalyticsDashboard initial={initial} initialQuery={query} />
      </div>
    </AdminFrame>
  );
}
