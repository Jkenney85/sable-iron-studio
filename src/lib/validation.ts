import { z } from "zod";

// Shared validation schemas. Used by both API routes (server) and, where useful,
// client forms so the two never drift.

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal("")),
});

export const intakeSchema = z.object({
  placement: z.string().trim().max(120).optional().or(z.literal("")),
  approxSize: z.string().trim().max(80).optional().or(z.literal("")),
  style: z.string().trim().max(120).optional().or(z.literal("")),
  budget: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  isColor: z.boolean().optional(),
  isCoverUp: z.boolean().optional(),
  // Reference images are uploaded first (see /api/upload) and passed here by
  // their stored metadata.
  referenceImages: z
    .array(
      z.object({
        url: z.string().min(1),
        fileName: z.string().min(1),
        mimeType: z.string().min(1),
        sizeBytes: z.number().int().nonnegative(),
      })
    )
    .max(6)
    .optional(),
});

export const createBookingSchema = z.object({
  appointmentTypeId: z.string().min(1),
  artistId: z.string().min(1),
  startTime: z.string().datetime(),
  paymentChoice: z.enum(["DEPOSIT", "FULL"]),
  customer: customerSchema,
  intake: intakeSchema.optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  message: z.string().trim().min(10, "Tell us a little more").max(3000),
});
