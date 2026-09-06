import { z } from "zod";

export type UserFormMessages = {
  nameRequired: string;
  emailInvalid: string;
  passwordMin: string;
};

export function createTenantUserSchema(messages: UserFormMessages) {
  return z.object({
    name: z.string().trim().min(1, messages.nameRequired),
    email: z.string().trim().email(messages.emailInvalid),
    password: z.string().min(8, messages.passwordMin),
  });
}

export function updateTenantUserSchema(messages: Pick<UserFormMessages, "nameRequired" | "emailInvalid">) {
  return z.object({
    name: z.string().trim().min(1, messages.nameRequired),
    email: z.string().trim().email(messages.emailInvalid),
  });
}

export type CreateTenantUserValues = z.infer<ReturnType<typeof createTenantUserSchema>>;
export type UpdateTenantUserValues = z.infer<ReturnType<typeof updateTenantUserSchema>>;
