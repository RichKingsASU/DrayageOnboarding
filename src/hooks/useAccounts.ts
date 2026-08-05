/**
 * File: useAccounts.ts
 * Purpose: Loads onboarding accounts/SOPs and keeps account state synchronized through Supabase realtime events.
 * Dependencies: React hooks, Supabase client helpers, and shared account/SOP types.
 * Maintainer note: Realtime updates trigger debounced refetches to keep related records consistent.
 */
import { useEffect, useRef, useState } from 'react';
import { normalizeAccount, normalizeSOP, supabase } from '../lib/supabaseClient';
import { Account, AccessorialSOP } from '../types';
import { useAuth } from './useAuth';

/**
 * Fetches onboarding accounts/accessorial SOPs and subscribes to Supabase realtime account changes.
 */
export function useAccounts() {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accessorials, setAccessorials] = useState<AccessorialSOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Generate a unique channel per hook mount to prevent cleanup collisions
  const channelNameRef = useRef(`drayage-accounts-${crypto.randomUUID()}`);

  const fetchAccounts = useCallback(async () => {
    if (!session) {
      setAccounts([]);
      setAccessorials([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    const { data, err } = await supabase
      .from('accounts')
      .select(`
        *,
        sops:accessorial_sops(*),
        contacts(*),
        documents(*),
        alerts:customer_alerts(*)
      `)
      .order('created_at', { ascending: false })
      .then(res => ({ data: res.data, err: res.error }));

    if (err) {
      console.error('Error fetching accounts:', err);
      setError(err);
      // We do NOT clear accounts here on fetch failure, so we retain the last known good state
    } else if (data) {
      setAccounts(data.map(normalizeAccount));
      setAccessorials(data.flatMap((row: any) => (row.sops || []).map(normalizeSOP)));
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

    // Realtime WebSocket Channel using a unique name for this hook instance
    const channel = supabase
      .channel(channelNameRef.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, scheduleFetchAccounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, scheduleFetchAccounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accessorial_sops' }, scheduleFetchAccounts)
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          if (isMounted) setIsRealtimeConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          if (isMounted) setIsRealtimeConnected(false);
          if (err) console.error('Accounts realtime subscription error:', status, err);
        }
      });

    return () => {
      isMounted = false;
      if (refetchTimer) clearTimeout(refetchTimer);
      supabase.removeChannel(channel);
    };
  }, [fetchAccounts, session]);

  return { accounts, accessorials, loading, error, isRealtimeConnected, setAccounts, setAccessorials, retry: fetchAccounts }; 
}
