import type { Timestamp } from 'firebase/firestore';

export function formatFirestoreDate(value?: Timestamp | null): string {
  if (!value || typeof value.toDate !== 'function') {
    return '—';
  }

  try {
    return value.toDate().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function getDisplayName(options: {
  displayName?: string | null;
  email?: string | null;
}): string {
  if (options.displayName?.trim()) {
    return options.displayName.trim();
  }

  if (options.email) {
    return options.email.split('@')[0] ?? options.email;
  }

  return 'Creator';
}
