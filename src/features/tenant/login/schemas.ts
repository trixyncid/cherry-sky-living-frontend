import { z } from "zod";
import {
  isValidIndonesianPhone,
  looksLikeEmail,
  normalizeIndonesianPhone,
} from "@/lib/phone";

export const tenantLoginSchema = z
  .object({
    identifier: z.string().trim().min(1),
    password: z.string().min(1, "Password is required"),
  })
  .superRefine((data, ctx) => {
    if (looksLikeEmail(data.identifier)) {
      if (!z.string().email().safeParse(data.identifier).success) {
        ctx.addIssue({
          code: "custom",
          path: ["identifier"],
          message: "Invalid email",
        });
      }
      return;
    }
    if (!isValidIndonesianPhone(data.identifier)) {
      ctx.addIssue({
        code: "custom",
        path: ["identifier"],
        message: "Invalid phone number",
      });
    }
  });

export type TenantLoginValues = z.infer<typeof tenantLoginSchema>;

export function resolveTenantLoginIdentifier(
  identifier: string,
):
  | { kind: "email"; email: string }
  | { kind: "phone"; phoneNumber: string }
  | null {
  const trimmed = identifier.trim();
  if (looksLikeEmail(trimmed)) {
    if (!z.string().email().safeParse(trimmed).success) return null;
    return { kind: "email", email: trimmed.toLowerCase() };
  }
  const phoneNumber = normalizeIndonesianPhone(trimmed);
  if (!phoneNumber) return null;
  return { kind: "phone", phoneNumber };
}
