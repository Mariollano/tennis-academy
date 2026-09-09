export const PRIVATE_CLINIC = {
  title: "Private Clinic",
  price: "$35",
  sessionLength: "1.5-hour session",
  schedule: "Tuesdays & Saturdays · 9:00–10:30 AM",
  availability: "Invitation Only",
  textNumber: "4019655873",
  displayPhone: "(401) 965-5873",
} as const;

export const privateClinicSmsHref = `sms:${PRIVATE_CLINIC.textNumber}?body=${encodeURIComponent(
  "Hi Coach Mario, I'm interested in the Private Clinic."
)}`;
