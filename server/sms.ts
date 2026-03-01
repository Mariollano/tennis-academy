import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

function getClient() {
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }
  return twilio(accountSid, authToken);
}

export async function sendSms(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    if (!fromNumber) throw new Error("TWILIO_PHONE_NUMBER not configured");
    // Normalize phone number — ensure it starts with +1 for US numbers
    let toNumber = to.replace(/\D/g, "");
    if (toNumber.length === 10) toNumber = `+1${toNumber}`;
    else if (toNumber.length === 11 && toNumber.startsWith("1")) toNumber = `+${toNumber}`;
    else toNumber = `+${toNumber}`;

    const client = getClient();
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: toNumber,
    });
    console.log(`[SMS] Sent to ${toNumber}: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (err: any) {
    console.error(`[SMS] Failed to send to ${to}:`, err?.message || err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}

export async function sendBulkSms(
  recipients: { phone: string; name?: string | null }[],
  body: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  for (const recipient of recipients) {
    const result = await sendSms(recipient.phone, body);
    if (result.success) sent++;
    else failed++;
  }
  return { sent, failed };
}

export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && fromNumber);
}
