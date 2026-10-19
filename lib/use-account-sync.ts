"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppState } from "@/lib/demo-store";

export type AccountSyncPhase = "unavailable" | "checking" | "signed-out" | "needs-choice" | "syncing" | "synced" | "local-only" | "error";
export type AccountAuthMode = "register" | "login";

const LINKED_ACCOUNT_KEY = "bhashabuddy.account.linked-user.v1";
const SYNC_SNAPSHOT_PREFIX = "bhashabuddy.account.last-synced.v1:";

type AccountUser = { id: string; email: string };

function readSyncSnapshot(accountId: string) {
  try {
    return {
      linkedAccountId: window.localStorage.getItem(LINKED_ACCOUNT_KEY),
      snapshot: window.localStorage.getItem(SYNC_SNAPSHOT_PREFIX + accountId),
    };
  } catch {
    return { linkedAccountId: null, snapshot: null };
  }
}

function writeSyncSnapshot(accountId: string, snapshot: string) {
  try {
    window.localStorage.setItem(LINKED_ACCOUNT_KEY, accountId);
    window.localStorage.setItem(SYNC_SNAPSHOT_PREFIX + accountId, snapshot);
  } catch {
    // The account stays usable if local storage is unavailable; next load asks the learner to choose again.
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function useAccountSync(localState: AppState, replaceLocalState: (state: AppState) => void) {
  const [phase, setPhase] = useState<AccountSyncPhase>("checking");
  const [email, setEmail] = useState("");
  const [remoteState, setRemoteState] = useState<AppState | null>(null);
  const [hasCloudJournal, setHasCloudJournal] = useState(false);
  const [error, setError] = useState("");
  const lastSyncedJson = useRef<string | null>(null);
  const userId = useRef<string | null>(null);
  const localStateRef = useRef(localState);
  const localJson = stableJson(localState);

  useEffect(() => {
    localStateRef.current = localState;
  }, [localState]);

  const loadJournal = useCallback(async (accountId: string) => {
    setPhase("checking");
    setError("");
    try {
      const response = await fetch("/api/account/state", { cache: "no-store" });
      const result = await response.json() as { state?: AppState | null; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not load your account journal.");
      if (userId.current !== accountId) return;
      const accountState = result.state ?? null;
      setRemoteState(accountState);
      setHasCloudJournal(Boolean(accountState));

      const { linkedAccountId, snapshot } = readSyncSnapshot(accountId);
      const accountJson = accountState ? stableJson(accountState) : null;
      const currentLocalJson = stableJson(localStateRef.current);
      if (linkedAccountId === accountId && snapshot && accountState && accountJson) {
        if (currentLocalJson === snapshot || currentLocalJson === accountJson) {
          lastSyncedJson.current = accountJson;
          writeSyncSnapshot(accountId, accountJson);
          replaceLocalState(accountState);
          setPhase("synced");
          return;
        }
        if (accountJson === snapshot) {
          lastSyncedJson.current = snapshot;
          setPhase("synced");
          return;
        }
      }
      setPhase("needs-choice");
    } catch (cause) {
      if (userId.current !== accountId) return;
      setError(cause instanceof Error ? cause.message : "Could not load your account journal.");
      setPhase("error");
    }
  }, [replaceLocalState]);

  useEffect(() => {
    let alive = true;
    async function restoreSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const result = await response.json() as { configured?: boolean; user?: AccountUser | null; error?: string };
        if (!alive) return;
        if (!response.ok) throw new Error(result.error || "Could not check your account service.");
        if (!result.configured) {
          setPhase("unavailable");
          return;
        }
        if (!result.user) {
          userId.current = null;
          setEmail("");
          setPhase("signed-out");
          return;
        }
        userId.current = result.user.id;
        setEmail(result.user.email);
        await loadJournal(result.user.id);
      } catch (cause) {
        if (!alive) return;
        setError(cause instanceof Error ? cause.message : "Could not check your account service.");
        setPhase("error");
      }
    }
    void restoreSession();
    return () => { alive = false; };
  }, [loadJournal]);

  useEffect(() => {
    if (phase !== "synced" || !userId.current || localJson === lastSyncedJson.current) return;
    const payload = localJson;
    const timer = window.setTimeout(async () => {
      const syncingUserId = userId.current;
      if (!syncingUserId) return;
      setPhase("syncing");
      try {
        const response = await fetch("/api/account/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: JSON.parse(payload) as AppState }),
        });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error || "Could not sync the journal.");
        if (userId.current !== syncingUserId) return;
        lastSyncedJson.current = payload;
        writeSyncSnapshot(syncingUserId, payload);
        setRemoteState(JSON.parse(payload) as AppState);
        setHasCloudJournal(true);
        setError("");
        setPhase("synced");
      } catch (cause) {
        if (userId.current !== syncingUserId) return;
        setError(cause instanceof Error ? cause.message : "Could not sync the journal.");
        setPhase("error");
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [localJson, phase]);

  const requestSignIn = useCallback(async (address: string, password: string, mode: AccountAuthMode) => {
    const cleanEmail = address.trim().toLowerCase();
    if (!cleanEmail) return { ok: false, error: "Enter your email address." };
    if (!password) return { ok: false, error: "Enter your password." };
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, password }),
    });
    const result = await response.json() as { user?: AccountUser; error?: string; created?: boolean };
    if (!response.ok || !result.user) {
      setError(result.error || "Could not sign in to this account.");
      setPhase("signed-out");
      return { ok: false, error: result.error || "Could not sign in to this account." };
    }
    userId.current = result.user.id;
    setEmail(result.user.email);
    setError("");
    await loadJournal(result.user.id);
    return { ok: true, created: result.created };
  }, [loadJournal]);

  const signOut = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not sign out. Please try again.");
      userId.current = null;
      lastSyncedJson.current = null;
      setEmail("");
      setRemoteState(null);
      setHasCloudJournal(false);
      setError("");
      setPhase("signed-out");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign out. Please try again.");
      setPhase("error");
    }
  }, []);

  const useCloudJournal = useCallback(() => {
    if (!remoteState) return;
    const snapshot = stableJson(remoteState);
    lastSyncedJson.current = snapshot;
    const accountId = userId.current;
    if (accountId) writeSyncSnapshot(accountId, snapshot);
    replaceLocalState(remoteState);
    setError("");
    setPhase("synced");
  }, [remoteState, replaceLocalState]);

  const uploadLocalJournal = useCallback(async () => {
    const accountId = userId.current;
    if (!accountId) return;
    setPhase("syncing");
    setError("");
    try {
      const response = await fetch("/api/account/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: localState }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not sync the journal.");
      if (userId.current !== accountId) return;
      const snapshot = stableJson(localState);
      lastSyncedJson.current = snapshot;
      writeSyncSnapshot(accountId, snapshot);
      setRemoteState(localState);
      setHasCloudJournal(true);
      setPhase("synced");
    } catch (cause) {
      if (userId.current !== accountId) return;
      setError(cause instanceof Error ? cause.message : "Could not sync the journal.");
      setPhase("error");
    }
  }, [localState]);

  const deleteCloudJournal = useCallback(async () => {
    if (!userId.current) return { ok: false, error: "Sign in to manage account data." };
    const response = await fetch("/api/account/state", { method: "DELETE" });
    const result = await response.json() as { error?: string };
    if (!response.ok) {
      setError(result.error || "Could not delete account data.");
      setPhase("error");
      return { ok: false, error: result.error || "Could not delete account data." };
    }
    lastSyncedJson.current = null;
    setRemoteState(null);
    setHasCloudJournal(false);
    setError("");
    setPhase("local-only");
    return { ok: true };
  }, []);

  return {
    phase,
    email,
    error,
    hasCloudJournal,
    requestSignIn,
    signOut,
    useCloudJournal,
    uploadLocalJournal,
    deleteCloudJournal,
  };
}
