import { useState } from 'react';
import { Group, SegmentedControl, Stack, Title } from '@mantine/core';
import { UsersTable } from './UsersTable';
import { DepartmentsTable } from '../departments/DepartmentsTable';

type Tab = 'users' | 'departments';

export function UsersPage() {
  const [tab, setTab] = useState<Tab>('users');

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

      {tab === 'users' ? <UsersTable /> : <DepartmentsTable />}
    </Stack>
  );
}
