import type { AppointmentType } from "@prisma/client";
import { PaymentPolicy } from "@prisma/client";

export type PaymentChoice = "DEPOSIT" | "FULL";

/** Which payment choices a customer may pick for this appointment type. */
export function allowedChoices(type: {
  paymentPolicy: PaymentPolicy;
  depositCents: number;
  priceCents: number;
}): PaymentChoice[] {
  switch (type.paymentPolicy) {
    case PaymentPolicy.DEPOSIT_REQUIRED:
      return ["DEPOSIT"];
    case PaymentPolicy.FULL_REQUIRED:
      return ["FULL"];
    case PaymentPolicy.CUSTOMER_CHOICE:
      // Only offer FULL if a full price exists.
      return type.priceCents > 0 ? ["DEPOSIT", "FULL"] : ["DEPOSIT"];
    default:
      return ["DEPOSIT"];
  }
}

/**
 * Resolve the amount to charge now for a given choice, validating that the choice
 * is permitted by the appointment type's policy. Returns cents.
 */
export function resolveAmountCents(
  type: Pick<
    AppointmentType,
    "paymentPolicy" | "depositCents" | "priceCents"
  >,
  choice: PaymentChoice
): { ok: true; amountCents: number } | { ok: false; reason: string } {
  const allowed = allowedChoices(type);
  if (!allowed.includes(choice)) {
    return {
      ok: false,
      reason: `Payment option "${choice}" is not available for this appointment type.`,
    };
  }
  const amountCents = choice === "DEPOSIT" ? type.depositCents : type.priceCents;
  if (amountCents <= 0) {
    return {
      ok: false,
      reason: "This appointment type has no charge configured for that option.",
    };
  }
  return { ok: true, amountCents };
}

export function policyLabel(policy: PaymentPolicy): string {
  switch (policy) {
    case PaymentPolicy.DEPOSIT_REQUIRED:
      return "Deposit required";
    case PaymentPolicy.FULL_REQUIRED:
      return "Full payment";
    case PaymentPolicy.CUSTOMER_CHOICE:
      return "Deposit or full payment";
    default:
      return "";
  }
}
