import { useEffect, useRef, useState, useCallback } from 'react';
import { normalizeAccount, normalizeSOP, supabase } from '../lib/supabaseClient';
import { Account, AccessorialSOP } from '../types';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accessorials, setAccessorials] = useState<AccessorialSOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Use a stable channel name so it doesn't change on re-renders, unless we want unique per mount.
  // Using a stable one for the app scope is usually better.
  const channelNameRef = useRef(`accounts_realtime_channel`);

  const fetchAccounts = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    let isMounted = true;
    let refetchTimer: ReturnType<typeof setTimeout> | undefined;

    fetchAccounts();

    const scheduleFetchAccounts = () => {
      if (refetchTimer) clearTimeout(refetchTimer);
      refetchTimer = setTimeout(() => {
        if (isMounted) fetchAccounts();
      }, 150);
    };

    // Realtime WebSocket Channel
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
  }, [fetchAccounts]);

  return { accounts, accessorials, loading, error, isRealtimeConnected, setAccounts, setAccessorials, retry: fetchAccounts }; 
}
