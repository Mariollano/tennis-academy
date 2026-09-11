import { describe, expect, it } from "vitest";
import { DONATION, isAllowedReturnOrigin } from "../shared/donation";

describe("$35 donation configuration", () => {
  it("uses the approved $35 payment amount", () => {
    expect(DONATION.amountCents).toBe(3500);
    expect(DONATION.amountLabel).toBe("$35");
  });

  it("only accepts safe return origins for checkout", () => {
    expect(isAllowedReturnOrigin("https://tennispromario.com")).toBe(true);
    expect(isAllowedReturnOrigin("http://localhost:3000")).toBe(true);
    expect(isAllowedReturnOrigin("javascript:alert(1)")).toBe(false);
  });
});
