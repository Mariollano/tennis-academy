// Validate the new TWILIO_PHONE_NUMBER (+14012891427) is owned by this account
const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const phone = process.env.TWILIO_PHONE_NUMBER;
const auth = Buffer.from(`${sid}:${token}`).toString("base64");

console.log("=== Validating new Twilio phone number ===");
console.log("TWILIO_PHONE_NUMBER:", phone);

if (phone !== "+14012891427") {
  console.log("❌ Phone number not updated yet, got:", phone);
  process.exit(1);
}

// Check the number is in the account and SMS-capable
const resp = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(phone)}`,
  { headers: { Authorization: `Basic ${auth}` } }
);
const data = await resp.json();
const num = data.incoming_phone_numbers?.[0];

if (!num) {
  console.log("❌ Number not found in account");
  process.exit(1);
}

console.log("✅ Number found:", num.phone_number);
console.log("SMS capable:", num.capabilities?.sms);
console.log("MMS capable:", num.capabilities?.mms);

if (!num.capabilities?.sms) {
  console.log("❌ Number is NOT SMS capable");
  process.exit(1);
}

console.log("\n✅ All checks passed — SMS will now send from +1 (401) 289-1427");
