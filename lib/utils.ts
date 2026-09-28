/**
 * Return the Monday 00:00 (local time) of the week containing `date`.
 * Weeks start on Monday, so a Sunday belongs to the week that started
 * the previous Monday (not the upcoming one).
 */
export function getWeekStart(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  const day = result.getDay(); // 0 (Sun) - 6 (Sat)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diffToMonday);

  return result;
}

/**
 * Compare two dates by calendar day (year/month/date), ignoring time of day.
 * Used to check whether a stored `weekStart` value falls on the same day as
 * a freshly computed `getWeekStart()` result, without requiring exact
 * millisecond equality.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Return true if `dueDate` falls strictly before today (date-level
 * comparison, ignoring time of day) and the todo is not yet done.
 */
export function isOverdue(dueDate: Date | string, status?: string): boolean {
  if (status === "done") return false;
  const due = new Date(dueDate);
  const today = new Date();
  if (isSameDay(due, today)) return false;
  return due.getTime() < today.setHours(0, 0, 0, 0);
}

export default getWeekStart;
