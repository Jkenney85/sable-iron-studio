import Stripe from "stripe";
import { env, isStripeConfigured } from "./env";

// Lazily construct the Stripe client so the app still boots (and the public
// site still renders) when keys are not yet configured — checkout will surface
// a clear error instead of crashing the whole server.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY."
    );
  }
  if (!_stripe) {
    // apiVersion intentionally omitted — uses the SDK's pinned version so this
    // isn't coupled to a specific dated release. Pin it here if you need to.
    _stripe = new Stripe(env.stripe.secretKey, {
      appInfo: { name: "Sable & Iron Booking" },
    });
  }
  return _stripe;
}

export { isStripeConfigured };
