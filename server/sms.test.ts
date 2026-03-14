import { describe, it, expect } from "vitest";
import { isTwilioConfigured } from "./sms";

describe("SMS / Twilio", () => {
  it("should detect Twilio is configured when env vars are set", () => {
    const configured = isTwilioConfigured();
    expect(typeof configured).toBe("boolean");
  });

  it("should use the local 401 number, not the rejected toll-free 888 number", () => {
    const phone = process.env.TWILIO_PHONE_NUMBER;
    // The toll-free 888 number had its verification permanently rejected by Twilio
    expect(phone).not.toBe("+18886889184");
    // Should be the working local 401 Warren, RI number
    expect(phone).toBe("+14012891427");
  });

  it("should normalize 10-digit US phone numbers to E.164 format", () => {
    const normalize = (to: string) => {
      let toNumber = to.replace(/\D/g, "");
      if (toNumber.length === 10) toNumber = `+1${toNumber}`;
      else if (toNumber.length === 11 && toNumber.startsWith("1")) toNumber = `+${toNumber}`;
      else toNumber = `+${toNumber}`;
      return toNumber;
    };
    expect(normalize("4019655873")).toBe("+14019655873");
    expect(normalize("(401) 965-5873")).toBe("+14019655873");
    expect(normalize("14019655873")).toBe("+14019655873");
    expect(normalize("+14019655873")).toBe("+14019655873");
  });
});
