import type { UserPhone } from "@/lib/types/admin";

export interface TenantProfile {
  id: string;
  name: string;
  email: string;
  /** The number they sign in with (always one of `phones`). */
  phoneNumber?: string | null;
  phones?: UserPhone[];
  role: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}
