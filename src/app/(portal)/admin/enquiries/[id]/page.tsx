import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { solutionById } from "@/content/solutions";
import { isAdmin } from "@/lib/admin/auth";
import { getEnquiry, type EnquiryStatus } from "@/lib/enquiries/store";
import { AdminFrame } from "@/components/portal/Chrome";
import { EnquiryDetails, StatusPill, Thread, formatDate, initials, needsReply, statusLabels } from "@/components/portal/EnquiryView";
import { SubmitButton } from "@/components/portal/SubmitButton";
import styles from "@/components/portal/Admin.module.css";
import portal from "@/components/portal/Portal.module.css";
import { outcomeAction, statusAction, teamReplyAction } from "../../../actions";

export const metadata: Metadata = { title: "Enquiry" };
export const dynamic = "force-dynamic";

export default async function AdminEnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  const enquiry = await getEnquiry(id);
  if (!enquiry) notFound();
  const solution = solutionById(enquiry.solution);
  const { answers } = enquiry;

  return (
    <AdminFrame active="inbox">
      <div className={styles.page}>
        <div className={styles.backRow}>
          <Link href="/admin" className={styles.backLink}>
            <Icon name="arrow" />
            Back to inbox
          </Link>
          <nav aria-label="Breadcrumb" className={styles.crumbs}>
            <Link href="/admin">Inbox</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{enquiry.ref}</span>
          </nav>
        </div>

        <section className={styles.profile} aria-labelledby="enquiry-title">
          <span className={`${styles.avatar} ${styles.avatarLg}`} aria-hidden="true">
            {initials(answers.name)}
          </span>
          <div>
            <div className={styles.chips}>
              <StatusPill status={enquiry.status} />
              <span className={styles.chip}>{solution?.label ?? enquiry.solution}</span>
              {needsReply(enquiry) && <span className={`${styles.chip} ${styles.chipBrand}`}>Needs reply</span>}
              {enquiry.consultation && <span className={`${styles.chip} ${styles.chipWarn}`}>Consultation requested</span>}
              {enquiry.outcome === "accepted" && <span className={`${styles.chip} ${styles.chipSuccess}`}>Quote accepted</span>}
              {enquiry.outcome === "declined" && <span className={styles.chip}>Quote declined</span>}
            </div>
            <h1 id="enquiry-title">{enquiry.summary?.title ?? `${solution?.title ?? "Project"} enquiry`}</h1>
            <div className={styles.contact}>
              <span>
                <Icon name="user" />
                {answers.name}
                {answers.company ? `, ${answers.company}` : ""}
              </span>
              <a href={`mailto:${answers.email}?subject=${encodeURIComponent(`Your DotSeek enquiry (${enquiry.ref})`)}`}>
                <Icon name="mail" />
                {answers.email}
              </a>
              {answers.phone ? (
                <a href={`tel:${answers.phone.replace(/\s/g, "")}`}>
                  <Icon name="phone" />
                  {answers.phone}
                </a>
              ) : null}
              <span>
                <Icon name="clock" />
                {enquiry.ref} · received {formatDate(enquiry.createdAt)}
              </span>
            </div>
          </div>
          <div className={styles.profileActions}>
            <form action={statusAction} className={styles.statusForm}>
              <input type="hidden" name="id" value={enquiry.id} />
              <label htmlFor="status" className="sr-only">
                Status
              </label>
              <select key={enquiry.status} id="status" name="status" defaultValue={enquiry.status} className={styles.select}>
                {(Object.keys(statusLabels) as EnquiryStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ))}
              </select>
              <SubmitButton pendingText="Saving…" variant="secondary" size="sm">
                Update status
              </SubmitButton>
            </form>
            <form action={outcomeAction} className={styles.statusForm}>
              <input type="hidden" name="id" value={enquiry.id} />
              <label htmlFor="outcome" className="sr-only">
                Quote outcome
              </label>
              <select key={enquiry.outcome ?? "awaiting"} id="outcome" name="outcome" defaultValue={enquiry.outcome ?? ""} className={styles.select}>
                <option value="">Awaiting decision</option>
                <option value="accepted">Quote accepted</option>
                <option value="declined">Quote declined</option>
              </select>
              <SubmitButton pendingText="Saving…" variant="secondary" size="sm">
                Save outcome
              </SubmitButton>
            </form>
            <div className={styles.actionRow}>
              <a href={`/enquiry/${enquiry.token}`} target="_blank" rel="noopener" className={styles.topLink}>
                <Icon name="external" />
                Customer&apos;s page
              </a>
            </div>
          </div>
        </section>

        <div className={portal.split}>
          <EnquiryDetails enquiry={enquiry} showTranscript />
          <div className={`${portal.stack} ${styles.sticky}`}>
            <Thread enquiry={enquiry} viewer="team" />
            {enquiry.status === "closed" ? (
              <div className={portal.card}>
                <p>This enquiry is closed. Change the status to reply again.</p>
                <Button href={`mailto:${answers.email}`} variant="secondary" size="sm" arrow={false} icon="mail">
                  Email {answers.name}
                </Button>
              </div>
            ) : (
              <form action={teamReplyAction} className={`${portal.card} ${portal.form}`}>
                <input type="hidden" name="id" value={enquiry.id} />
                <h2 className={portal.cardTitle}>Reply to {answers.name}</h2>
                <label htmlFor="author" className={portal.label}>
                  Your name (shown to the customer)
                </label>
                <input id="author" name="author" className={portal.input} placeholder="DotSeek team" maxLength={80} />
                <label htmlFor="body" className={portal.label}>
                  Message
                </label>
                <textarea id="body" name="body" required rows={6} maxLength={5000} className={portal.input} />
                <p className={portal.note}>
                  Sent by email with a link back to this conversation. The status changes to &ldquo;Awaiting customer&rdquo;.
                </p>
                <SubmitButton pendingText="Sending…">Send reply</SubmitButton>
              </form>
            )}
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}
