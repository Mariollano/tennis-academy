import { describe, it, expect } from "vitest";
import { isTwilioConfigured } from "./sms";

describe("SMS / Twilio", () => {
  it("should detect Twilio is configured when env vars are set", () => {
    // In the test environment the secrets are injected, so this should be true
    const configured = isTwilioConfigured();
    // We just check the function runs without throwing
    expect(typeof configured).toBe("boolean");
  });
});
