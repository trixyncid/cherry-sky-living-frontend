import { createAuthClient } from "better-auth/react";
import { phoneNumberClient } from "better-auth/client/plugins";
import { getClientAuthBaseUrl } from "@/lib/api/base-url";

export const authClient = createAuthClient({
  // Resolved when the client bundle loads in the browser (window is defined).
  baseURL: getClientAuthBaseUrl(),
  plugins: [phoneNumberClient()],
});
