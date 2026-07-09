// Shared client types for the booking wizard (serialized from the server).

export type PaymentChoice = "DEPOSIT" | "FULL";

export type WizardArtist = {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  styles: string[];
  avatarUrl: string | null;
};

export type WizardType = {
  id: string;
  slug: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  depositCents: number;
  paymentPolicy: "DEPOSIT_REQUIRED" | "FULL_REQUIRED" | "CUSTOMER_CHOICE";
  requiresIntake: boolean;
  color: string;
  allowedChoices: PaymentChoice[];
  artists: WizardArtist[];
};

export type ReferenceImage = {
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type Slot = {
  start: string;
  end: string;
  available: boolean;
};
