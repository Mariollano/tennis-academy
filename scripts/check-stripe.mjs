import 'dotenv/config';

const key = process.env.STRIPE_SECRET_KEY || '';
const pubKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

console.log('STRIPE_SECRET_KEY present:', !!key);
console.log('Key prefix:', key.substring(0, 10) + '...');
console.log('Is live key:', key.startsWith('sk_live'));
console.log('Is test key:', key.startsWith('sk_test'));
console.log('');
console.log('VITE_STRIPE_PUBLISHABLE_KEY present:', !!pubKey);
console.log('Pub key prefix:', pubKey.substring(0, 10) + '...');
console.log('Pub is live:', pubKey.startsWith('pk_live'));
console.log('Pub is test:', pubKey.startsWith('pk_test'));

// Try to make a simple Stripe API call
import Stripe from 'stripe';
const stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' });
try {
  const balance = await stripe.balance.retrieve();
  console.log('\nStripe API call SUCCESS');
  console.log('Available balance:', balance.available);
} catch (err) {
  console.log('\nStripe API call FAILED:', err.message);
  console.log('Error type:', err.type);
  console.log('Error code:', err.code);
}
