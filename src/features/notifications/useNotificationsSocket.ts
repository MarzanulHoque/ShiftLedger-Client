import { useEffect } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { notifications as mantineNotifications } from '@mantine/notifications';
import { useAuthStore } from '../../auth/store';
import type { NotificationDto } from '../../api/types';

export function useNotificationsSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;

    const connection = new HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_HUB_URL, {
        accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('NotificationCreated', (notification: NotificationDto) => {
      mantineNotifications.show({ title: 'Notification', message: notification.message });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    connection.start().catch(() => {
      // Connection retried automatically; a failed initial start just means the bell
      // stays on the last fetched state until the next reconnect attempt.
    });

    return () => {
      void connection.stop();
    };
  }, [accessToken, queryClient]);
}
