// SMS diagnostic script
const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const phone = process.env.TWILIO_PHONE_NUMBER;

console.log("=== Twilio Diagnostic ===");
console.log("TWILIO_ACCOUNT_SID:", sid ? `SET (${sid.substring(0, 6)}...)` : "NOT SET");
console.log("TWILIO_AUTH_TOKEN:", token ? "SET" : "NOT SET");
console.log("TWILIO_PHONE_NUMBER:", phone || "NOT SET");

if (!sid || !token || !phone) {
  console.log("\n❌ Twilio credentials are missing. SMS will not work.");
  process.exit(1);
}

// Try to validate credentials by fetching account info
const auth = Buffer.from(`${sid}:${token}`).toString("base64");
const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
  headers: { Authorization: `Basic ${auth}` }
});
const data = await resp.json();

if (resp.ok) {
  console.log("\n✅ Twilio credentials are VALID");
  console.log("Account status:", data.status);
  console.log("Account friendly name:", data.friendly_name);
} else {
  console.log("\n❌ Twilio credentials are INVALID:", data.message || data.code);
}

// Check if the phone number format is correct
if (phone) {
  const digits = phone.replace(/\D/g, "");
  if (!phone.startsWith("+")) {
    console.log("\n⚠️  PHONE NUMBER FORMAT ISSUE: TWILIO_PHONE_NUMBER should start with + (e.g. +14015551234), got:", phone);
  } else {
    console.log("\n✅ Phone number format looks correct:", phone);
  }
}
