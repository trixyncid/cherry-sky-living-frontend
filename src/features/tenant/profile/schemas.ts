import { z } from "zod";

export type ProfileFormMessages = {
  nameRequired: string;
  currentPasswordRequired: string;
  newPasswordMin: string;
  confirmPasswordRequired: string;
  passwordsMismatch: string;
};

export function createProfileSchema(messages: Pick<ProfileFormMessages, "nameRequired">) {
  return z.object({
    name: z.string().trim().min(1, messages.nameRequired),
  });
}

export function createPasswordSchema(messages: ProfileFormMessages) {
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
});

/** @deprecated Prefer createPasswordSchema(messages) for localized validation. */
export const tenantPasswordSchema = createPasswordSchema({
  nameRequired: "Name is required",
  currentPasswordRequired: "Current password is required",
  newPasswordMin: "New password must be at least 8 characters",
  confirmPasswordRequired: "Please confirm your new password",
  passwordsMismatch: "Passwords do not match",
});

export type TenantProfileValues = z.infer<ReturnType<typeof createProfileSchema>>;
export type TenantPasswordValues = z.infer<ReturnType<typeof createPasswordSchema>>;
