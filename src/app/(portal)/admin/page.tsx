import type { Metadata } from "next";
import { moneyForSnapshot } from "@/lib/currency/money";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/common/Icon";
import { solutionById } from "@/content/solutions";
import { isAdmin } from "@/lib/admin/auth";
import { listEnquiries, storeAvailable, type Enquiry, type EnquiryStatus } from "@/lib/enquiries/store";
import { gbp } from "@/lib/plan/format";
import { AdminFrame } from "@/components/portal/Chrome";
import { StatusPill, formatDate, initials, needsReply, statusLabels } from "@/components/portal/EnquiryView";
import styles from "@/components/portal/Admin.module.css";
import portal from "@/components/portal/Portal.module.css";

export const metadata: Metadata = { title: "Enquiry inbox" };
export const dynamic = "force-dynamic";

type Filter = EnquiryStatus | "all" | "reply";
const FILTERS: Filter[] = ["all", "reply", "new", "in_progress", "awaiting_customer", "closed"];
const filterLabel = (f: Filter) => (f === "all" ? "All" : f === "reply" ? "Needs reply" : statusLabels[f]);
const matches = (e: Enquiry, f: Filter) => (f === "all" ? true : f === "reply" ? needsReply(e) : e.status === f);

const searchable = (e: Enquiry) =>
  [e.ref, e.answers.name, e.answers.company, e.answers.email, e.summary?.title, solutionById(e.solution)?.title]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const PAGE_SIZE = 10;

const hrefFor = (f: Filter, q: string, page = 1) => {
  const params = new URLSearchParams();
  if (f !== "all") params.set("status", f);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const s = params.toString();
  return s ? `/admin?${s}` : "/admin";
};

export default async function AdminInboxPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { status = "all", q: rawQ = "", page: rawPage } = await searchParams;
  const filter = ((FILTERS as string[]).includes(status) ? status : "all") as Filter;
  const q = rawQ.trim().slice(0, 80);

  const all = await listEnquiries();
  const searched = q ? all.filter((e) => searchable(e).includes(q.toLowerCase())) : all;
  const filtered = searched.filter((e) => matches(e, filter));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1));
  const enquiries = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, filtered.length);

  const open = all.filter((e) => e.status !== "closed");
  const replyCount = all.filter(needsReply).length;
  const newCount = all.filter((e) => e.status === "new").length;
  const consultations = open.filter((e) => e.consultation).length;
  const pipeline = open.reduce((sum, e) => sum + (e.plan?.estimate?.recommended ?? e.plan?.build ?? 0), 0);

  return (
    <AdminFrame active="inbox">
      <div className={styles.page}>
        <div className={styles.head}>
          <div>
            <p className={portal.kicker}>Admin</p>
            <h1>Enquiry inbox</h1>
            <p className={styles.lead}>
              {all.length} {all.length === 1 ? "enquiry" : "enquiries"}
              {replyCount > 0 ? `, ${replyCount} waiting for your reply` : ", nothing waiting for a reply"}.
            </p>
          </div>
        </div>

        {!storeAvailable() && (
          <p className={portal.warning}>
            Enquiry storage isn&apos;t configured, so new enquiries are emailed only. Connect Upstash Redis (KV) in Vercel to keep them
            here.
          </p>
        )}

        <div className={styles.stats}>
          <Link href={hrefFor("new", q)} className={`${styles.stat} ${newCount ? styles.statHighlight : ""}`}>
            New
            <strong>{newCount}</strong>
          </Link>
          <Link href={hrefFor("reply", q)} className={`${styles.stat} ${replyCount ? styles.statHighlight : ""}`}>
            Needs reply
            <strong>{replyCount}</strong>
          </Link>
          <div className={styles.stat}>
            Consultations requested
            <strong>{consultations}</strong>
          </div>
          <div className={styles.stat}>
            Open pipeline (recommended)
            <strong>{gbp(pipeline)}</strong>
          </div>
        </div>

        <div className={styles.toolbar}>
          <nav aria-label="Filter by status" className={styles.tabs}>
            {FILTERS.map((f) => (
              <Link key={f} href={hrefFor(f, q)} aria-current={f === filter ? "page" : undefined}>
                {filterLabel(f)}
                <span>{searched.filter((e) => matches(e, f)).length}</span>
              </Link>
            ))}
          </nav>
          <form role="search" action="/admin" className={styles.search}>
            {filter !== "all" && <input type="hidden" name="status" value={filter} />}
            <Icon name="search" />
            <label htmlFor="q" className="sr-only">
              Search enquiries
            </label>
            <input id="q" name="q" type="search" defaultValue={q} placeholder="Search enquiries" />
          </form>
        </div>

        {enquiries.length === 0 ? (
          <div className={styles.empty}>
            <Icon name="mail" />
            <strong>{q ? `No enquiries match "${q}"` : "Nothing here yet"}</strong>
            <span>{q ? "Try another search or clear the filter." : "New enquiries from the DotSeek Assistant appear here."}</span>
            {(q || filter !== "all") && (
              <Link href="/admin" className={styles.topLink}>
                Show all enquiries
              </Link>
            )}
          </div>
        ) : (
          <ul className={styles.list}>
            {enquiries.map((e) => {
              const solution = solutionById(e.solution);
              const estimate = e.plan?.estimate?.recommended ?? e.plan?.build;
              const waiting = needsReply(e);
              return (
                <li key={e.id}>
                  <Link href={`/admin/enquiries/${e.id}`} className={styles.item} data-unread={waiting || e.status === "new" || undefined}>
                    <span className={styles.avatar} aria-hidden="true">
                      {initials(e.answers.name)}
                    </span>
                    <span className={styles.itemMain}>
                      <span className={styles.itemTitle}>{e.summary?.title ?? `${solution?.title ?? "Enquiry"} enquiry`}</span>
                      <span className={styles.itemWho}>
                        {e.answers.name}
                        {e.answers.company ? `, ${e.answers.company}` : ""} · {e.answers.email}
                      </span>
                      <span className={styles.chips}>
                        <span className={styles.chip}>{solution?.label ?? e.solution}</span>
                        {waiting && <span className={`${styles.chip} ${styles.chipBrand}`}>Needs reply</span>}
                        {e.consultation && <span className={`${styles.chip} ${styles.chipWarn}`}>Consultation</span>}
                        {e.negotiation && <span className={styles.chip}>Price request</span>}
                        {e.reference && <span className={styles.chip}>Reference: {e.reference.host}</span>}
                        {e.offer?.eligible && <span className={styles.chip}>{e.offer.label}</span>}
                      </span>
                    </span>
                    <span className={styles.amount}>
                      {estimate ? moneyForSnapshot(e.currency).total(estimate) : "-"}
                      <small>{e.currency && e.currency.customerCurrency !== "GBP" ? `${gbp(estimate ?? 0)} base · recommended` : "recommended"}</small>
                    </span>
                    <span className={styles.itemMeta}>
                      <StatusPill status={e.status} />
                      <small>
                        {e.ref} · {formatDate(e.updatedAt)}
                      </small>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {pages > 1 && (
          <nav aria-label="Inbox pages" className={styles.pager}>
            <p className={styles.pagerInfo}>
              Showing {first === last ? first : `${first}–${last}`} of {filtered.length}
            </p>
            <div className={styles.pagerLinks}>
              {page > 1 ? (
                <Link href={hrefFor(filter, q, page - 1)} rel="prev" className={styles.pagerStep}>
                  Previous
                </Link>
              ) : (
                <span className={styles.pagerStep} aria-disabled="true">
                  Previous
                </span>
              )}
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={hrefFor(filter, q, n)} aria-current={n === page ? "page" : undefined} aria-label={`Page ${n}`}>
                  {n}
                </Link>
              ))}
              {page < pages ? (
                <Link href={hrefFor(filter, q, page + 1)} rel="next" className={styles.pagerStep}>
                  Next
                </Link>
              ) : (
                <span className={styles.pagerStep} aria-disabled="true">
                  Next
                </span>
              )}
            </div>
          </nav>
        )}
      </div>
    </AdminFrame>
  );
}
