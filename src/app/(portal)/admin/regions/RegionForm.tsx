"use client";

import { useActionState, useState } from "react";
import type { BudgetBracket, Region } from "@/content/regions";
import { Icon } from "@/components/common/Icon";
import { SubmitButton } from "@/components/portal/SubmitButton";
import { formatRateDate, makeMoney, rateText } from "@/lib/currency/money";
import styles from "@/components/portal/Admin.module.css";
import portal from "@/components/portal/Portal.module.css";
import { refreshRatesAction, saveRegionAction } from "../../actions";

/** GBP amount used for the "shows as" example on every region. */
const EXAMPLE_GBP = 640;

const SOURCES: Record<Region["rateSource"], string> = {
  fixed: "Base currency",
  ecb: "European Central Bank",
  "usd-peg": "US dollar peg",
  manual: "Manual",
};

export function RefreshRates() {
  const [message, action] = useActionState(refreshRatesAction, undefined);
  return (
    <form action={action} className={styles.statusForm}>
      {message && (
        <p className={portal.note} role="status">
          {message}
        </p>
      )}
      <SubmitButton pendingText="Updating…" variant="secondary" size="sm">
        Refresh rates
      </SubmitButton>
    </form>
  );
}

const num = (value: FormDataEntryValue | null, fallback: number) => {
  const n = Number(String(value ?? "").replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** The region as currently typed in the form (for the live preview; the server validates on save). */
function draftFrom(form: HTMLFormElement, base: Region): Region {
  const d = new FormData(form);
  const code = String(d.get("currency") ?? "").trim().toUpperCase();
  return {
    ...base,
    currency: /^[A-Z]{3}$/.test(code) ? code : base.currency,
    symbol: String(d.get("symbol") ?? "").trim() || base.symbol,
    locale: String(d.get("locale") ?? "").trim() || base.locale,
    perGbp: num(d.get("perGbp"), base.perGbp),
    priceFactor: num(d.get("priceFactor"), base.priceFactor),
    minProject: Number(String(d.get("minProject") ?? "").replace(/[,\s]/g, "")) || 0,
    roundTo: num(d.get("roundTo"), base.roundTo),
    decimals: Math.min(2, Math.max(0, Math.round(Number(d.get("decimals")) || 0))),
  };
}

/** Formatting can throw for a half-typed locale or currency; the preview just keeps the last good value. */
function preview(region: Region) {
  try {
    const money = makeMoney(region);
    return { amount: money.total(EXAMPLE_GBP), ref: money.ref(EXAMPLE_GBP), rate: rateText(region) };
  } catch {
    return null;
  }
}

/** One region: a summary row (like an inbox item) that opens its settings form. */
export function RegionForm({ region: r }: { region: Region }) {
  const [message, action] = useActionState(saveRegionAction, undefined);
  const [draft, setDraft] = useState(r);
  const [shown, setShown] = useState(() => preview(r));
  const k = (name: string) => `${r.id}-${name}`;
  const fallback = r.countries.includes("*");
  const saved = (message ?? "").startsWith("Saved");

  const onInput = (form: HTMLFormElement) => {
    const next = draftFrom(form, r);
    setDraft(next);
    const p = preview(next);
    if (p) setShown(p);
  };

  return (
    <li>
      <details className={styles.region} id={`region-${r.id}`}>
        <summary className={styles.item}>
          <span className={styles.avatar} aria-hidden="true">
            {r.symbol}
          </span>
          <span className={styles.itemMain}>
            <span className={styles.itemTitle}>{r.name}</span>
            <span className={styles.itemWho}>{fallback ? "Every other country" : r.countries.join(", ")}</span>
            <span className={styles.chips}>
              <span className={`${styles.chip} ${styles.chipBrand}`}>{r.currency}</span>
              <span className={styles.chip}>{SOURCES[r.rateSource]}</span>
              {r.priceFactor !== 1 && <span className={`${styles.chip} ${styles.chipWarn}`}>Factor {r.priceFactor}</span>}
              {r.invoiceCurrency !== r.currency && <span className={styles.chip}>Invoiced in {r.invoiceCurrency}</span>}
            </span>
          </span>
          <span className={styles.amount}>
            {makeMoney(r).total(EXAMPLE_GBP)}
            <small>
              £{EXAMPLE_GBP} · {r.currency === "GBP" ? "base price" : rateText(r)}
            </small>
          </span>
          <span className={styles.itemMeta}>
            <small>Rate checked</small>
            {formatRateDate(r.rateCheckedAt)}
          </span>
          <span className={styles.regionToggle} aria-hidden="true">
            <Icon name="arrow" />
          </span>
        </summary>

        <form action={action} className={styles.regionForm} onInput={(e) => onInput(e.currentTarget)}>
          <input type="hidden" name="id" value={r.id} />

          <div className={styles.preview} aria-live="polite">
            <span>Preview</span>
            <p>
              A £{EXAMPLE_GBP} quote shows as <strong>{shown?.amount ?? "…"}</strong>
              {shown?.ref && <small> ({shown.ref})</small>}
            </p>
            <small>
              {draft.currency === "GBP" ? "Base currency, no conversion" : shown?.rate} · factor {draft.priceFactor} · rounded to {draft.roundTo}
              {draft.minProject > 0 && ` · minimum ${draft.symbol}${draft.minProject.toLocaleString(draft.locale)}`}
            </small>
          </div>

          <div className={styles.section}>
            <div>
              <h2>Market</h2>
              <p>Who sees this region and how their numbers are written.</p>
            </div>
            <div className={styles.sectionBody}>
              <Field id={k("countries")} label="Countries" hint="Two-letter ISO codes, comma separated. * means every country not listed elsewhere.">
                <input id={k("countries")} name="countries" className={portal.input} defaultValue={r.countries.join(", ")} />
              </Field>
              <div className={styles.fields3}>
                <Field id={k("currency")} label="Currency code">
                  <input id={k("currency")} name="currency" className={portal.input} defaultValue={r.currency} maxLength={3} />
                </Field>
                <Field id={k("symbol")} label="Symbol">
                  <input id={k("symbol")} name="symbol" className={portal.input} defaultValue={r.symbol} maxLength={6} />
                </Field>
                <Field id={k("locale")} label="Number format" hint="Locale, e.g. en-IN gives 2,86,000">
                  <input id={k("locale")} name="locale" className={portal.input} defaultValue={r.locale} maxLength={12} />
                </Field>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div>
              <h2>Exchange rate</h2>
              <p>Converts value only. Live sources update with Refresh rates; manual rates stay as typed.</p>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.fields3}>
                <Field id={k("perGbp")} label={`${r.currency} per £1`}>
                  <input id={k("perGbp")} name="perGbp" className={portal.input} inputMode="decimal" defaultValue={r.perGbp} />
                </Field>
                <Field id={k("rateSource")} label="Rate source">
                  <select id={k("rateSource")} name="rateSource" className={portal.input} defaultValue={r.rateSource}>
                    <option value="fixed">Base currency (fixed)</option>
                    <option value="ecb">European Central Bank</option>
                    <option value="usd-peg">US dollar peg</option>
                    <option value="manual">Manual</option>
                  </select>
                </Field>
                <div className={styles.field}>
                  <span className={portal.label}>Last checked</span>
                  <p className={styles.fieldValue}>{formatRateDate(r.rateCheckedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div>
              <h2>Regional pricing</h2>
              <p>Changes the commercial price for this market, separately from the exchange rate.</p>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.fields3}>
                <Field id={k("priceFactor")} label="Price factor" hint="1 = UK price, 0.8 = 20% lower">
                  <input id={k("priceFactor")} name="priceFactor" className={portal.input} inputMode="decimal" defaultValue={r.priceFactor} />
                </Field>
                <Field id={k("minProject")} label={`Minimum project (${r.currency})`} hint="0 = no minimum">
                  <input id={k("minProject")} name="minProject" className={portal.input} inputMode="numeric" defaultValue={r.minProject} />
                </Field>
                <Field id={k("roundTo")} label={`Round to (${r.currency})`}>
                  <input id={k("roundTo")} name="roundTo" className={portal.input} inputMode="numeric" defaultValue={r.roundTo} />
                </Field>
              </div>
              <div className={styles.fields3}>
                <Field id={k("decimals")} label="Decimals">
                  <select id={k("decimals")} name="decimals" className={portal.input} defaultValue={String(r.decimals)}>
                    <option value="0">None (68,000)</option>
                    <option value="2">Two (750.00)</option>
                  </select>
                </Field>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div>
              <h2>Budget brackets</h2>
              <p>The options in the chat&apos;s budget question, in {r.currency}. Leave the last maximum empty for an open-ended bracket.</p>
            </div>
            <BudgetEditor currency={r.currency} initial={r.budgets} />
          </div>

          <div className={styles.section}>
            <div>
              <h2>Tax and invoicing</h2>
              <p>Shown on quotations and emails for this market.</p>
            </div>
            <div className={styles.sectionBody}>
              <Field id={k("taxNote")} label="Tax wording">
                <textarea id={k("taxNote")} name="taxNote" rows={2} className={portal.input} defaultValue={r.taxNote} maxLength={300} />
              </Field>
              <div className={styles.fields3}>
                <Field id={k("invoiceCurrency")} label="Invoice currency" hint="If different, quotes say prices are shown for convenience.">
                  <input id={k("invoiceCurrency")} name="invoiceCurrency" className={portal.input} defaultValue={r.invoiceCurrency} maxLength={3} />
                </Field>
              </div>
            </div>
          </div>

          <div className={styles.formFoot}>
            <p className={portal.note}>Applies to new quotations straight away. Sent quotations keep the rate they used.</p>
            <div className={styles.statusForm}>
              {message && (
                <p className={saved ? styles.saved : portal.error} role="status">
                  {message}
                </p>
              )}
              <SubmitButton pendingText="Saving…">Save {r.name}</SubmitButton>
            </div>
          </div>
        </form>
      </details>
    </li>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={portal.label}>
        {label}
      </label>
      {children}
      {hint && <p className={portal.note}>{hint}</p>}
    </div>
  );
}

type Row = { key: number; label: string; min: string; max: string };

/** Budget brackets as editable rows; submitted as "label | min | max" lines (the format the action parses). */
function BudgetEditor({ currency, initial }: { currency: string; initial: BudgetBracket[] }) {
  const [rows, setRows] = useState<Row[]>(() =>
    initial.map((b, i) => ({ key: i, label: b.label, min: String(b.min), max: b.max == null ? "" : String(b.max) })),
  );
  const [next, setNext] = useState(initial.length);
  const update = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const value = rows
    .filter((r) => r.label.trim())
    .map((r) => `${r.label.trim()} | ${r.min.trim() || 0} | ${r.max.trim()}`)
    .join("\n");

  return (
    <div className={styles.sectionBody}>
      <input type="hidden" name="budgets" value={value} />
      <div className={styles.brackets} role="table" aria-label={`Budget brackets in ${currency}`}>
        <div className={styles.bracketHead} role="row">
          <span role="columnheader">Label shown in chat</span>
          <span role="columnheader">From</span>
          <span role="columnheader">Up to</span>
          <span role="columnheader">
            <span className="sr-only">Remove</span>
          </span>
        </div>
        {rows.map((row, i) => (
          <div key={row.key} className={styles.bracketRow} role="row">
            <input
              aria-label={`Bracket ${i + 1} label`}
              className={portal.input}
              value={row.label}
              maxLength={60}
              onChange={(e) => update(row.key, { label: e.target.value })}
            />
            <input
              aria-label={`Bracket ${i + 1} from (${currency})`}
              className={portal.input}
              inputMode="numeric"
              value={row.min}
              onChange={(e) => update(row.key, { min: e.target.value })}
            />
            <input
              aria-label={`Bracket ${i + 1} up to (${currency})`}
              className={portal.input}
              inputMode="numeric"
              placeholder="No limit"
              value={row.max}
              onChange={(e) => update(row.key, { max: e.target.value })}
            />
            <button
              type="button"
              className={styles.iconButton}
              aria-label={`Remove ${row.label || `bracket ${i + 1}`}`}
              disabled={rows.length <= 1}
              onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
            >
              <Icon name="close" />
            </button>
          </div>
        ))}
      </div>
      <div>
        <button
          type="button"
          className={styles.addRow}
          onClick={() => {
            setRows((rs) => [...rs, { key: next, label: "", min: rs.at(-1)?.max ?? "", max: "" }]);
            setNext((n) => n + 1);
          }}
        >
          <Icon name="plus" />
          Add bracket
        </button>
      </div>
    </div>
  );
}
