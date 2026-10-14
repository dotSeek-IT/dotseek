import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/common/Icon";
import { redirect } from "next/navigation";
import { solutionCatalogue } from "@/content/solutions";
import { isAdmin } from "@/lib/admin/auth";
import { storeAvailable } from "@/lib/enquiries/store";
import { getOffer } from "@/lib/offers/store";
import { gbp } from "@/lib/plan/format";
import type { Offer } from "@/lib/plan/offer";
import { AdminFrame } from "@/components/portal/Chrome";
import styles from "@/components/portal/Admin.module.css";
import portal from "@/components/portal/Portal.module.css";
import { OfferForm } from "./OfferForm";

export const metadata: Metadata = {
  title: "Offers",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const expired = (offer: Offer) => Boolean(offer.expires && new Date(`${offer.expires}T23:59:59`) < new Date());

/** One-line state of the offer, e.g. "Live: 15% off until 31 Dec 2026". */
function offerState(offer: Offer): { live: boolean; text: string } {
  if (!offer.active) return { live: false, text: "Off" };
  if (expired(offer)) return { live: false, text: "Expired" };
  const what = offer.fixedPrice
    ? `from ${gbp(offer.fixedPrice)}`
    : offer.discountPercent
      ? `${offer.discountPercent}% off`
      : "no discount set";
  const until = offer.expires
    ? ` until ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(`${offer.expires}T12:00:00`))}`
    : "";
  return { live: true, text: `Live: ${what}${until}` };
}

/** Admin: the new-customer offer shown on AI-generated estimates (never hard-coded). */
export default async function OffersPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const offer = await getOffer();
  const state = offerState(offer);
  return (
    <AdminFrame active="offers">
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
            <h1>New customer offer</h1>
            <p className={styles.lead}>
              Shown on estimates for eligible services while it&apos;s live. It applies to a customer&apos;s first enquiry (checked by email
              when they send it) and the team always confirms it.
            </p>
          </div>
          <span className={styles.offerState} data-active={state.live || undefined}>
            {state.text}
          </span>
        </div>
        {!storeAvailable() && <p className={portal.warning}>Storage isn&apos;t configured, so offers can&apos;t be saved yet.</p>}
        <OfferForm
          offer={offer}
          solutions={solutionCatalogue.map((s) => ({
            id: s.id,
            title: s.title,
          }))}
        />
      </div>
    </AdminFrame>
  );
}
