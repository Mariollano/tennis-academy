const secretKey = process.env.STRIPE_SECRET_KEY || '';
const pubKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

console.log('=== Stripe Key Check ===');
if (!secretKey) {
  console.log('SECRET KEY: NOT SET');
} else if (secretKey.startsWith('sk_live_')) {
  console.log('SECRET KEY: LIVE ✅ (prefix:', secretKey.substring(0, 14) + '...)');
} else if (secretKey.startsWith('sk_test_')) {
  console.log('SECRET KEY: TEST MODE ⚠️  (prefix:', secretKey.substring(0, 14) + '...)');
} else {
  console.log('SECRET KEY: UNKNOWN FORMAT (prefix:', secretKey.substring(0, 8) + '...)');
}

if (!pubKey) {
  console.log('PUBLISHABLE KEY: NOT SET');
} else if (pubKey.startsWith('pk_live_')) {
  console.log('PUBLISHABLE KEY: LIVE ✅ (prefix:', pubKey.substring(0, 14) + '...)');
} else if (pubKey.startsWith('pk_test_')) {
  console.log('PUBLISHABLE KEY: TEST MODE ⚠️  (prefix:', pubKey.substring(0, 14) + '...)');
} else {
  console.log('PUBLISHABLE KEY: UNKNOWN FORMAT');
}

if (!webhookSecret) {
  console.log('WEBHOOK SECRET: NOT SET');
} else {
  console.log('WEBHOOK SECRET: SET ✅ (prefix:', webhookSecret.substring(0, 8) + '...)');
}

// Try a real Stripe API call to verify the key works
import Stripe from 'stripe';
const stripe = new Stripe(secretKey);
try {
  const account = await stripe.accounts.retrieve();
  console.log('\nStripe account verified ✅');
  console.log('Account ID:', account.id);
  console.log('Charges enabled:', account.charges_enabled);
  console.log('Payouts enabled:', account.payouts_enabled);
} catch (err) {
  console.log('\nStripe API call FAILED ❌');
  console.log('Error:', err.message);
}
