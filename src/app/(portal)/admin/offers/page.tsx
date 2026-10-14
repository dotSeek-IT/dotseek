import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { solutionCatalogue } from "@/content/solutions";
import { isAdmin } from "@/lib/admin/auth";
import { storeAvailable } from "@/lib/enquiries/store";
import { getOffer } from "@/lib/offers/store";
import { OfferForm } from "./OfferForm";
import styles from "@/components/portal/Portal.module.css";

export const metadata: Metadata = { title: "Offers", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Admin: the new-customer offer shown on AI-generated estimates (never hard-coded). */
export default async function OffersPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const offer = await getOffer();
  return (
    <div className={styles.page}>
      <Link href="/admin" className={styles.back}>
        ← Back to inbox
      </Link>
      <div>
        <h1 className={styles.title}>New customer offer</h1>
        <p className={styles.muted}>
          Shown on estimates for eligible services while active. It applies to a customer&apos;s first enquiry (checked by email when they send
          it) and is always confirmed by the team.
        </p>
      </div>
      {!storeAvailable() && <p className={styles.warning}>Storage isn&apos;t configured, so offers can&apos;t be saved yet.</p>}
      <OfferForm offer={offer} solutions={solutionCatalogue.map((s) => ({ id: s.id, title: s.title }))} />
    </div>
  );
}
