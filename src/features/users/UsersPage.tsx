import { useState } from 'react';
import { Group, Paper, SegmentedControl, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconBuildingWarehouse, IconShieldCheck, IconTools, IconUsersGroup } from '@tabler/icons-react';
import { UsersTable } from './UsersTable';
import { useUsers } from './queries';
import { DepartmentsTable } from '../departments/DepartmentsTable';
import { useDepartments } from '../departments/queries';

type Tab = 'users' | 'departments';

function SummaryTile({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: typeof IconUsersGroup;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <Paper p="md" shadow="sm" style={{ borderTop: `3px solid var(--mantine-color-${color}-6)` }}>
      <Group justify="space-between" wrap="nowrap">
        <div>
          <Text size="xs" tt="uppercase" fw={600} c="dimmed" style={{ letterSpacing: '0.02em' }}>
            {label}
          </Text>
          <Text fz="1.4rem" fw={700} className="tabular-nums">
            {value}
          </Text>
        </div>
        <ThemeIcon variant="light" color={color} size={34} radius="md">
          <Icon size={18} stroke={1.75} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

export function UsersPage() {
  const [tab, setTab] = useState<Tab>('users');
  const { data: users } = useUsers();
  const { data: departments } = useDepartments();

  const adminCount = users?.filter((u) => u.role === 'Admin').length ?? 0;
  const mechanicCount = users?.filter((u) => u.role === 'Employee').length ?? 0;
  const activeCount = users?.filter((u) => u.isActive).length ?? 0;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Users &amp; Departments</Title>
        <SegmentedControl
          value={tab}
          onChange={(value) => setTab(value as Tab)}
          data={[
            { value: 'users', label: 'Users' },
            { value: 'departments', label: 'Departments' },
          ]}
        />
      </Group>

      {tab === 'users' ? (
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <SummaryTile icon={IconShieldCheck} color="brand" label="Admins" value={String(adminCount)} />
          <SummaryTile icon={IconTools} color="steel" label="Mechanics" value={String(mechanicCount)} />
          <SummaryTile icon={IconUsersGroup} color="success" label="Active accounts" value={String(activeCount)} />
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <SummaryTile
            icon={IconBuildingWarehouse}
            color="steel"
            label="Departments"
            value={String(departments?.length ?? 0)}
          />
        </SimpleGrid>
      )}

      {tab === 'users' ? <UsersTable /> : <DepartmentsTable />}
    </Stack>
  );
}
