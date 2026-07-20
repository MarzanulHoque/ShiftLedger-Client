import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Group, Modal, Select, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import type { JobDto } from '../../api/types';
import { useUpdateJob } from './mutations';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  bikeModel: z.string().min(1, 'Bike model is required').max(128),
  description: z.string().max(2000).optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  dueDate: z.string().nullable(),
});
type FormValues = z.infer<typeof schema>;

export function EditJobModal({ opened, onClose, job }: { opened: boolean; onClose: () => void; job: JobDto }) {
  const updateJob = useUpdateJob(job.id);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: job.title,
      bikeModel: job.bikeModel,
      description: job.description ?? '',
      priority: job.priority,
      dueDate: job.dueDate,
    },
  });

  useEffect(() => {
    reset({
      title: job.title,
      bikeModel: job.bikeModel,
      description: job.description ?? '',
      priority: job.priority,
      dueDate: job.dueDate,
    });
  }, [job, reset]);

  async function onSubmit(values: FormValues) {
    await updateJob.mutateAsync({
      id: job.id,
      title: values.title,
      bikeModel: values.bikeModel,
      description: values.description || null,
      priority: values.priority,
      dueDate: values.dueDate,
    });
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Edit job" size="lg">
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
            Save
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
