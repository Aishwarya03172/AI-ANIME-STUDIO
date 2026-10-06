import { useCallback, useEffect, useState } from 'react';

import { getRecentProjects } from '@/services/projects';
import type { AnimeProject } from '@/types/project';
import { useAuth } from '@/providers/AuthProvider';

export function useRecentProjects(limitCount = 6) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<AnimeProject[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const next = await getRecentProjects(user.uid, limitCount);
      setProjects(next);
    } catch {
      // Collection/index may not exist yet — show empty state.
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [user, limitCount]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { projects, loading, refresh };
}
