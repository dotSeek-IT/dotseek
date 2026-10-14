import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/content/site";
import { getEnquiryByToken } from "@/lib/enquiries/store";
import { EnquiryDetails, StatusPill, Thread, formatDate } from "@/components/portal/EnquiryView";
import { SubmitButton } from "@/components/portal/SubmitButton";
import styles from "@/components/portal/Portal.module.css";
import { customerReplyAction } from "../../actions";

export const metadata: Metadata = { title: "Your enquiry" };
export const dynamic = "force-dynamic";

/** The customer's private enquiry page (secret link from their confirmation email). */
export default async function CustomerEnquiryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const enquiry = await getEnquiryByToken(token);
  if (!enquiry) notFound();

  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Your enquiry with {site.name}</h1>
          <p className={styles.muted}>
            Reference {enquiry.ref} · sent {formatDate(enquiry.createdAt)}
          </p>
        </div>
        <StatusPill status={enquiry.status} />
      </div>

      <div className={styles.split}>
        <EnquiryDetails enquiry={enquiry} showTranscript={false} />
        <div className={`${styles.stack} ${styles.leadOnMobile}`}>
          <Thread enquiry={enquiry} viewer="customer" />
          {enquiry.status === "closed" ? (
            <p className={styles.muted}>
              This enquiry is closed. For anything new, email <a href={`mailto:${site.email}`}>{site.email}</a>.
            </p>
          ) : (
            <form action={customerReplyAction} className={`${styles.card} ${styles.form}`}>
              <input type="hidden" name="token" value={token} />
              <label htmlFor="body" className={styles.label}>
                Message the {site.name} team
              </label>
              <textarea id="body" name="body" required rows={5} maxLength={5000} className={styles.input} />
              <SubmitButton pendingText="Sending…">Send message</SubmitButton>
            </form>
          )}
          <p className={styles.note}>Keep this page&apos;s link private: anyone with it can view your enquiry.</p>
        </div>
      </div>
    </div>
  );
}
