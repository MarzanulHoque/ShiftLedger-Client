import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Group, Modal, PasswordInput, Select, TextInput } from '@mantine/core';
import { useAuthStore } from '../../auth/store';
import { useDepartments } from '../departments/queries';
import { useCreateUser } from './mutations';

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(200),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  role: z.enum(['DepartmentAdmin', 'Employee']),
  departmentId: z.string().min(1, 'Department is required'),
});
type FormValues = z.infer<typeof schema>;

export function CreateUserModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';
  const { data: departments } = useDepartments();
  const createUser = useCreateUser();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    // Rule RB5: a DepartmentAdmin may only provision Employees into their own department.
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'Employee',
      departmentId: isSuperAdmin ? '' : (currentUser?.departmentId ?? ''),
    },
  });

  async function onSubmit(values: FormValues) {
    await createUser.mutateAsync(values);
    reset();
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="New user">
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextInput label="Full name" error={errors.fullName?.message} mb="sm" {...register('fullName')} data-autofocus />
        <TextInput label="Email" error={errors.email?.message} mb="sm" {...register('email')} />
        <PasswordInput label="Password" error={errors.password?.message} mb="sm" {...register('password')} />
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

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
