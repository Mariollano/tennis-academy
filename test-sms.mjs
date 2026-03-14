// Test SMS send and check phone number capabilities
const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;
const auth = Buffer.from(`${sid}:${token}`).toString("base64");

console.log("=== Checking phone number capabilities ===");

// Check the incoming phone numbers to see what capabilities the number has
const numbersResp = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(fromPhone)}`,
  { headers: { Authorization: `Basic ${auth}` } }
);
const numbersData = await numbersResp.json();

if (numbersData.incoming_phone_numbers && numbersData.incoming_phone_numbers.length > 0) {
  const num = numbersData.incoming_phone_numbers[0];
  console.log("Number:", num.phone_number);
  console.log("Friendly name:", num.friendly_name);
  console.log("Capabilities:", JSON.stringify(num.capabilities, null, 2));
  console.log("SMS enabled:", num.capabilities?.sms);
} else {
  console.log("Number not found in incoming numbers, checking all numbers...");
  const allResp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  const allData = await allResp.json();
  console.log("All numbers:", allData.incoming_phone_numbers?.map(n => ({
    number: n.phone_number,
    sms: n.capabilities?.sms,
    mms: n.capabilities?.mms
  })));
}

// Check recent messages to see if any were sent/failed
console.log("\n=== Recent Twilio Messages (last 5) ===");
const msgsResp = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json?PageSize=5`,
  { headers: { Authorization: `Basic ${auth}` } }
);
const msgsData = await msgsResp.json();
if (msgsData.messages && msgsData.messages.length > 0) {
  for (const msg of msgsData.messages) {
    console.log(`[${msg.date_sent}] ${msg.from} → ${msg.to}: ${msg.status} | Error: ${msg.error_code || 'none'} | Body: ${msg.body?.substring(0, 50)}`);
  }
} else {
  console.log("No messages found — SMS has never been sent from this account");
}
