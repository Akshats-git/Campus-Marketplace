import { Category } from '../types';
import { Colors } from './colors';

export const CATEGORIES: Category[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    icon: 'laptop',
    color: Colors.electronics,
    backgroundColor: Colors.electronicsLight,
  },
  {
    id: 'books',
    name: 'Books & Notes',
    icon: 'book-open-variant',
    color: Colors.books,
    backgroundColor: Colors.booksLight,
  },
  {
    id: 'cycles',
    name: 'Cycles',
    icon: 'bicycle',
    color: Colors.cycles,
    backgroundColor: Colors.cyclesLight,
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: 'football',
    color: Colors.sports,
    backgroundColor: Colors.sportsLight,
  },
  {
    id: 'furniture',
    name: 'Furniture',
    icon: 'sofa',
    color: Colors.furniture,
    backgroundColor: Colors.furnitureLight,
  },
  {
    id: 'clothing',
    name: 'Clothing',
    icon: 'tshirt-crew',
    color: Colors.clothing,
    backgroundColor: Colors.clothingLight,
  },
  {
    id: 'stationery',
    name: 'Stationery',
    icon: 'pencil-box',
    color: Colors.stationery,
    backgroundColor: Colors.stationeryLight,
  },
  {
    id: 'lab',
    name: 'Lab Equipment',
    icon: 'flask',
    color: Colors.lab,
    backgroundColor: Colors.labLight,
  },
  {
    id: 'free',
    name: 'Free / Donate',
    icon: 'gift',
    color: Colors.free,
    backgroundColor: Colors.freeLight,
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'dots-horizontal-circle',
    color: Colors.other,
    backgroundColor: Colors.otherLight,
  },
];

export const CONDITIONS = [
  { id: 'new', label: 'New', description: 'Never used, still in packaging' },
  { id: 'like_new', label: 'Like New', description: 'Used once or twice, no marks' },
  { id: 'good', label: 'Good', description: 'Lightly used, minor signs of wear' },
  { id: 'fair', label: 'Fair', description: 'Visible wear but fully functional' },
  { id: 'poor', label: 'Poor', description: 'Heavy wear, may need repairs' },
];

export const HOSTELS = [
  'Hostel A', 'Hostel B', 'Hostel C', 'Hostel D',
  'Hostel E', 'Hostel F', 'Day Scholar', 'Faculty Quarters',
];

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Mathematics & Computing',
  'Physics',
  'Chemistry',
  'Humanities & Social Sciences',
  'Other',
];

export const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PhD', 'Faculty'];

export const MEETUP_SPOTS = [
  { id: '1', name: 'Main Library', description: 'Ground floor entrance', latitude: 21.1938, longitude: 81.3066, icon: 'library' },
  { id: '2', name: 'Tech Café', description: 'Near academic block', latitude: 21.1940, longitude: 81.3070, icon: 'coffee' },
  { id: '3', name: 'Academic Block Lobby', description: 'Main entrance', latitude: 21.1942, longitude: 81.3072, icon: 'school' },
  { id: '4', name: 'Hostel Common Room', description: 'Ground floor common room', latitude: 21.1935, longitude: 81.3060, icon: 'home' },
  { id: '5', name: 'Sports Complex', description: 'Main gate', latitude: 21.1945, longitude: 81.3075, icon: 'basketball' },
];

export const CAMPUS_CENTER = {
  latitude: 21.1940,
  longitude: 81.3068,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};
