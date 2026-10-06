import type { Timestamp } from 'firebase/firestore';

export type SubscriptionTier = 'Free' | 'Premium';

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  subscription: SubscriptionTier;
};

export type CreateUserProfileInput = {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  subscription?: SubscriptionTier;
};

export type UpdateUserProfileInput = Partial<
  Pick<UserProfile, 'displayName' | 'photoURL' | 'email' | 'subscription'>
>;
