import { z } from "zod";

export type AdminProfileFormMessages = {
  nameRequired: string;
  currentPasswordRequired: string;
  newPasswordMin: string;
  confirmPasswordRequired: string;
  passwordsMismatch: string;
};

export function createAdminProfileSchema(
  messages: Pick<AdminProfileFormMessages, "nameRequired">,
) {
  return z.object({
    name: z.string().trim().min(1, messages.nameRequired),
  });
}

export function createAdminPasswordSchema(
  messages: Pick<
    AdminProfileFormMessages,
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

export type AdminProfileValues = z.infer<
  ReturnType<typeof createAdminProfileSchema>
>;
export type AdminPasswordValues = z.infer<
  ReturnType<typeof createAdminPasswordSchema>
>;
