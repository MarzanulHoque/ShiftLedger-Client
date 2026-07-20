import { useEffect } from 'react';
import { AppShell, Avatar, Group, Menu, NavLink as MantineNavLink, Stack, Text, UnstyledButton } from '@mantine/core';
import {
  IconChevronDown,
  IconDashboard,
  IconLogout,
  IconReceipt2,
  IconReportAnalytics,
  IconTools,
  IconUsersGroup,
} from '@tabler/icons-react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../auth/store';
import { initials } from '../../lib/initials';
import { useNotificationsSocket } from '../../features/notifications/useNotificationsSocket';
import { useUsers } from '../../features/users/queries';
import { NotificationBell } from './NotificationBell';
import { MechanicPlaceholder } from './MechanicPlaceholder';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { to: '/jobs', label: 'Jobs', icon: IconTools },
  { to: '/bills', label: 'Billing', icon: IconReceipt2 },
  { to: '/reports', label: 'Reports', icon: IconReportAnalytics },
  { to: '/users', label: 'Users & Org', icon: IconUsersGroup },
];

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const location = useLocation();
  const { data: users } = useUsers();
  useNotificationsSocket();
  const currentUserName = users?.find((u) => u.id === user?.id)?.fullName;

  // A valid accessToken but no decoded user means the token's claims didn't parse as expected
  // (see lib/jwt.ts) — that's a broken session, not a legitimate non-Admin one, so force a
  // fresh login rather than silently showing the mechanic placeholder.
  useEffect(() => {
    if (!user) clearSession();
  }, [user, clearSession]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'Admin') {
    return <MechanicPlaceholder />;
  }

  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 232, breakpoint: 'sm' }} padding="lg">
      <AppShell.Header style={{ boxShadow: 'var(--mantine-shadow-xs)', zIndex: 101 }}>
        <Group h="100%" px="lg" justify="space-between">
          <Group gap={8}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: 'var(--mantine-color-brand-filled)',
                color: 'var(--mantine-color-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              S
            </div>
            <Text fw={700} fz="sm" style={{ letterSpacing: '0.01em' }}>
              ShiftLedger
            </Text>
          </Group>
          <Group gap="sm">
            <NotificationBell />
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap={8}>
                    <Avatar size={28} radius="xl" color="brand">
                      {initials(currentUserName ?? user.email)}
                    </Avatar>
                    <IconChevronDown size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user.email}</Menu.Label>
                <Menu.Item leftSection={<IconLogout size={14} />} onClick={() => clearSession()}>
                  Log out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm" style={{ boxShadow: 'var(--mantine-shadow-xs)' }}>
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" pl={8} mb={4} style={{ letterSpacing: '0.04em' }}>
          Menu
        </Text>
        <Stack gap={2}>
          {NAV_ITEMS.map((item) => (
            <MantineNavLink
              key={item.to}
              component={Link}
              to={item.to}
              label={item.label}
              leftSection={<item.icon size={17} stroke={1.75} />}
              active={location.pathname.startsWith(item.to)}
              fw={500}
              styles={{ root: { borderRadius: 'var(--mantine-radius-sm)' } }}
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
