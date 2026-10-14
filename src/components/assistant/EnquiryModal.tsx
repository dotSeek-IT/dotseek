"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/common/Icon";
import styles from "./EnquiryModal.module.css";

/**
 * The customer's private enquiry page (estimate, answers and the conversation
 * with the DotSeek team) shown in a modal over the chat, so the chat stays put.
 * The page is same-origin only (frame-ancestors 'self').
 */
export function EnquiryModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    if (dialog && !dialog.open) dialog.showModal();
    // Esc pressed inside the embedded page arrives as a message from the same origin.
    const onMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data === "dotseek:close-enquiry") onClose();
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      dialog?.close();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="enquiry-modal-title"
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
    >
      <header className={styles.head}>
        <div>
          <p className={styles.kicker}>Private enquiry page</p>
          <h2 id="enquiry-modal-title" className={styles.title}>
            {title}
          </h2>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close enquiry">
          <Icon name="close" />
        </button>
      </header>
      <div className={styles.body}>
        {!loaded && (
          <p className={styles.loading} role="status">
            Loading your enquiry…
          </p>
        )}
        <iframe className={styles.frame} src={url} title={title} onLoad={() => setLoaded(true)} />
      </div>
    </dialog>
  );
}
