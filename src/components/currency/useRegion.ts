"use client";

import { useEffect, useSyncExternalStore } from "react";
import { defaultRegions, type Region } from "@/content/regions";
import { makeMoney, regionForCountry, type Money } from "@/lib/currency/money";
import { setDisplayMoney } from "@/lib/plan/format";

/**
 * The visitor's market: detected from their country (via /api/locale) unless
 * they picked one with the currency selector (remembered on this device).
 * Changing it re-renders every price immediately; the quotation itself
 * (scope, choices) is untouched because the engine stays in GBP.
 */

const CHOICE_KEY = "dotseek-region";
/** The detected country and settings for this tab, so a refresh shows the right currency at once. */
const LOCALE_KEY = "dotseek-locale";
type Choice = "auto" | string;
type State = { regions: Region[]; country: string | null; choice: Choice; loaded: boolean };

let state: State = { regions: defaultRegions, country: null, choice: "auto", loaded: false };
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const SERVER_STATE: State = state;

const resolve = (s: State): Region =>
  s.choice !== "auto" ? (s.regions.find((r) => r.id === s.choice) ?? regionForCountry(s.country, s.regions)) : regionForCountry(s.country, s.regions);

function set(next: State) {
  state = next;
  setDisplayMoney(makeMoney(resolve(state), state.country));
  listeners.forEach((l) => l());
}

let started = false;
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  let choice: Choice = "auto";
  let cached: { country: string | null; regions: Region[] } | null = null;
  try {
    choice = window.localStorage.getItem(CHOICE_KEY) ?? "auto";
    cached = JSON.parse(window.sessionStorage.getItem(LOCALE_KEY) ?? "null");
  } catch {
    // Storage blocked: automatic.
  }
  set({ ...state, choice, ...(cached?.regions?.length ? { country: cached.country, regions: cached.regions } : {}) });
  fetch("/api/locale")
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { country?: string | null; regions?: Region[] } | null) => {
      if (!data) return;
      // Keep the tab's known country when the server can't tell (local development has no location header).
      const next = { country: data.country ?? state.country ?? null, regions: data.regions?.length ? data.regions : state.regions };
      try {
        window.sessionStorage.setItem(LOCALE_KEY, JSON.stringify(next));
      } catch {
        // Not kept: fetched again next time.
      }
      set({ ...state, ...next, loaded: true });
    })
    .catch(() => undefined);
}

/** Pick a currency (region id) or "auto" to follow the visitor's location again. */
export function setRegionChoice(choice: Choice) {
  try {
    window.localStorage.setItem(CHOICE_KEY, choice);
  } catch {
    // Not kept: applies to this page.
  }
  set({ ...state, choice });
}

/** Outside React (sending an enquiry, mapping a budget): the market right now. */
export function currentRegion(): { region: Region; money: Money; country: string | null; selection: "auto" | "manual" } {
  const region = resolve(state);
  return { region, money: makeMoney(region, state.country), country: state.country, selection: state.choice === "auto" ? "auto" : "manual" };
}

export function useRegion() {
  const s = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  useEffect(start, []);
  const region = resolve(s);
  return {
    region,
    money: makeMoney(region, s.country),
    regions: s.regions,
    country: s.country,
    choice: s.choice,
    detected: regionForCountry(s.country, s.regions),
  };
}
