const pad = (n: number) => String(n).padStart(2, '0');

/** "14:05" for today, "3 Oct" for older messages, "3 Oct 2025" for another year. */
export function formatChatTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (date.toDateString() === now.toDateString()) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear() === now.getFullYear() ? '' : ` ${date.getFullYear()}`;
  return `${date.getDate()} ${month}${year}`;
}
