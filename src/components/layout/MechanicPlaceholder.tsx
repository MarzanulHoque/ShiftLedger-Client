import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { useAuthStore } from '../../auth/store';

// The mechanic (Employee) dashboard is API-ready (`/dashboard/me`, own-jobs scoping)
// but its screen is deferred to a later UI pass — see wireframe sheet 08.
export function MechanicPlaceholder() {
  const clearSession = useAuthStore((s) => s.clearSession);

  return (
    <Center h="100vh">
      <Stack align="center" gap="xs">
        <Title order={3}>ShiftLedger</Title>
        <Text c="dimmed">The mechanic view isn't available yet — check back soon.</Text>
        <Button variant="subtle" onClick={() => clearSession()}>
          Log out
        </Button>
      </Stack>
    </Center>
  );
}
