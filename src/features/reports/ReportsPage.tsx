import { useState } from 'react';
import { Button, Group, Loader, Paper, Select, Stack, Table, Tabs, Text, Title } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import type { JobStatus, ReportType } from '../../api/types';
import { downloadReport } from '../../api/reports';
import { useOrgSettings } from '../orgSettings/queries';
import { useMechanics } from '../users/queries';
import { STATUS_META } from '../../lib/statusColors';
import { useReport } from './queries';
import { REPORT_FORMATTERS, REPORT_TYPES } from './reportFormatters';

export function ReportsPage() {
  const [type, setType] = useState<ReportType>('Jobs');
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [mechanicId, setMechanicId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);

  const { data: orgSettings } = useOrgSettings();
  const { data: mechanics } = useMechanics();

  const filters = {
    from: from ?? undefined,
    to: to ?? undefined,
    mechanicId: mechanicId ?? undefined,
    status: status ?? undefined,
  };

  const { data: report, isLoading } = useReport(type, filters);
  const formatters = REPORT_FORMATTERS[type];

  return (
    <Stack gap="md">
      <Title order={3}>Reports</Title>

      <Tabs value={type} onChange={(value) => value && setType(value as ReportType)}>
        <Tabs.List>
          {REPORT_TYPES.map((t) => (
            <Tabs.Tab key={t.value} value={t.value}>
              {t.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <Group justify="space-between" wrap="wrap">
        <Group>
          <DateInput placeholder="From" value={from} onChange={setFrom} clearable w={140} />
          <DateInput placeholder="To" value={to} onChange={setTo} clearable w={140} />
          {(type === 'Jobs' || type === 'MechanicProductivity') && (
            <Select
              placeholder="Mechanic: All"
              clearable
              data={mechanics?.map((m) => ({ value: m.id, label: m.fullName })) ?? []}
              value={mechanicId}
              onChange={setMechanicId}
              w={180}
            />
          )}
          {type === 'Jobs' && (
            <Select
              placeholder="Status: All"
              clearable
              data={Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label }))}
              value={status}
              onChange={(v) => setStatus(v as JobStatus | null)}
              w={160}
            />
          )}
        </Group>
        <Group>
          <Button variant="default" onClick={() => downloadReport(type, 'pdf', filters)}>
            Export PDF
          </Button>
          <Button variant="default" onClick={() => downloadReport(type, 'excel', filters)}>
            Export Excel
          </Button>
        </Group>
      </Group>

      {isLoading || !report ? (
        <Loader />
      ) : (
        <Paper shadow="sm" radius="md" style={{ overflow: 'hidden' }}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                {report.columns.map((column) => (
                  <Table.Th key={column}>{column}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {report.rows.map((row, rowIndex) => (
                <Table.Tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <Table.Td key={cellIndex} className="tabular-nums">
                      {formatters[cellIndex]?.(cell, orgSettings?.currencyCode) ?? String(cell ?? '—')}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
              {report.rows.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={report.columns.length}>
                    <Text c="dimmed" ta="center" py="md">
                      No data for these filters.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
