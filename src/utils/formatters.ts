import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function formatPrice(amount: number): string {
  if (amount === 0) return 'Free';
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatRelativeTime(timestamp: number): string {
  return dayjs(timestamp).fromNow();
}

export function formatDate(timestamp: number): string {
  return dayjs(timestamp).format('D MMM YYYY');
}

export function formatCondition(condition: string): string {
  return condition.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
