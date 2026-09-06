import { authClient } from "@/lib/auth/client";

/** Sign out on the API, then expire frontend session cookies. */
export async function signOutClient(): Promise<void> {
  try {
    await authClient.signOut();
  } catch {
    // Continue so frontend cookies still clear.
  }

  try {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Cookie cleanup is best-effort after API sign-out.
  }
}
