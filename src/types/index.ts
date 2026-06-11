export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';
export type ListingStatus = 'active' | 'reserved' | 'sold' | 'expired';
export type UserRole = 'student' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  hostel: string;
  year: string;
  department: string;
  rating: number;
  ratingCount: number;
  listingsCount: number;
  soldCount: number;
  responseRate: number;
  createdAt: number;
  isVerified: boolean;
  role: UserRole;
  fcmToken?: string;
  wishlist: string[];
  following: string[];
  followers: string[];
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  condition: ListingCondition;
  categoryId: string;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerPhoto: string | null;
  sellerRating: number;
  sellerHostel: string;
  status: ListingStatus;
  viewCount: number;
  wishlistCount: number;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  isFree: boolean;
  isNegotiable: boolean;
  meetupSpots: string[];
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string | null;
  text: string;
  imageUrl?: string;
  type: 'text' | 'image' | 'offer';
  offerAmount?: number;
  offerStatus?: 'pending' | 'accepted' | 'declined' | 'countered';
  createdAt: number;
  readBy: string[];
}

export interface Chat {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  listingPrice: number;
  buyerId: string;
  sellerId: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: number;
  lastMessageSenderId: string;
  unreadCount: { [uid: string]: number };
  isActive: boolean;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerPhoto: string | null;
  reviewedUserId: string;
  listingId: string;
  rating: number;
  comment: string;
  createdAt: number;
  type: 'buyer' | 'seller';
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  backgroundColor: string;
}

export interface MeetupSpot {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  icon: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'message' | 'offer' | 'sale' | 'wishlist' | 'review';
  relatedId: string;
  read: boolean;
  createdAt: number;
}
