import { useEffect } from 'react';
import { router } from 'expo-router';
import { registerForPushNotifications, subscribeToNotificationResponse } from '../services/notifications';
import { useAuthStore } from '../stores/authStore';

export function useNotifications() {
  const { userProfile } = useAuthStore();

  useEffect(() => {
    if (!userProfile?.uid) return;

    registerForPushNotifications(userProfile.uid);

    const sub = subscribeToNotificationResponse(response => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'message' && data?.chatId) {
        router.push(`/chat/${data.chatId}`);
      } else if (data?.type === 'listing' && data?.listingId) {
        router.push(`/listing/${data.listingId}`);
      }
    });

    return () => sub.remove();
  }, [userProfile?.uid]);
}
