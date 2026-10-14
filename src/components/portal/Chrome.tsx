import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/common/Icon";
import { Logo } from "@/components/common/Logo";
import { listEnquiries } from "@/lib/enquiries/store";
import { logoutAction } from "@/app/(portal)/actions";
import { needsReply } from "./EnquiryView";
import styles from "./Admin.module.css";

/** Top bar + main area for private pages that aren't signed in (customer enquiry, admin sign-in). */
export function PortalFrame({ aside, children }: { aside?: ReactNode; children: ReactNode }) {
  return (
    <>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          {/* _top: inside the chat's enquiry modal, the logo opens the site in the whole window. */}
          <Logo target="_top" />
          {aside && <div className={styles.topbarAside}>{aside}</div>}
        </div>
      </header>
      <main id="main" className={styles.main}>
        {children}
      </main>
    </>
  );
}

/** Signed-in admin frame: brand, Inbox / Offers navigation, View website and Sign out. */
export async function AdminFrame({ active, children }: { active: "inbox" | "offers"; children: ReactNode }) {
  const all = await listEnquiries().catch(() => []);
  const waiting = all.filter((e) => e.status === "new" || needsReply(e)).length;
  return (
    <>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <div className={styles.brand}>
            <Logo href="/admin" label="DotSeek admin: enquiry inbox" />
            <span className={styles.adminTag}>Admin</span>
          </div>
          <nav aria-label="Admin" className={styles.adminNav}>
            <Link href="/admin" aria-current={active === "inbox" ? "page" : undefined}>
              <Icon name="mail" />
              Inbox
              {waiting > 0 && (
                <span className={styles.navCount} aria-label={`${waiting} waiting`}>
                  {waiting}
                </span>
              )}
            </Link>
            <Link href="/admin/offers" aria-current={active === "offers" ? "page" : undefined}>
              <Icon name="sparkle" />
              Offers
            </Link>
          </nav>
          <div className={styles.topbarAside}>
            <Link href="/" target="_blank" rel="noopener" className={styles.topLink}>
              <Icon name="external" />
              <span>View website</span>
            </Link>
            <form action={logoutAction}>
              <button type="submit" className={styles.topButton}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" className={styles.main}>
        {children}
      </main>
    </>
  );
}
