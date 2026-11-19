// @vitest-environment node
import { describe, expect, it } from "vitest";
import { decryptBackup, encryptBackup } from "@/lib/backup/crypto";

describe("encrypted backup round trip", () => {
  it("decrypts to the original data with the correct passphrase", async () => {
    const data = { farmerName: "Test Farmer", plots: [{ id: "p1" }] };
    const backup = await encryptBackup(data, "correct-passphrase");
    const restored = await decryptBackup<typeof data>(backup, "correct-passphrase");
    expect(restored).toEqual(data);
  });

  it("fails to decrypt with the wrong passphrase", async () => {
    const backup = await encryptBackup({ secret: 42 }, "right-pass");
    await expect(decryptBackup(backup, "wrong-pass")).rejects.toBeTruthy();
  });

  it("produces different ciphertext for the same data on each call (random salt/iv)", async () => {
    const a = await encryptBackup({ x: 1 }, "pass");
    const b = await encryptBackup({ x: 1 }, "pass");
    expect(a.cipherTextBase64).not.toBe(b.cipherTextBase64);
  });
});
