import { z } from "zod";

/** Mirrors backend `property.schema.ts` ranges. */
export const propertyFormSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  paymentDueDay: z.number().int().min(1).max(28),
  lateFeePerDay: z.number().int().min(0),
  renewalConfirmDaysBeforeEnd: z.number().int().min(1).max(28),
  /** Refundable deposit (Rp); null = not set, hidden on the website. */
  depositAmount: z.number().int().min(0).nullable(),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export const unitTypeSizeSchema = z.number().int().positive().nullable();

export const unitMaxOccupancySchema = z.number().int().positive().nullable();
