import { expect, test } from "bun:test";
import { generateReadablePassword } from "./password";

test("generateReadablePassword is long enough and avoids look-alikes", () => {
  for (let i = 0; i < 50; i++) {
    const pw = generateReadablePassword();
    expect(pw).toHaveLength(10);
    expect(pw).not.toMatch(/[01OIl]/);
  }
});
