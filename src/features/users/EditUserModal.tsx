import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Group, Modal, Select, Switch, TextInput } from '@mantine/core';
import type { UserDto } from '../../api/types';
import { useAuthStore } from '../../auth/store';
import { useDepartments } from '../departments/queries';
import { useUpdateUser } from './mutations';

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(200),
  role: z.enum(['DepartmentAdmin', 'Employee']),
  departmentId: z.string().min(1, 'Department is required'),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function EditUserModal({
  opened,
  onClose,
  user,
}: {
  opened: boolean;
  onClose: () => void;
  user: UserDto;
}) {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';
  const { data: departments } = useDepartments();
  const updateUser = useUpdateUser();

  const {
    handleSubmit,
    control,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user.fullName,
      role: user.role === 'SuperAdmin' ? 'DepartmentAdmin' : user.role,
      departmentId: user.departmentId ?? '',
      isActive: user.isActive,
    },
  });

  useEffect(() => {
    reset({
      fullName: user.fullName,
      role: user.role === 'SuperAdmin' ? 'DepartmentAdmin' : user.role,
      departmentId: user.departmentId ?? '',
      isActive: user.isActive,
    });
  }, [user, reset]);

  async function onSubmit(values: FormValues) {
    await updateUser.mutateAsync({ id: user.id, ...values });
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title={`Edit ${user.fullName}`}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextInput label="Full name" error={errors.fullName?.message} mb="sm" {...register('fullName')} data-autofocus />
        <TextInput label="Email" value={user.email} disabled mb="sm" />
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select
              label="Role"
              data={[
                { value: 'Employee', label: 'Employee (Mechanic)' },
                { value: 'DepartmentAdmin', label: 'Department Admin' },
              ]}
              value={field.value}
              onChange={(value) => field.onChange(value ?? 'Employee')}
              mb="sm"
              allowDeselect={false}
              disabled={!isSuperAdmin}
            />
          )}
        />
        <Controller
          control={control}
          name="departmentId"
          render={({ field }) => (
            <Select
              label="Department"
              placeholder="Select a department"
              error={errors.departmentId?.message}
              data={departments?.map((d) => ({ value: d.id, label: d.name })) ?? []}
              value={field.value}
              onChange={(value) => field.onChange(value ?? '')}
              mb="sm"
              allowDeselect={false}
              disabled={!isSuperAdmin}
            />
          )}
        />
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Switch
              label="Active"
              checked={field.value}
              onChange={(event) => field.onChange(event.currentTarget.checked)}
              mb="sm"
            />
          )}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
