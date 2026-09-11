export const DONATION = {
  amountCents: 3500,
  amountLabel: "$35",
  productName: "RI Tennis Academy Donation",
  productDescription: "Thank you for supporting Coach Mario and RI Tennis Academy.",
} as const;

export function isAllowedReturnOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost");
  } catch {
    return false;
  }
}
