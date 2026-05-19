import dotenv from "dotenv";
dotenv.config();

const sid = process.env.TWILIO_ACCOUNT_SID;
const auth = process.env.TWILIO_AUTH_TOKEN;
const phone = process.env.TWILIO_PHONE_NUMBER;

console.log("TWILIO_ACCOUNT_SID:", sid ? `SET (${sid.substring(0,6)}...)` : "MISSING");
console.log("TWILIO_AUTH_TOKEN:", auth ? "SET" : "MISSING");
console.log("TWILIO_PHONE_NUMBER:", phone || "MISSING");
console.log("isTwilioConfigured:", !!(sid && auth && phone));
