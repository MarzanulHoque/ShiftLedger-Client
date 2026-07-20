import { useState } from 'react';
import { Button, Paper, Stack, Text, Textarea, Title } from '@mantine/core';
import { formatDateTime } from '../../lib/date';
import { useUsers } from '../users/queries';
import { useJobComments } from './queries';
import { useAddJobComment } from './mutations';

export function JobComments({ jobId }: { jobId: string }) {
  const { data: comments } = useJobComments(jobId);
  const { data: users } = useUsers();
  const addComment = useAddJobComment(jobId);
  const [draft, setDraft] = useState('');

  async function handleSubmit() {
    if (!draft.trim()) return;
    await addComment.mutateAsync(draft.trim());
    setDraft('');
  }

  return (
    <Paper withBorder p="md">
      <Title order={5} mb="sm">
        Comments
      </Title>
      <Stack gap="sm" mb="sm">
        {comments?.length ? (
          comments.map((comment) => (
            <div key={comment.id}>
              <Text size="sm">{comment.body}</Text>
              <Text size="xs" c="dimmed">
                {users?.find((u) => u.id === comment.authorId)?.fullName ?? 'Unknown'} ·{' '}
                {formatDateTime(comment.createdAtUtc)}
              </Text>
            </div>
          ))
        ) : (
          <Text size="sm" c="dimmed">
            No comments yet.
          </Text>
        )}
      </Stack>
      <Textarea
        placeholder="Add a comment…"
        value={draft}
        onChange={(e) => setDraft(e.currentTarget.value)}
        minRows={2}
        mb="xs"
      />
      <Button size="xs" onClick={handleSubmit} loading={addComment.isPending} disabled={!draft.trim()}>
        Post comment
      </Button>
    </Paper>
  );
}
