import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { solutionById } from "@/content/solutions";
import { isAdmin } from "@/lib/admin/auth";
import { listEnquiries, storeAvailable, type EnquiryStatus } from "@/lib/enquiries/store";
import { StatusPill, formatDate, statusLabels } from "@/components/portal/EnquiryView";
import styles from "@/components/portal/Portal.module.css";
import { logoutAction } from "../actions";

export const metadata: Metadata = { title: "Enquiry inbox" };
export const dynamic = "force-dynamic";

const FILTERS: (EnquiryStatus | "all")[] = ["all", "new", "in_progress", "awaiting_customer", "closed"];

export default async function AdminInboxPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { status = "all" } = await searchParams;
  const filter = (FILTERS as string[]).includes(status) ? status : "all";
  const all = await listEnquiries();
  const enquiries = filter === "all" ? all : all.filter((e) => e.status === filter);

  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Enquiry inbox</h1>
          <p className={styles.muted}>
            {all.length} {all.length === 1 ? "enquiry" : "enquiries"}
          </p>
        </div>
        <div className={styles.headActions}>
          <Link href="/admin/offers" className={styles.linkButton}>
            Offers
          </Link>
          <form action={logoutAction}>
            <button type="submit" className={styles.linkButton}>
              Sign out
            </button>
          </form>
        </div>
      </div>

      {!storeAvailable() && (
        <p className={styles.warning}>
          Enquiry storage isn&apos;t configured, so new enquiries are emailed only. Connect Upstash Redis (KV) in Vercel to
          keep them here.
        </p>
      )}

      <nav aria-label="Filter by status" className={styles.filters}>
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin" : `/admin?status=${f}`}
            className={styles.filter}
            aria-current={f === filter ? "page" : undefined}
          >
            {f === "all" ? "All" : statusLabels[f]}
            <span>{f === "all" ? all.length : all.filter((e) => e.status === f).length}</span>
          </Link>
        ))}
      </nav>

      {enquiries.length === 0 ? (
        <p className={styles.empty}>No enquiries here yet.</p>
      ) : (
        <ul className={styles.inbox}>
          {enquiries.map((e) => {
            const last = e.thread[e.thread.length - 1];
            return (
              <li key={e.id}>
                <Link href={`/admin/enquiries/${e.id}`} className={styles.row}>
                  <span className={styles.rowMain}>
                    <strong>{e.summary?.title ?? `${solutionById(e.solution)?.title ?? "Enquiry"} enquiry`}</strong>
                    <span className={styles.muted}>
                      {e.answers.name}
                      {e.answers.company ? `, ${e.answers.company}` : ""} · {solutionById(e.solution)?.label ?? e.solution}
                      {e.plan ? ` · est. £${e.plan.build.toLocaleString("en-GB")}` : ""}
                      {e.consultation ? " · consultation requested" : ""}
                      {last ? ` · last message from ${last.from === "team" ? "team" : "customer"}` : ""}
                    </span>
                  </span>
                  <span className={styles.rowMeta}>
                    <StatusPill status={e.status} />
                    <span className={styles.muted}>
                      {e.ref} · {formatDate(e.updatedAt)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
