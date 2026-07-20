import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Group, Modal, TextInput } from '@mantine/core';
import type { DepartmentDto } from '../../api/types';
import { useCreateDepartment, useUpdateDepartment } from './queries';

const schema = z.object({ name: z.string().min(1, 'Name is required').max(128) });
type FormValues = z.infer<typeof schema>;

export function DepartmentFormModal({
  opened,
  onClose,
  department,
}: {
  opened: boolean;
  onClose: () => void;
  department?: DepartmentDto;
}) {
  const isEdit = Boolean(department);
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: department?.name ?? '' } });

  useEffect(() => {
    reset({ name: department?.name ?? '' });
  }, [department, reset]);

  async function onSubmit(values: FormValues) {
    if (isEdit && department) {
      await updateDepartment.mutateAsync({ id: department.id, name: values.name });
    } else {
      await createDepartment.mutateAsync(values.name);
    }
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title={isEdit ? 'Edit department' : 'New department'}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextInput label="Name" error={errors.name?.message} {...register('name')} data-autofocus />
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
