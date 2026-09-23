export const CLINIC_105_WEEKDAY_CAP = 4;
export const CLINIC_105_MORNING_START_TIME = "09:00";
export const CLINIC_105_MORNING_END_TIME = "10:30";

export function isMorningTime(time: string): boolean {
  const [hourText] = time.split(":");
  const hour = Number.parseInt(hourText ?? "", 10);
  return Number.isInteger(hour) && hour >= 0 && hour < 12;
}

export function isMorningClinicWindow(startTime: string, endTime: string): boolean {
  return isMorningTime(startTime) && isMorningTime(endTime);
}
