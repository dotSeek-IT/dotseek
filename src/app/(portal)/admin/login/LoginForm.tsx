"use client";

import { useActionState, useState } from "react";
import { Icon } from "@/components/common/Icon";
import { SubmitButton } from "@/components/portal/SubmitButton";
import styles from "@/components/portal/Admin.module.css";
import portal from "@/components/portal/Portal.module.css";
import { loginAction } from "../../actions";

export function LoginForm() {
  const [error, action] = useActionState(loginAction, undefined);
  const [visible, setVisible] = useState(false);
  return (
    <form action={action} className={portal.form}>
      <label htmlFor="password" className={portal.label}>
        Admin password
      </label>
      <div className={styles.passwordWrap}>
        <input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          autoComplete="current-password"
          required
          autoFocus
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "login-error" : undefined}
          className={portal.input}
        />
        <button
          type="button"
          className={styles.reveal}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          <Icon name={visible ? "eyeOff" : "eye"} />
        </button>
      </div>
      {error && (
        <p id="login-error" role="alert" className={styles.alert}>
          {error}
        </p>
      )}
      <SubmitButton pendingText="Signing in…" className={styles.full}>
        Sign in
      </SubmitButton>
    </form>
  );
}
