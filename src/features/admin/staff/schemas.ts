import { z } from "zod";

export const staffRoleSchema = z.enum(["admin", "superadmin"]);

export type StaffFormMessages = {
  nameRequired: string;
  emailInvalid: string;
  passwordMin: string;
};

export function createStaffUserSchema(messages: StaffFormMessages) {
  return z.object({
    name: z.string().trim().min(1, messages.nameRequired),
    email: z.string().trim().email(messages.emailInvalid),
    password: z.string().min(8, messages.passwordMin),
    role: staffRoleSchema,
  });
}

export function updateStaffUserSchema(
  messages: Pick<StaffFormMessages, "nameRequired" | "emailInvalid">,
) {
  return z.object({
    name: z.string().trim().min(1, messages.nameRequired),
    email: z.string().trim().email(messages.emailInvalid),
    role: staffRoleSchema,
  });
}

export type CreateStaffUserValues = z.infer<ReturnType<typeof createStaffUserSchema>>;
export type UpdateStaffUserValues = z.infer<ReturnType<typeof updateStaffUserSchema>>;
