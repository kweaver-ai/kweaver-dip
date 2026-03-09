import dayjs from "dayjs";

export function formatDateTime(value: string | number | Date | null | undefined) {
  return value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "- -";
}

export function formatDateTimeSlash(
  value: string | number | Date | null | undefined
) {
  return value ? dayjs(value).format("YYYY/MM/DD HH:mm:ss") : "- -";
}

export function formatDateTimeMinute(
  value: string | number | Date | null | undefined
) {
  return value ? dayjs(value).format("YYYY/MM/DD HH:mm") : "- -";
}
