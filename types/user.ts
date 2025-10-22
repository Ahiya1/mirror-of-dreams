// types/user.ts - User types and transformations

export type SubscriptionTier = 'free' | 'essential' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'past_due' | 'trialing';
export type Language = 'en' | 'he';

/**
 * User object - Application representation
 */
export interface User {
  id: string;
  email: string;
  name: string;
  tier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPeriod: 'monthly' | 'yearly' | null;
  reflectionCountThisMonth: number;
  totalReflections: number;
  currentMonthYear: string; // "2025-01"
  isCreator: boolean;
  isAdmin: boolean;
  language: Language;
  emailVerified: boolean;
  createdAt: string;
  lastSignInAt: string;
  updatedAt: string;
}

/**
 * JWT Payload structure
 */
export interface JWTPayload {
  userId: string;
  email: string;
  tier: SubscriptionTier;
  isCreator: boolean;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

/**
 * Public User - User without sensitive fields
 */
export type PublicUser = Omit<User, 'passwordHash'>;

/**
 * Database row type (matches Supabase schema)
 */
export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  tier: string;
  subscription_status: string;
  subscription_period: string | null;
  reflection_count_this_month: number;
  total_reflections: number;
  current_month_year: string;
  is_creator: boolean;
  is_admin: boolean;
  language: string;
  email_verified: boolean;
  created_at: string;
  last_sign_in_at: string;
  updated_at: string;
}

/**
 * Transform database row to User type
 */
export function userRowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    tier: row.tier as SubscriptionTier,
    subscriptionStatus: row.subscription_status as SubscriptionStatus,
    subscriptionPeriod: row.subscription_period as 'monthly' | 'yearly' | null,
    reflectionCountThisMonth: row.reflection_count_this_month,
    totalReflections: row.total_reflections,
    currentMonthYear: row.current_month_year,
    isCreator: row.is_creator,
    isAdmin: row.is_admin,
    language: row.language as Language,
    emailVerified: row.email_verified,
    createdAt: row.created_at,
    lastSignInAt: row.last_sign_in_at,
    updatedAt: row.updated_at,
  };
}

/**
 * User creation input (for signup)
 */
export interface UserCreateInput {
  email: string;
  password: string;
  name: string;
  language?: Language;
  tier?: SubscriptionTier;
}

/**
 * User update input
 */
export interface UserUpdateInput {
  name?: string;
  language?: Language;
  tier?: SubscriptionTier;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionPeriod?: 'monthly' | 'yearly' | null;
}
