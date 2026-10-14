import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin/auth";
import { getEnquiry, type EnquiryStatus } from "@/lib/enquiries/store";
import { EnquiryDetails, StatusPill, Thread, formatDate, statusLabels } from "@/components/portal/EnquiryView";
import { SubmitButton } from "@/components/portal/SubmitButton";
import styles from "@/components/portal/Portal.module.css";
import { statusAction, teamReplyAction } from "../../../actions";

export const metadata: Metadata = { title: "Enquiry" };
export const dynamic = "force-dynamic";

export default async function AdminEnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  const enquiry = await getEnquiry(id);
  if (!enquiry) notFound();

  return (
    <div className={styles.page}>
      <Link href="/admin" className={styles.back}>
        ← Back to inbox
      </Link>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>{enquiry.summary?.title ?? "Enquiry"}</h1>
          <p className={styles.muted}>
            {enquiry.ref} · {enquiry.answers.name}
            {enquiry.answers.company ? `, ${enquiry.answers.company}` : ""} · received {formatDate(enquiry.createdAt)}
          </p>
          <p className={styles.muted}>
            <a href={`mailto:${enquiry.answers.email}`}>{enquiry.answers.email}</a>
            {enquiry.answers.phone ? (
              <>
                {" · "}
                <a href={`tel:${enquiry.answers.phone.replace(/\s/g, "")}`}>{enquiry.answers.phone}</a>
              </>
            ) : null}
          </p>
        </div>
        <form action={statusAction} className={styles.statusForm}>
          <input type="hidden" name="id" value={enquiry.id} />
          <StatusPill status={enquiry.status} />
          <label htmlFor="status" className="sr-only">
            Change status
          </label>
          <select key={enquiry.status} id="status" name="status" defaultValue={enquiry.status} className={styles.select}>
            {(Object.keys(statusLabels) as EnquiryStatus[]).map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
          <button type="submit" className={styles.linkButton}>
            Update
          </button>
        </form>
      </div>

      <div className={styles.split}>
        <EnquiryDetails enquiry={enquiry} showTranscript />
        <div className={styles.stack}>
          <Thread enquiry={enquiry} viewer="team" />
          <form action={teamReplyAction} className={`${styles.card} ${styles.form}`}>
            <input type="hidden" name="id" value={enquiry.id} />
            <label htmlFor="author" className={styles.label}>
              Your name (shown to the customer)
            </label>
            <input id="author" name="author" className={styles.input} placeholder="DotSeek team" maxLength={80} />
            <label htmlFor="body" className={styles.label}>
              Reply to {enquiry.answers.name}
            </label>
            <textarea id="body" name="body" required rows={6} maxLength={5000} className={styles.input} />
            <p className={styles.note}>The customer is emailed with a link to continue this conversation.</p>
            <SubmitButton pendingText="Sending…">Send reply</SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
