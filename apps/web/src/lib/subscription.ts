/**
 * Normalize plan from API (Prisma enums often serialize as FREE/PRO) or shared types (free/pro).
 */
export type EffectivePlan = 'free' | 'pro';

export function getEffectivePlan(user: { plan?: unknown } | null): EffectivePlan | null {
  if (!user?.plan) return null;
  const p = String(user.plan).toLowerCase();
  if (p === 'free') return 'free';
  if (p === 'pro') return 'pro';
  return null;
}

export function planDisplayName(plan: EffectivePlan): string {
  return plan === 'pro' ? 'Pro' : 'Free';
}
