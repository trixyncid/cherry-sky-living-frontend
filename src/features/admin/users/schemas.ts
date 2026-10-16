import { z } from "zod";
import { isValidIndonesianPhone } from "@/lib/phone";

export type UserFormMessages = {
  nameRequired: string;
  emailInvalid: string;
  phoneRequired: string;
  phoneInvalid: string;
  passwordMin: string;
};

const optionalEmail = (emailInvalid: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().email(emailInvalid).optional(),
  );

const phoneField = (messages: Pick<UserFormMessages, "phoneRequired" | "phoneInvalid">) =>
  z
    .string()
    .trim()
    .min(1, messages.phoneRequired)
    .refine(isValidIndonesianPhone, messages.phoneInvalid);

export function createTenantUserSchema(messages: UserFormMessages) {
  return z.object({
    name: z.string().trim().min(1, messages.nameRequired),
    phoneNumber: phoneField(messages),
    email: optionalEmail(messages.emailInvalid),
    password: z.string().min(8, messages.passwordMin),
  });
}

export function updateTenantUserSchema(
  messages: Pick<
    UserFormMessages,
    "nameRequired" | "emailInvalid" | "phoneRequired" | "phoneInvalid"
  >,
) {
  return z.object({
    name: z.string().trim().min(1, messages.nameRequired),
    phoneNumber: phoneField(messages),
    email: optionalEmail(messages.emailInvalid),
  });
}

export type CreateTenantUserValues = z.infer<
  ReturnType<typeof createTenantUserSchema>
>;
export type UpdateTenantUserValues = z.infer<
  ReturnType<typeof updateTenantUserSchema>
>;
