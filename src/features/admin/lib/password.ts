/** No look-alikes (0/O, 1/l/I) so it can be read out or typed from a chat. */
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Readable random password for a new account, e.g. "k7Rm3xQa9p". */
export function generateReadablePassword(length = 10): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
