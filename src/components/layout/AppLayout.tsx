import { useEffect } from 'react';
import { AppShell, Group, NavLink as MantineNavLink, Text } from '@mantine/core';
import {
  IconDashboard,
  IconReceipt2,
  IconReportAnalytics,
  IconTools,
  IconUsersGroup,
} from '@tabler/icons-react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../auth/store';
import { useNotificationsSocket } from '../../features/notifications/useNotificationsSocket';
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
  useNotificationsSocket();

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
    <AppShell header={{ height: 56 }} navbar={{ width: 220, breakpoint: 'sm' }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Text fw={700} tt="uppercase" fz="sm" style={{ letterSpacing: '0.06em' }}>
            ShiftLedger
          </Text>
          <Group gap="md">
            <NotificationBell />
            <Text
              fz="xs"
              c="dimmed"
              onClick={() => clearSession()}
              style={{ cursor: 'pointer' }}
              title="Log out"
            >
              {user?.email} · Log out
            </Text>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        {NAV_ITEMS.map((item) => (
          <MantineNavLink
            key={item.to}
            component={Link}
            to={item.to}
            label={item.label}
            leftSection={<item.icon size={16} />}
            active={location.pathname.startsWith(item.to)}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
