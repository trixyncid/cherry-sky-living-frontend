import { z } from "zod";
import { isValidIndonesianPhone } from "@/lib/phone";

export type ProfileFormMessages = {
  nameRequired: string;
  phoneRequired: string;
  phoneInvalid: string;
  currentPasswordRequired: string;
  newPasswordMin: string;
  confirmPasswordRequired: string;
  passwordsMismatch: string;
};

export function createProfileSchema(
  messages: Pick<
    ProfileFormMessages,
    "nameRequired" | "phoneRequired" | "phoneInvalid"
  >,
) {
  return z.object({
    name: z.string().trim().min(1, messages.nameRequired),
    phoneNumber: z
      .string()
      .trim()
      .min(1, messages.phoneRequired)
      .refine(isValidIndonesianPhone, messages.phoneInvalid),
  });
}

export function createPasswordSchema(
  messages: Pick<
    ProfileFormMessages,
    | "currentPasswordRequired"
    | "newPasswordMin"
    | "confirmPasswordRequired"
    | "passwordsMismatch"
  >,
) {
  return z
    .object({
      currentPassword: z.string().min(1, messages.currentPasswordRequired),
      newPassword: z.string().min(8, messages.newPasswordMin),
      confirmPassword: z.string().min(1, messages.confirmPasswordRequired),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: messages.passwordsMismatch,
      path: ["confirmPassword"],
    });
}

/** @deprecated Prefer createProfileSchema(messages) for localized validation. */
export const tenantProfileSchema = createProfileSchema({
  nameRequired: "Name is required",
  phoneRequired: "Phone number is required",
  phoneInvalid: "Enter a valid Indonesian mobile number",
});

/** @deprecated Prefer createPasswordSchema(messages) for localized validation. */
export const tenantPasswordSchema = createPasswordSchema({
  currentPasswordRequired: "Current password is required",
  newPasswordMin: "New password must be at least 8 characters",
  confirmPasswordRequired: "Please confirm your new password",
  passwordsMismatch: "Passwords do not match",
});

export type TenantProfileValues = z.infer<ReturnType<typeof createProfileSchema>>;
export type TenantPasswordValues = z.infer<ReturnType<typeof createPasswordSchema>>;
