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
import { useUsers } from '../../features/users/queries';
import { MechanicPlaceholder } from './MechanicPlaceholder';
// Notifications (bell + SignalR live push) are unplugged for now, per request — the components
// and API still exist under features/notifications and api/notifications.ts, just not wired in
// here. Re-add `useNotificationsSocket()` + `<NotificationBell />` to bring them back.

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
  const currentUserName = users?.find((u) => u.id === user?.id)?.fullName;

  // A valid accessToken but no decoded user means the token's claims didn't parse as expected
  // (see lib/jwt.ts) — that's a broken session, not a legitimate mechanic one, so force a
  // fresh login rather than silently showing the mechanic placeholder.
  useEffect(() => {
    if (!user) clearSession();
  }, [user, clearSession]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'Employee') {
    return <MechanicPlaceholder />;
  }

  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 240, breakpoint: 'sm' }} padding="lg">
      <AppShell.Header style={{ boxShadow: 'var(--mantine-shadow-xs)', zIndex: 101 }}>
        <Group h="100%" pl="sm" pr="lg" justify="space-between">
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
                flexShrink: 0,
              }}
            >
              S
            </div>
            <Text fw={700} fz="sm" style={{ letterSpacing: '0.01em' }}>
              ShiftLedger
            </Text>
          </Group>
          <Group gap="sm">
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

      {/* Sidebar is permanently dark navy regardless of color scheme — a deliberate brand anchor
          (ties back to the wireframe's blueprint palette) rather than a generic light rail. */}
      <AppShell.Navbar bg="navy.8" style={{ border: 'none' }}>
        <Stack h="100%" gap={0}>
          <Stack p="sm" gap={2} pt="md">
            <Text
              size="xs"
              fw={700}
              tt="uppercase"
              pl={8}
              mb={4}
              mt={4}
              c="navy.4"
              style={{ letterSpacing: '0.06em' }}
            >
              Menu
            </Text>
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname.startsWith(item.to);
              return (
                <MantineNavLink
                  key={item.to}
                  component={Link}
                  to={item.to}
                  label={item.label}
                  leftSection={<item.icon size={17} stroke={1.75} />}
                  active={isActive}
                  variant={isActive ? 'filled' : 'subtle'}
                  color={isActive ? 'brand' : 'navy'}
                  fw={500}
                  styles={{
                    root: { borderRadius: 'var(--mantine-radius-sm)' },
                    label: { color: isActive ? 'white' : 'var(--mantine-color-navy-2)' },
                    section: { color: isActive ? 'white' : 'var(--mantine-color-navy-3)' },
                  }}
                />
              );
            })}
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
