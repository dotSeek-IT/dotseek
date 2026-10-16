import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/common/Icon";
import { AdminFrame } from "@/components/portal/Chrome";
import { isAdmin } from "@/lib/admin/auth";
import { getRegions } from "@/lib/currency/regions.server";
import { formatRateDate } from "@/lib/currency/money";
import { storeAvailable } from "@/lib/enquiries/store";
import styles from "@/components/portal/Admin.module.css";
import portal from "@/components/portal/Portal.module.css";
import { RefreshRates, RegionForm } from "./RegionForm";

export const metadata: Metadata = { title: "Pricing regions", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Admin: currency, regional pricing, budget brackets and tax wording per market. */
export default async function RegionsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const regions = await getRegions();
  const live = regions.filter((r) => r.rateSource === "ecb" || r.rateSource === "usd-peg");
  const manual = regions.filter((r) => r.rateSource === "manual");
  const priced = regions.filter((r) => r.priceFactor !== 1);
  const latest = live.map((r) => r.rateCheckedAt).sort().at(-1);
  return (
    <AdminFrame active="regions">
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
            <h1>Pricing regions</h1>
            <p className={styles.lead}>
              Visitors see prices in their market&apos;s currency: GBP base price × regional factor × exchange rate, rounded for the market.
              Every quotation stores the rate and settings it used, so changes here never alter past quotations.
            </p>
          </div>
          <span className={styles.offerState} data-active={latest ? true : undefined}>
            {latest ? `Rates checked ${formatRateDate(latest)}` : "Rates not checked yet"}
          </span>
        </div>
        {!storeAvailable() && <p className={portal.warning}>Storage isn&apos;t configured, so changes can&apos;t be saved yet.</p>}

        <div className={styles.stats}>
          <div className={styles.stat}>
            Regions
            <strong>{regions.length}</strong>
          </div>
          <div className={`${styles.stat} ${styles.statHighlight}`}>
            Live exchange rates
            <strong>{live.length}</strong>
          </div>
          <div className={styles.stat}>
            Manual rates
            <strong>{manual.length}</strong>
          </div>
          <div className={styles.stat}>
            Regional price factor
            <strong>{priced.length}</strong>
          </div>
        </div>

        <div className={styles.toolbar}>
          <p className={styles.toolbarNote}>Open a region to edit its currency, rate, pricing, budget brackets and tax wording.</p>
          <RefreshRates />
        </div>

        <ul className={styles.list}>
          {regions.map((r) => (
            <RegionForm key={r.id} region={r} />
          ))}
        </ul>
      </div>
    </AdminFrame>
  );
}
