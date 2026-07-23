import { ActionIcon, Indicator, Popover, ScrollArea, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationRead } from '../../api/notifications';
import { formatDateTime } from '../../lib/date';

export function NotificationBell() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ unreadOnly: false, pageSize: 10 }),
    refetchInterval: 30_000,
  });

  const unreadCount = data?.items.filter((n) => !n.isRead).length ?? 0;

  async function handleRead(id: string) {
    await markNotificationRead(id);
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  return (
    <Popover width={320} position="bottom-end" shadow="md">
      <Popover.Target>
        <ActionIcon variant="subtle" color="gray" radius="xl" size="lg" aria-label="Notifications">
          <Indicator disabled={unreadCount === 0} label={unreadCount} size={16}>
            <IconBell size={18} />
          </Indicator>
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown p="xs">
        <ScrollArea.Autosize mah={360}>
          <Stack gap={2}>
            {!data || data.items.length === 0 ? (
              <Text size="sm" c="dimmed" p="sm">
                No notifications yet.
              </Text>
            ) : (
              data.items.map((n) => (
                <UnstyledButton
                  key={n.id}
                  onClick={() => handleRead(n.id)}
                  p="xs"
                  style={{
                    borderRadius: 4,
                    background: n.isRead ? 'transparent' : 'var(--mantine-color-blue-light)',
                  }}
                >
                  <Text size="sm">{n.message}</Text>
                  <Text size="xs" c="dimmed">
                    {formatDateTime(n.createdAtUtc)}
                  </Text>
                </UnstyledButton>
              ))
            )}
          </Stack>
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  );
}
