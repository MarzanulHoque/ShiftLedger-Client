import { useState } from 'react';
import { ActionIcon, Badge, Button, Group, Paper, Table, Text } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import type { UserDto } from '../../api/types';
import { useDepartments } from '../departments/queries';
import { useUsers } from './queries';
import { useDeleteUser } from './mutations';
import { CreateUserModal } from './CreateUserModal';
import { EditUserModal } from './EditUserModal';

export function UsersTable() {
  const { data: users, isLoading } = useUsers();
  const { data: departments } = useDepartments();
  const deleteUser = useDeleteUser();
  const [createOpened, setCreateOpened] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);

  const departmentName = (id: string | null) => departments?.find((d) => d.id === id)?.name ?? '—';

  function confirmDelete(user: UserDto) {
    modals.openConfirmModal({
      title: 'Delete user',
      children: <Text size="sm">Delete "{user.fullName}"? This cannot be undone.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'danger' },
      onConfirm: () => deleteUser.mutate(user.id),
    });
  }

  return (
    <>
      <Group justify="flex-end" mb="sm">
        <Button onClick={() => setCreateOpened(true)}>+ New user</Button>
      </Group>

      <Paper shadow="sm" radius="md" style={{ overflow: 'hidden' }}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Department</Table.Th>
              <Table.Th>Active</Table.Th>
              <Table.Th w={100} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users?.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>{user.fullName}</Table.Td>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>
                  <Badge color={user.role === 'Admin' ? 'brand' : 'steel'} variant="light">
                    {user.role}
                  </Badge>
                </Table.Td>
                <Table.Td>{departmentName(user.departmentId)}</Table.Td>
                <Table.Td>
                  <Badge color={user.isActive ? 'success' : 'gray'} variant="light">
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    <ActionIcon variant="subtle" onClick={() => setEditingUser(user)}>
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="danger" onClick={() => confirmDelete(user)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {!isLoading && users?.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed" ta="center" py="md">
                    No users yet.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <CreateUserModal opened={createOpened} onClose={() => setCreateOpened(false)} />
      {editingUser && <EditUserModal opened onClose={() => setEditingUser(null)} user={editingUser} />}
    </>
  );
}
