import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Account } from '../types';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

      if (!error && data) {
        setAccounts(data as unknown as Account[]);
      } else if (error) {
        console.error('Error fetching accounts:', error);
      }
      setLoading(false);
    }

    fetchAccounts();

    // 2. Realtime WebSocket Channel
    const channel = supabase
      .channel('accounts_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts' },
        () => fetchAccounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { accounts, loading, setAccounts };
}
