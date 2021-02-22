export interface QuizzDate {
  day: number;
  month: number;
  year: number;
}

export function FromDate(date: Date): QuizzDate {
  return {day: date.getDate(), month: date.getMonth(), year: date.getFullYear()};
}

export function ToDate(date: QuizzDate): Date {
  return new Date(date.year, date.month, date.day);
}