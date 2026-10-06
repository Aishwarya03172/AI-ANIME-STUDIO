import { useEffect, useState } from 'react';

import { useAuth } from '@/providers/AuthProvider';
import { subscribeToGenerations } from '@/services/generation';
import type { Generation } from '@/types/generation';

export function useGenerations() {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setGenerations([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToGenerations(
      user.uid,
      (items) => {
        setGenerations(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user?.uid]);

  return { generations, loading, error };
}
