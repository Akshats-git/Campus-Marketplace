import { INSTITUTE_EMAIL_DOMAIN, MAX_LISTING_PRICE } from '../constants/config';

export function isInstituteEmail(email: string): boolean {
  return email.toLowerCase().endsWith(INSTITUTE_EMAIL_DOMAIN);
}

export function validateListingTitle(title: string): string | null {
  if (!title.trim()) return 'Title is required';
  if (title.trim().length < 3) return 'Title must be at least 3 characters';
  if (title.trim().length > 100) return 'Title must be under 100 characters';
  return null;
}

export function validateListingPrice(price: string, isFree: boolean): string | null {
  if (isFree) return null;
  const num = parseFloat(price);
  if (isNaN(num) || num <= 0) return 'Enter a valid price';
  if (num > MAX_LISTING_PRICE) return `Price cannot exceed ₹${MAX_LISTING_PRICE.toLocaleString('en-IN')}`;
  return null;
}

export function validateDescription(desc: string): string | null {
  if (!desc.trim()) return 'Description is required';
  if (desc.trim().length < 10) return 'Description must be at least 10 characters';
  if (desc.trim().length > 2000) return 'Description must be under 2000 characters';
  return null;
}
