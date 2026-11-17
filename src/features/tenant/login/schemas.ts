import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

export type TenantLoginMethod = "phone" | "email";

export type TenantLoginValues = {
  method: TenantLoginMethod;
  /** E.164 from the country picker, e.g. "+6281234567890". */
  phone: string;
  email: string;
  password: string;
};

/** The credentials to send, or null when the chosen field is invalid. */
export function resolveTenantLogin(
  values: TenantLoginValues,
):
  | { kind: "email"; email: string; password: string }
  | { kind: "phone"; phoneNumber: string; password: string }
  | null {
  if (!values.password) return null;
  if (values.method === "email") {
    const email = values.email.trim().toLowerCase();
    if (!z.string().email().safeParse(email).success) return null;
    return { kind: "email", email, password: values.password };
  }
  const phoneNumber = normalizePhone(values.phone);
  if (!phoneNumber) return null;
  return { kind: "phone", phoneNumber, password: values.password };
}
