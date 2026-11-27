import { expect, test } from "bun:test";
import { attachmentDisplayName } from "./attachments";

test("attachmentDisplayName drops the storage prefix and query", () => {
  expect(
    attachmentDisplayName(
      "https://b.sgp1.digitaloceanspaces.com/cherry-sky-kost/leases/x/1732700000000-3f9a1c2e-4b5d-4e6f-8a9b-0c1d2e3f4a5b-perjanjian-sewa.pdf?X-Amz-Signature=abc",
    ),
  ).toBe("perjanjian-sewa.pdf");
  expect(attachmentDisplayName("https://h/a/photo.webp")).toBe("photo.webp");
  expect(attachmentDisplayName("not a url")).toBe("not a url");
});
