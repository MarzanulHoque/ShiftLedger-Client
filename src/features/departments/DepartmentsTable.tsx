import { useState } from 'react';
import { ActionIcon, Button, Group, Table, Text } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import type { DepartmentDto } from '../../api/types';
import { useDeleteDepartment, useDepartments } from './queries';
import { DepartmentFormModal } from './DepartmentFormModal';

export function DepartmentsTable() {
  const { data: departments, isLoading } = useDepartments();
  const deleteDepartment = useDeleteDepartment();
  const [modalState, setModalState] = useState<{ opened: boolean; department?: DepartmentDto }>({ opened: false });

  function confirmDelete(department: DepartmentDto) {
    modals.openConfirmModal({
      title: 'Delete department',
      children: <Text size="sm">Delete "{department.name}"? This cannot be undone.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'danger' },
      onConfirm: () => deleteDepartment.mutate(department.id),
    });
  }

  return (
    <>
      <Group justify="flex-end" mb="sm">
        <Button onClick={() => setModalState({ opened: true })}>+ New department</Button>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th w={100} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {departments?.map((department) => (
            <Table.Tr key={department.id}>
              <Table.Td>{department.name}</Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-end">
                  <ActionIcon variant="subtle" onClick={() => setModalState({ opened: true, department })}>
                    <IconPencil size={16} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="danger" onClick={() => confirmDelete(department)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
          {!isLoading && departments?.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={2}>
                <Text c="dimmed" ta="center" py="md">
                  No departments yet.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <DepartmentFormModal
        opened={modalState.opened}
        onClose={() => setModalState({ opened: false })}
        department={modalState.department}
      />
    </>
  );
}
