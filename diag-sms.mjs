const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const phone = process.env.TWILIO_PHONE_NUMBER;
const auth = Buffer.from(`${sid}:${token}`).toString("base64");

console.log("=== Twilio Deep Diagnostic ===");
console.log("From number:", phone);

// 1. Check account status and balance
const acctResp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
  headers: { Authorization: `Basic ${auth}` }
});
const acct = await acctResp.json();
console.log("\n--- Account ---");
console.log("Status:", acct.status);
console.log("Type:", acct.type);

// 2. Check balance
const balResp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Balance.json`, {
  headers: { Authorization: `Basic ${auth}` }
});
const bal = await balResp.json();
console.log("Balance:", bal.balance, bal.currency);

// 3. Check the 401 number capabilities in detail
const numResp = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(phone)}`,
  { headers: { Authorization: `Basic ${auth}` } }
);
const numData = await numResp.json();
const num = numData.incoming_phone_numbers?.[0];
console.log("\n--- Phone Number ---");
if (num) {
  console.log("Number:", num.phone_number);
  console.log("SMS capable:", num.capabilities?.sms);
  console.log("SMS URL:", num.sms_url || "(none)");
  console.log("SMS method:", num.sms_method || "(none)");
} else {
  console.log("Number NOT found in account!");
}

// 4. Check last 10 messages for any from the 401 number
const msgsResp = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json?PageSize=10&From=${encodeURIComponent(phone)}`,
  { headers: { Authorization: `Basic ${auth}` } }
);
const msgs = await msgsResp.json();
console.log("\n--- Recent Messages from 401 number ---");
if (msgs.messages?.length > 0) {
  for (const m of msgs.messages) {
    console.log(`[${m.date_sent}] → ${m.to}: ${m.status} | Error: ${m.error_code || 'none'} | ${m.error_message || ''}`);
  }
} else {
  console.log("No messages sent from this number yet");
}

// 5. Check ALL recent messages regardless of from number
const allMsgsResp = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json?PageSize=5`,
  { headers: { Authorization: `Basic ${auth}` } }
);
const allMsgs = await allMsgsResp.json();
console.log("\n--- All Recent Messages (last 5) ---");
for (const m of (allMsgs.messages || [])) {
  console.log(`[${m.date_sent}] ${m.from} → ${m.to}: ${m.status} | Error: ${m.error_code || 'none'} | ${m.error_message || ''}`);
}

// 6. Try to send a test SMS to Mario's number
console.log("\n--- Sending test SMS ---");
const testBody = new URLSearchParams({
  From: phone,
  To: "+14019655873",
  Body: "RI Tennis Academy test SMS - if you receive this, SMS is working!"
});
const sendResp = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
  {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: testBody.toString()
  }
);
const sendData = await sendResp.json();
if (sendResp.ok) {
  console.log("✅ SMS queued! SID:", sendData.sid, "Status:", sendData.status);
} else {
  console.log("❌ SMS FAILED:", sendData.code, sendData.message);
  console.log("More info:", sendData.more_info);
}
