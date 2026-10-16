export interface TenantProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  role: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}
