import type { Metadata } from "next";
import { Logo } from "@/components/common/Logo";
import styles from "@/components/portal/Portal.module.css";

/** Private pages (admin inbox, customer enquiry threads): no marketing chrome, never indexed. */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      {/* Shown inside the chat's enquiry modal (same-origin frame): the modal has its own header. */}
      {/* Esc inside the frame closes the modal too (the key event stays in this document otherwise). */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "if(window.top!==window.self){document.documentElement.dataset.embedded='1';document.addEventListener('keydown',function(e){if(e.key==='Escape')window.parent.postMessage('dotseek:close-enquiry',location.origin)})}",
        }}
      />
      <header className={styles.topbar}>
        {/* _top: when shown inside the chat's enquiry modal, the logo opens the site in the whole window. */}
        <Logo target="_top" />
      </header>
      <main id="main" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
