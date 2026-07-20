import { useState } from 'react';
import { ActionIcon, Badge, Button, Group, Paper, Table, Text, Title } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import type { BillLineItemDto } from '../../api/types';
import { formatDateTime } from '../../lib/date';
import { formatMoney } from '../../lib/money';
import { useOrgSettings } from '../orgSettings/queries';
import { useJobBill } from './queries';
import { useCreateBill, useDeleteLineItem, useSetBillPaid } from './mutations';
import { LineItemFormModal } from './LineItemFormModal';

export function BillPanel({ jobId }: { jobId: string }) {
  const { data: bill, isLoading } = useJobBill(jobId);
  const { data: orgSettings } = useOrgSettings();
  const createBill = useCreateBill(jobId);
  const [lineModal, setLineModal] = useState<{ opened: boolean; line?: BillLineItemDto }>({ opened: false });

  const currency = orgSettings?.currencyCode;
  const money = (amount: number) => formatMoney(amount, currency);

  if (isLoading) return null;

  if (!bill) {
    return (
      <Paper withBorder p="md">
        <Title order={5} mb="sm">
          Bill
        </Title>
        <Text size="sm" c="dimmed" mb="sm">
          No bill has been started for this job yet.
        </Text>
        <Button onClick={() => createBill.mutate()} loading={createBill.isPending}>
          Start bill
        </Button>
      </Paper>
    );
  }

  return (
    <BillDetail jobId={jobId} billId={bill.id} lines={bill.lines} total={bill.total} isPaid={bill.isPaid} paidAtUtc={bill.paidAtUtc} money={money} lineModal={lineModal} setLineModal={setLineModal} />
  );
}

function BillDetail({
  jobId,
  billId,
  lines,
  total,
  isPaid,
  paidAtUtc,
  money,
  lineModal,
  setLineModal,
}: {
  jobId: string;
  billId: string;
  lines: BillLineItemDto[];
  total: number;
  isPaid: boolean;
  paidAtUtc: string | null;
  money: (amount: number) => string;
  lineModal: { opened: boolean; line?: BillLineItemDto };
  setLineModal: (state: { opened: boolean; line?: BillLineItemDto }) => void;
}) {
  const deleteLineItem = useDeleteLineItem(jobId, billId);
  const setBillPaid = useSetBillPaid(jobId, billId);

  function confirmDeleteLine(line: BillLineItemDto) {
    modals.openConfirmModal({
      title: 'Delete line item',
      children: <Text size="sm">Delete "{line.description}"?</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'danger' },
      onConfirm: () => deleteLineItem.mutate(line.id),
    });
  }

  function confirmSetPaid(next: boolean) {
    if (!next) {
      setBillPaid.mutate(false);
      return;
    }
    modals.openConfirmModal({
      title: 'Mark bill paid',
      children: <Text size="sm">Mark this bill as paid for {money(total)}? Line items lock once paid.</Text>,
      labels: { confirm: 'Mark paid', cancel: 'Cancel' },
      onConfirm: () => setBillPaid.mutate(true),
    });
  }

  return (
    <Paper withBorder p="md">
      <Group justify="space-between" mb="sm">
        <Title order={5}>Bill</Title>
        <Badge color={isPaid ? 'success' : 'gray'} variant={isPaid ? 'filled' : 'light'}>
          {isPaid ? `Paid ${paidAtUtc ? formatDateTime(paidAtUtc) : ''}` : 'Unpaid'}
        </Badge>
      </Group>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Item</Table.Th>
            <Table.Th>Qty</Table.Th>
            <Table.Th>Price</Table.Th>
            <Table.Th>Line</Table.Th>
            <Table.Th w={80} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {lines.map((line) => (
            <Table.Tr key={line.id}>
              <Table.Td>
                {line.description}
                <Text span c="dimmed" size="xs" ml={6}>
                  ({line.type})
                </Text>
              </Table.Td>
              <Table.Td className="tabular-nums">{line.quantity}</Table.Td>
              <Table.Td className="tabular-nums">{line.unitPrice}</Table.Td>
              <Table.Td className="tabular-nums">{line.lineTotal}</Table.Td>
              <Table.Td>
                {!isPaid && (
                  <Group gap={4} justify="flex-end">
                    <ActionIcon variant="subtle" size="sm" onClick={() => setLineModal({ opened: true, line })}>
                      <IconPencil size={14} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" size="sm" color="danger" onClick={() => confirmDeleteLine(line)}>
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
          {lines.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text size="sm" c="dimmed" ta="center" py="sm">
                  No line items yet.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Group justify="space-between" mt="sm" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
        <Text fw={700}>Total</Text>
        <Text fw={700} className="tabular-nums">
          {money(total)}
        </Text>
      </Group>

      <Group mt="md">
        {!isPaid && <Button variant="default" onClick={() => setLineModal({ opened: true })}>+ Add line</Button>}
        <Button
          color={isPaid ? 'gray' : 'brand'}
          variant={isPaid ? 'outline' : 'filled'}
          onClick={() => confirmSetPaid(!isPaid)}
          disabled={!isPaid && lines.length === 0}
        >
          {isPaid ? 'Reopen' : 'Mark paid'}
        </Button>
      </Group>

      <LineItemFormModal
        opened={lineModal.opened}
        onClose={() => setLineModal({ opened: false })}
        jobId={jobId}
        billId={billId}
        line={lineModal.line}
      />
    </Paper>
  );
}
