/**
 * File: useAccounts.ts
 * Purpose: Loads onboarding accounts/SOPs and keeps account state synchronized through Supabase realtime events.
 * Dependencies: React hooks, Supabase client helpers, and shared account/SOP types.
 * Maintainer note: Realtime updates trigger debounced refetches to keep related records consistent.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeAccount, normalizeSOP } from '../lib/azureClient';
import { Account, AccessorialSOP } from '../types';
import { INITIAL_ACCOUNTS, INITIAL_ACCESSORIALS } from '../mockData';
import { useAuth } from './useAuth';
import { fetchApi } from '../apiClient';

/**
 * Fetches onboarding accounts/accessorial SOPs and subscribes to Supabase realtime account changes.
 */
export function useAccounts() {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [accessorials, setAccessorials] = useState<AccessorialSOP[]>(INITIAL_ACCESSORIALS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Generate a unique channel per hook mount to prevent cleanup collisions
  const channelNameRef = useRef(`drayage-accounts-${crypto.randomUUID()}`);

  const fetchAccounts = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi('/ondray/accounts/');
      if (data && data.length > 0) {
        setAccounts(data.map(normalizeAccount));
        setAccessorials(data.flatMap((row: any) => (row.sops || []).map(normalizeSOP)));
      }
    } catch (err: any) {
      console.error('Error fetching accounts:', err);
      setError(err);
      // Retain last known good state on error
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    let isMounted = true;
    let refetchTimer: ReturnType<typeof setTimeout> | undefined;

    fetchAccounts();

    if (!session) {
      return; // Do not subscribe if unauthenticated
    }

    const scheduleFetchAccounts = () => {
      if (refetchTimer) clearTimeout(refetchTimer);
      refetchTimer = setTimeout(() => {
        if (isMounted) fetchAccounts();
      }, 150);
    };

    // Azure Web PubSub placeholder
    const ws = new WebSocket('ws://localhost:8080/stub-pubsub'); // Stub URL
    ws.onmessage = (event) => {
      // Trigger refetch on relevant message
      scheduleFetchAccounts();
    };
    ws.onopen = () => {
      if (isMounted) setIsRealtimeConnected(true);
    };
    ws.onerror = (err) => {
      if (isMounted) setIsRealtimeConnected(false);
      console.error('Azure Web PubSub realtime subscription error:', err);
    };
    ws.onclose = () => {
      if (isMounted) setIsRealtimeConnected(false);
    };

    return () => {
      isMounted = false;
      if (refetchTimer) clearTimeout(refetchTimer);
      ws.close();
    };
  }, [fetchAccounts, session]);

  return { accounts, accessorials, loading, error, isRealtimeConnected, setAccounts, setAccessorials, retry: fetchAccounts }; 
}
