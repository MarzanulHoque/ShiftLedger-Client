import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Group, Modal, Select, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { useAuthStore } from '../../auth/store';
import { useDepartments } from '../departments/queries';
import { useMechanics } from '../users/queries';
import { useCreateJob } from './mutations';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  bikeModel: z.string().min(1, 'Bike model is required').max(128),
  description: z.string().max(2000).optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  departmentId: z.string().min(1, 'Department is required'),
  assignedMechanicId: z.string().nullable(),
  receivedDate: z.string(),
  dueDate: z.string().nullable(),
});
type FormValues = z.infer<typeof schema>;

export function CreateJobModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';
  const { data: departments } = useDepartments();
  const { data: mechanics } = useMechanics();
  const createJob = useCreateJob();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    // Rule RB3/RB4: a DepartmentAdmin may only create jobs in their own department.
    defaultValues: {
      title: '',
      bikeModel: '',
      description: '',
      priority: 'Medium',
      departmentId: isSuperAdmin ? '' : (currentUser?.departmentId ?? ''),
      assignedMechanicId: null,
      receivedDate: dayjs().format('YYYY-MM-DD'),
      dueDate: null,
    },
  });

  const departmentId = watch('departmentId');
  // Rule J2 (extended for RB3): the assignee must belong to the job's own department.
  const departmentMechanics = mechanics?.filter((m) => m.departmentId === departmentId);

  async function onSubmit(values: FormValues) {
    await createJob.mutateAsync({
      title: values.title,
      bikeModel: values.bikeModel,
      description: values.description || null,
      priority: values.priority,
      departmentId: values.departmentId,
      assignedMechanicId: values.assignedMechanicId,
      receivedDate: values.receivedDate,
      dueDate: values.dueDate,
    });
    reset();
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="New job" size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextInput label="Title" error={errors.title?.message} mb="sm" {...register('title')} data-autofocus />
        <TextInput label="Bike model" error={errors.bikeModel?.message} mb="sm" {...register('bikeModel')} />
        <Textarea label="Description" mb="sm" minRows={2} {...register('description')} />

        <Group grow mb="sm">
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
                onChange={(value) => {
                  field.onChange(value ?? '');
                  setValue('assignedMechanicId', null);
                }}
                allowDeselect={false}
                disabled={!isSuperAdmin}
              />
            )}
          />
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select
                label="Priority"
                data={['Low', 'Medium', 'High']}
                value={field.value}
                onChange={(value) => field.onChange(value ?? 'Medium')}
                allowDeselect={false}
              />
            )}
          />
        </Group>

        <Group grow mb="sm">
          <Controller
            control={control}
            name="assignedMechanicId"
            render={({ field }) => (
              <Select
                label="Assign mechanic"
                placeholder={departmentId ? 'Unassigned' : 'Select a department first'}
                clearable
                disabled={!departmentId}
                data={departmentMechanics?.map((m) => ({ value: m.id, label: m.fullName })) ?? []}
                value={field.value}
                onChange={(value) => field.onChange(value)}
              />
            )}
          />
        </Group>

        <Group grow mb="sm">
          <Controller
            control={control}
            name="receivedDate"
            render={({ field }) => (
              <DateInput label="Received" value={field.value} onChange={(v) => field.onChange(v ?? dayjs().format('YYYY-MM-DD'))} />
            )}
          />
          <Controller
            control={control}
            name="dueDate"
            render={({ field }) => (
              <DateInput label="Due" clearable value={field.value} onChange={(v) => field.onChange(v)} />
            )}
          />
        </Group>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create job
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
