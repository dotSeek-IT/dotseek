"use client";

import { useActionState } from "react";
import type { Offer } from "@/lib/plan/offer";
import { SubmitButton } from "@/components/portal/SubmitButton";
import styles from "@/components/portal/Admin.module.css";
import portal from "@/components/portal/Portal.module.css";
import { saveOfferAction } from "../../actions";

export function OfferForm({ offer, solutions }: { offer: Offer; solutions: { id: string; title: string }[] }) {
  const [message, action] = useActionState(saveOfferAction, undefined);
  return (
    <form action={action} className={portal.card}>
      <div className={styles.section}>
        <div>
          <h2>Status</h2>
          <p>Turn the offer on or off without losing its settings.</p>
        </div>
        <div className={styles.sectionBody}>
          <label className={styles.switch}>
            <input type="checkbox" name="active" defaultChecked={offer.active} />
            Offer is active
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <div>
          <h2>Offer</h2>
          <p>A fixed price wins when set; otherwise the discount applies to the recommended estimate. Offers never raise a price.</p>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.field}>
            <label htmlFor="label" className={portal.label}>
              Label shown to customers
            </label>
            <input id="label" name="label" className={portal.input} defaultValue={offer.label} maxLength={80} />
          </div>
          <div className={styles.fields3}>
            <div className={styles.field}>
              <label htmlFor="discountPercent" className={portal.label}>
                Discount (%)
              </label>
              <input
                id="discountPercent"
                name="discountPercent"
                className={portal.input}
                inputMode="numeric"
                placeholder="e.g. 15"
                defaultValue={offer.discountPercent ?? ""}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="fixedPrice" className={portal.label}>
                Or fixed price (£)
              </label>
              <input
                id="fixedPrice"
                name="fixedPrice"
                className={portal.input}
                inputMode="numeric"
                placeholder="Shown as “From £…”"
                defaultValue={offer.fixedPrice ?? ""}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="expires" className={portal.label}>
                Expiry date
              </label>
              <input id="expires" name="expires" type="date" className={portal.input} defaultValue={offer.expires ?? ""} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div>
          <h2>Eligible services</h2>
          <p>Leave all unticked to apply the offer to every service.</p>
        </div>
        <fieldset className={`${styles.sectionBody} ${portal.fieldset}`}>
          <legend className="sr-only">Eligible services</legend>
          <div className={styles.choiceGrid}>
            {solutions.map((s) => (
              <label key={s.id} className={styles.choice}>
                <input type="checkbox" name="eligible" value={s.id} defaultChecked={offer.eligibleSolutions.includes(s.id)} />
                {s.title}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={styles.formFoot}>
        <p className={portal.note}>Changes apply to new estimates straight away.</p>
        <div className={styles.statusForm}>
          {message && (
            <p className={message === "Saved." ? styles.saved : portal.error} role="status">
              {message}
            </p>
          )}
          <SubmitButton pendingText="Saving…">Save offer</SubmitButton>
        </div>
      </div>
    </form>
  );
}
