"use client";

import { useActionState } from "react";
import { saveOfferAction } from "../../actions";
import type { Offer } from "@/lib/plan/offer";
import { SubmitButton } from "@/components/portal/SubmitButton";
import styles from "@/components/portal/Portal.module.css";

export function OfferForm({ offer, solutions }: { offer: Offer; solutions: { id: string; title: string }[] }) {
  const [message, action] = useActionState(saveOfferAction, undefined);
  return (
    <form action={action} className={`${styles.card} ${styles.form}`}>
      <label className={styles.check}>
        <input type="checkbox" name="active" defaultChecked={offer.active} /> Offer is active
      </label>
      <label htmlFor="label" className={styles.label}>
        Label shown to customers
      </label>
      <input id="label" name="label" className={styles.input} defaultValue={offer.label} maxLength={80} />
      <div className={styles.fields}>
        <div>
          <label htmlFor="discountPercent" className={styles.label}>
            Discount (%)
          </label>
          <input id="discountPercent" name="discountPercent" className={styles.input} inputMode="numeric" defaultValue={offer.discountPercent ?? ""} />
        </div>
        <div>
          <label htmlFor="fixedPrice" className={styles.label}>
            Or fixed price (£, &quot;From £…&quot;)
          </label>
          <input id="fixedPrice" name="fixedPrice" className={styles.input} inputMode="numeric" defaultValue={offer.fixedPrice ?? ""} />
        </div>
        <div>
          <label htmlFor="expires" className={styles.label}>
            Expiry date
          </label>
          <input id="expires" name="expires" type="date" className={styles.input} defaultValue={offer.expires ?? ""} />
        </div>
      </div>
      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>Eligible services (none ticked = all)</legend>
        {solutions.map((s) => (
          <label key={s.id} className={styles.check}>
            <input type="checkbox" name="eligible" value={s.id} defaultChecked={offer.eligibleSolutions.includes(s.id)} /> {s.title}
          </label>
        ))}
      </fieldset>
      <p className={styles.note}>The fixed price is used when set; otherwise the discount applies to the recommended estimate. Offers never raise a price.</p>
      <SubmitButton pendingText="Saving…">Save offer</SubmitButton>
      {message && (
        <p className={styles.muted} role="status">
          {message}
        </p>
      )}
    </form>
  );
}
