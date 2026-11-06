export const AI_MEMBERSHIP = {
  type: "ai_working_tennis_pro",
  productName: "AI for the Working Tennis Pro — Membership",
  amountCents: 2000,
  currency: "usd",
  interval: "month",
} as const;

export const AI_GUIDES = [
  { slot: "guide-1", label: "Guide 1", title: "Build Your Academy App with AI" },
  { slot: "guide-2", label: "Guide 2", title: "Make a 30-Second Teaching Drama" },
  { slot: "guide-3", label: "Guide 3", title: "Marketing Videos with AI" },
  { slot: "guide-4", label: "Guide 4", title: "Your AI Assistant, Every Day" },
  { slot: "guide-5", label: "Guide 5", title: "The Prompt Library" },
  { slot: "new-guides", label: "New Guides", title: "New Guides as I Learn Them" },
] as const;

export function normalizeMemberEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isMembershipOrigin(origin: string, allowDevelopment = typeof process !== "undefined" && process.env.NODE_ENV !== "production"): boolean {
  try {
    const url = new URL(origin);
    if (url.origin !== origin) return false;
    if (allowDevelopment && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)) return true;
    return url.protocol === "https:" && (
      ["tennispromario.com", "www.tennispromario.com", "ritennisacademy.com", "www.ritennisacademy.com", "tennispro-kzzfscru.manus.space"].includes(url.hostname) ||
      (allowDevelopment && /^3000-[a-z0-9-]+\.us[0-9]+\.manus\.computer$/.test(url.hostname))
    );
  } catch { return false; }
}

export function subscriptionGrantsAccess(subscription: { status: string; paidThrough: Date | null; livemode: boolean }, now = new Date()): boolean {
  // An active flag alone is insufficient: require a paid, unexpired billing period.
  return subscription.livemode && subscription.status === "active" && !!subscription.paidThrough && subscription.paidThrough.getTime() > now.getTime();
}
