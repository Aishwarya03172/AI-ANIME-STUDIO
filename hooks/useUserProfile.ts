import { useCallback, useEffect, useState } from 'react';

import { getUserProfile } from '@/services/firestore';
import type { UserProfile } from '@/types/user';
import { useAuth } from '@/providers/AuthProvider';

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const next = await getUserProfile(user.uid);
      setProfile(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profile, loading, error, refresh };
}
