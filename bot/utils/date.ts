import { nextMonday, format } from 'date-fns';

export function getNextMondayFormatted(): string {
  const monday = nextMonday(new Date());
  return format(monday, 'dd-MM'); // z. B. '19-05'
}
