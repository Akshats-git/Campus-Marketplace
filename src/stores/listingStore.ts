import { create } from 'zustand';
import { Listing } from '../types';

interface ListingState {
  listings: Listing[];
  selectedCategory: string | null;
  wishlist: string[];
  searchResults: Listing[];
  isSearching: boolean;
  setListings: (listings: Listing[]) => void;
  appendListings: (listings: Listing[]) => void;
  setCategory: (cat: string | null) => void;
  setWishlist: (ids: string[]) => void;
  toggleWishlist: (id: string) => void;
  setSearchResults: (results: Listing[]) => void;
  setSearching: (v: boolean) => void;
  updateListing: (id: string, data: Partial<Listing>) => void;
}

export const useListingStore = create<ListingState>((set, get) => ({
  listings: [],
  selectedCategory: null,
  wishlist: [],
  searchResults: [],
  isSearching: false,
  setListings: listings => set({ listings }),
  appendListings: listings => set(s => ({ listings: [...s.listings, ...listings] })),
  setCategory: cat => set({ selectedCategory: cat }),
  setWishlist: ids => set({ wishlist: ids }),
  toggleWishlist: id =>
    set(s => ({
      wishlist: s.wishlist.includes(id)
        ? s.wishlist.filter(i => i !== id)
        : [...s.wishlist, id],
    })),
  setSearchResults: results => set({ searchResults: results }),
  setSearching: v => set({ isSearching: v }),
  updateListing: (id, data) =>
    set(s => ({ listings: s.listings.map(l => (l.id === id ? { ...l, ...data } : l)) })),
}));
