import { useEffect, useRef, useState } from 'react';
import { normalizeAccount, normalizeSOP, supabase } from '../lib/supabaseClient';
import { Account, AccessorialSOP } from '../types';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accessorials, setAccessorials] = useState<AccessorialSOP[]>([]);
  const [loading, setLoading] = useState(true);

  const channelNameRef = useRef(`accounts_realtime_${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let isMounted = true;
    let refetchTimer: ReturnType<typeof setTimeout> | undefined;

    // 1. Initial Fetch
    async function fetchAccounts() {
      const { data, error } = await supabase
        .from('accounts')
        .select(`
          *,
          sops:accessorial_sops(*),
          contacts(*),
          documents(*),
          alerts:customer_alerts(*)
        `)
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (!error && data) {
        setAccounts(data.map(normalizeAccount));
        setAccessorials(data.flatMap((row: any) => (row.sops || []).map(normalizeSOP)));
      } else if (error) {
        console.error('Error fetching accounts:', error);
      }
      if (isMounted) setLoading(false);
    }

    fetchAccounts();

    const scheduleFetchAccounts = () => {
      if (refetchTimer) clearTimeout(refetchTimer);
      refetchTimer = setTimeout(fetchAccounts, 150);
    };

    // 2. Realtime WebSocket Channel
    const channel = supabase
      .channel(channelNameRef.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, scheduleFetchAccounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, scheduleFetchAccounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accessorial_sops' }, scheduleFetchAccounts)
      .subscribe((status, error) => {
        if (error) console.error('Accounts realtime subscription error:', status, error);
      });

    return () => {
      isMounted = false;
      if (refetchTimer) clearTimeout(refetchTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  return { accounts, accessorials, loading, setAccounts, setAccessorials }; 
}
