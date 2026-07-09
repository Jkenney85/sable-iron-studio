// Centralized, typed access to environment variables with helpful fallbacks.
// Anything security-sensitive is read here so misconfiguration fails loudly.

export const env = {
  appUrl:
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",

  authSecret: process.env.AUTH_SECRET || "",

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    currency: (process.env.PAYMENT_CURRENCY || "usd").toLowerCase(),
  },

  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    secure: process.env.SMTP_SECURE === "true",
    from: process.env.EMAIL_FROM || "Sable & Iron <bookings@example.com>",
    studioInbox:
      process.env.STUDIO_NOTIFICATION_EMAIL || "studio@example.com",
  },
};

export const isStripeConfigured = () =>
  env.stripe.secretKey.startsWith("sk_") &&
  env.stripe.publishableKey.startsWith("pk_");

export const isEmailConfigured = () => Boolean(env.smtp.host);
