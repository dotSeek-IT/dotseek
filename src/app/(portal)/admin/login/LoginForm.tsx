"use client";

import { useActionState } from "react";
import { loginAction } from "../../actions";
import { SubmitButton } from "@/components/portal/SubmitButton";
import styles from "@/components/portal/Portal.module.css";

export function LoginForm() {
  const [error, action] = useActionState(loginAction, undefined);
  return (
    <form action={action} className={styles.form}>
      <label htmlFor="password" className={styles.label}>
        Admin password
      </label>
      <input id="password" name="password" type="password" autoComplete="current-password" required className={styles.input} />
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
