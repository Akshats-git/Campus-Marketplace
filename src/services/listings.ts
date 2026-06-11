import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  arrayUnion,
  arrayRemove,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { Listing, ListingStatus } from '../types';
import { PAGE_SIZE } from '../constants/config';

export async function createListing(
  listing: Omit<Listing, 'id' | 'viewCount' | 'wishlistCount' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'listings'), {
    ...listing,
    viewCount: 0,
    wishlistCount: 0,
    status: 'active' as ListingStatus,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return ref.id;
}

export async function updateListing(id: string, data: Partial<Listing>): Promise<void> {
  await updateDoc(doc(db, 'listings', id), { ...data, updatedAt: Date.now() });
}

export async function deleteListing(id: string): Promise<void> {
  await deleteDoc(doc(db, 'listings', id));
}

export async function getListing(id: string): Promise<Listing | null> {
  const snap = await getDoc(doc(db, 'listings', id));
  if (!snap.exists()) return null;
  await updateDoc(snap.ref, { viewCount: increment(1) });
  return { id: snap.id, ...snap.data() } as Listing;
}

export async function getListings(
  categoryId?: string,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ listings: Listing[]; lastDoc: QueryDocumentSnapshot | null }> {
  let q = query(
    collection(db, 'listings'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE)
  );

  if (categoryId) {
    q = query(
      collection(db, 'listings'),
      where('status', '==', 'active'),
      where('categoryId', '==', categoryId),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );
  }

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snap = await getDocs(q);
  const listings = snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing));
  const last = snap.docs[snap.docs.length - 1] ?? null;
  return { listings, lastDoc: last };
}

export async function searchListings(searchText: string): Promise<Listing[]> {
  const snap = await getDocs(
    query(
      collection(db, 'listings'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
  );
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing));
  const lower = searchText.toLowerCase();
  return all.filter(
    l =>
      l.title.toLowerCase().includes(lower) ||
      l.description.toLowerCase().includes(lower) ||
      l.tags.some(t => t.toLowerCase().includes(lower))
  );
}

export async function getUserListings(uid: string): Promise<Listing[]> {
  const snap = await getDocs(
    query(collection(db, 'listings'), where('sellerId', '==', uid), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing));
}

export async function toggleWishlist(
  listingId: string,
  userId: string,
  isWishlisted: boolean
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const listingRef = doc(db, 'listings', listingId);
  if (isWishlisted) {
    await updateDoc(userRef, { wishlist: arrayRemove(listingId) });
    await updateDoc(listingRef, { wishlistCount: increment(-1) });
  } else {
    await updateDoc(userRef, { wishlist: arrayUnion(listingId) });
    await updateDoc(listingRef, { wishlistCount: increment(1) });
  }
}

export async function uploadListingImage(
  uri: string,
  listingId: string,
  index: number,
  onProgress?: (p: number) => void
): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, `listings/${listingId}/image_${index}.jpg`);
  const task = uploadBytesResumable(storageRef, blob, { contentType: 'image/jpeg' });

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      snap => onProgress?.((snap.bytesTransferred / snap.totalBytes) * 100),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  });
}

export async function markAsSold(listingId: string): Promise<void> {
  await updateDoc(doc(db, 'listings', listingId), {
    status: 'sold' as ListingStatus,
    updatedAt: Date.now(),
  });
}

export async function bumpListing(listingId: string): Promise<void> {
  await updateDoc(doc(db, 'listings', listingId), { updatedAt: Date.now(), createdAt: Date.now() });
}
