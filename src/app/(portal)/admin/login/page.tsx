import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon, type IconName } from "@/components/common/Icon";
import { PortalFrame } from "@/components/portal/Chrome";
import { adminConfigured, isAdmin } from "@/lib/admin/auth";
import styles from "@/components/portal/Admin.module.css";
import portal from "@/components/portal/Portal.module.css";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in" };

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "mail",
    title: "Enquiry inbox",
    body: "Every enquiry with its AI estimate, architecture and brief.",
  },
  {
    icon: "chat",
    title: "Reply to customers",
    body: "Replies are emailed and appear on their private enquiry page.",
  },
  {
    icon: "sparkle",
    title: "New customer offers",
    body: "Turn the first-enquiry offer on or off and set its terms.",
  },
];

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <PortalFrame
      aside={
        <Link href="/" className={styles.topLink}>
          Back to website
        </Link>
      }
    >
      <div className={styles.loginStage}>
        <section className={styles.loginCard} aria-labelledby="login-title">
          <div className={styles.loginMain}>
            <span className={styles.loginMark}>
              <Icon name="lock" />
            </span>
            <div>
              <p className={portal.kicker}>DotSeek team</p>
              <h1 id="login-title" className={styles.loginTitle}>
                Sign in to the <em>admin</em>
              </h1>
            </div>
            {adminConfigured() ? (
              <LoginForm />
            ) : (
              <p className={styles.alert}>
                The admin isn&apos;t enabled yet. Set the <code>ADMIN_PASSWORD</code> environment variable and redeploy.
              </p>
            )}
            <p className={portal.note}>Customers don&apos;t sign in here: their private enquiry link is in their confirmation email.</p>
          </div>
          <aside className={styles.loginAside} aria-label="What's in the admin">
            <h2>Inside the admin</h2>
            <ul className={styles.features}>
              {FEATURES.map((f) => (
                <li key={f.title}>
                  <span className={styles.featureIcon}>
                    <Icon name={f.icon} />
                  </span>
                  <span>
                    <strong>{f.title}</strong>
                    {f.body}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </div>
    </PortalFrame>
  );
}
