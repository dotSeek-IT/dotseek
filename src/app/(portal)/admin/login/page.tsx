import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "@/lib/admin/auth";
import styles from "@/components/portal/Portal.module.css";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className={styles.narrow}>
      <h1 className={styles.title}>Enquiry inbox</h1>
      {adminConfigured() ? (
        <LoginForm />
      ) : (
        <p className={styles.muted}>
          The admin inbox isn&apos;t enabled yet. Set the <code>ADMIN_PASSWORD</code> environment variable and redeploy.
        </p>
      )}
    </div>
  );
}
