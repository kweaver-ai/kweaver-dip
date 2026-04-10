import dayjs from 'dayjs';

export function toDateString(date: string | number | Date, format = 'YYYY/MM/DD HH:mm'): string {
  if (!date) return '';
  return dayjs(date).format(format);
}
