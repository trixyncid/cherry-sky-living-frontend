import { z } from "zod";

export function createLeaseFormSchema(messages: {
  unit: string;
  tenant: string;
  startDate: string;
  endDate: string;
  pricing: string;
}) {
  return z.object({
    unitId: z.string().trim().min(1, messages.unit),
    userId: z.string().trim().min(1, messages.tenant),
    startDate: z.string().trim().min(1, messages.startDate),
    endDate: z.string().trim().min(1, messages.endDate),
    unitPricingId: z.string().trim().min(1, messages.pricing),
  });
}
