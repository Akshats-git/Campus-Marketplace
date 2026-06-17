import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  increment,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { uploadImage } from './cloudinary';
import { Chat, Message } from '../types';

export async function getOrCreateChat(
  listingId: string,
  listingTitle: string,
  listingImage: string,
  listingPrice: number,
  buyerId: string,
  sellerId: string
): Promise<string> {
  const existing = await getDocs(
    query(
      collection(db, 'chats'),
      where('listingId', '==', listingId),
      where('buyerId', '==', buyerId)
    )
  );
  if (!existing.empty) return existing.docs[0].id;

  const chatRef = await addDoc(collection(db, 'chats'), {
    listingId,
    listingTitle,
    listingImage,
    listingPrice,
    buyerId,
    sellerId,
    participants: [buyerId, sellerId],
    lastMessage: '',
    lastMessageAt: Date.now(),
    lastMessageSenderId: '',
    unreadCount: { [buyerId]: 0, [sellerId]: 0 },
    isActive: true,
    createdAt: Date.now(),
  });
  return chatRef.id;
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  senderPhoto: string | null,
  text: string,
  receiverId: string,
  imageUrl?: string,
  offerAmount?: number
): Promise<void> {
  const type = offerAmount ? 'offer' : imageUrl ? 'image' : 'text';
  const msgRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
    chatId,
    senderId,
    senderName,
    senderPhoto,
    text,
    imageUrl: imageUrl ?? null,
    type,
    offerAmount: offerAmount ?? null,
    offerStatus: offerAmount ? 'pending' : null,
    createdAt: Date.now(),
    readBy: [senderId],
  });

  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: type === 'offer' ? `Offer: ₹${offerAmount}` : type === 'image' ? '📷 Photo' : text,
    lastMessageAt: Date.now(),
    lastMessageSenderId: senderId,
    [`unreadCount.${receiverId}`]: increment(1),
  });
}

export async function respondToOffer(
  chatId: string,
  messageId: string,
  status: 'accepted' | 'declined' | 'countered',
  counterAmount?: number
): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    offerStatus: status,
  });
}

export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc')),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)))
  );
}

export function subscribeToChats(uid: string, callback: (chats: Chat[]) => void): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, 'chats'),
      where('participants', 'array-contains', uid),
      orderBy('lastMessageAt', 'desc')
    ),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Chat)))
  );
}

export async function markMessagesRead(chatId: string, userId: string): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId), {
    [`unreadCount.${userId}`]: 0,
  });
}

export async function uploadChatImage(uri: string, chatId: string): Promise<string> {
  return uploadImage(uri, `chats/${chatId}`);
}
