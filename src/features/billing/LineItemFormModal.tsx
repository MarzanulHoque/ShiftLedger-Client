import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Group, Modal, NumberInput, Select, TextInput } from '@mantine/core';
import type { BillLineItemDto } from '../../api/types';
import { useAddLineItem, useUpdateLineItem } from './mutations';

const schema = z.object({
  type: z.enum(['Labor', 'Part']),
  description: z.string().min(1, 'Description is required').max(300),
  quantity: z.number().positive('Must be greater than 0'),
  unitPrice: z.number().min(0, 'Cannot be negative'),
});
type FormValues = z.infer<typeof schema>;

export function LineItemFormModal({
  opened,
  onClose,
  jobId,
  billId,
  line,
}: {
  opened: boolean;
  onClose: () => void;
  jobId: string;
  billId: string;
  line?: BillLineItemDto;
}) {
  const isEdit = Boolean(line);
  const addLineItem = useAddLineItem(jobId, billId);
  const updateLineItem = useUpdateLineItem(jobId, billId);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: line?.type ?? 'Labor',
      description: line?.description ?? '',
      quantity: line?.quantity ?? 1,
      unitPrice: line?.unitPrice ?? 0,
    },
  });

  async function onSubmit(values: FormValues) {
    if (isEdit && line) {
      await updateLineItem.mutateAsync({ lineId: line.id, request: values });
    } else {
      await addLineItem.mutateAsync(values);
    }
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title={isEdit ? 'Edit line item' : 'Add line item'}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select
              label="Type"
              data={[
                { value: 'Labor', label: 'Labor' },
                { value: 'Part', label: 'Part' },
              ]}
              value={field.value}
              onChange={(value) => field.onChange(value ?? 'Labor')}
              mb="sm"
              allowDeselect={false}
            />
          )}
        />
        <TextInput
          label="Description"
          error={errors.description?.message}
          mb="sm"
          {...register('description')}
          data-autofocus
        />
        <Group grow mb="sm">
          <Controller
            control={control}
            name="quantity"
            render={({ field }) => (
              <NumberInput label="Quantity" min={0.01} step={1} value={field.value} onChange={(v) => field.onChange(Number(v) || 0)} />
            )}
          />
          <Controller
            control={control}
            name="unitPrice"
            render={({ field }) => (
              <NumberInput
                label="Unit price"
                min={0}
                step={1}
                decimalScale={2}
                value={field.value}
                onChange={(v) => field.onChange(Number(v) || 0)}
              />
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
