import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Group, Modal, Select, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { useMechanics } from '../users/queries';
import { useCreateJob } from './mutations';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  bikeModel: z.string().min(1, 'Bike model is required').max(128),
  description: z.string().max(2000).optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  assignedMechanicId: z.string().nullable(),
  receivedDate: z.date(),
  dueDate: z.date().nullable(),
});
type FormValues = z.infer<typeof schema>;

export function CreateJobModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const { data: mechanics } = useMechanics();
  const createJob = useCreateJob();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      bikeModel: '',
      description: '',
      priority: 'Medium',
      assignedMechanicId: null,
      receivedDate: new Date(),
      dueDate: null,
    },
  });

  async function onSubmit(values: FormValues) {
    await createJob.mutateAsync({
      title: values.title,
      bikeModel: values.bikeModel,
      description: values.description || null,
      priority: values.priority,
      assignedMechanicId: values.assignedMechanicId,
      receivedDate: dayjs(values.receivedDate).format('YYYY-MM-DD'),
      dueDate: values.dueDate ? dayjs(values.dueDate).format('YYYY-MM-DD') : null,
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
          <Controller
            control={control}
            name="assignedMechanicId"
            render={({ field }) => (
              <Select
                label="Assign mechanic"
                placeholder="Unassigned"
                clearable
                data={mechanics?.map((m) => ({ value: m.id, label: m.fullName })) ?? []}
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
            render={({ field }) => <DateInput label="Received" value={field.value} onChange={(v) => field.onChange(v ?? new Date())} />}
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
