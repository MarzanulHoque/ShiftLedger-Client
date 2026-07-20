import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, Box, Button, Group, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { IconAlertCircle, IconTools } from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { login } from '../../api/auth';
import { useAuthStore } from '../../auth/store';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const result = await login(values.email, values.password);
      setSession(result.accessToken, result.refreshToken);
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 423) {
        setServerError('Account temporarily locked after repeated failed attempts. Try again shortly.');
      } else if (isAxiosError(error) && error.response?.data?.detail) {
        setServerError(error.response.data.detail as string);
      } else {
        setServerError('Invalid email or password.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Group h="100vh" gap={0} align="stretch" wrap="nowrap">
      {/* Brand panel — hidden on narrow viewports. Dark navy + a faint dot-grid nod to the
          original wireframe's blueprint palette, without literally reproducing the sketch style. */}
      <Box
        visibleFrom="sm"
        w="42%"
        bg="navy.8"
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 4rem',
          backgroundImage:
            'radial-gradient(var(--mantine-color-navy-6) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          backgroundPosition: '-11px -11px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: 'var(--mantine-color-brand-6)',
            opacity: 0.16,
            top: '-8rem',
            right: '-8rem',
            filter: 'blur(10px)',
          }}
        />
        <Group gap={10} mb="xl" style={{ position: 'relative' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--mantine-color-brand-filled)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            S
          </div>
          <Title order={2} c="white" fw={700}>
            ShiftLedger
          </Title>
        </Group>
        <Text c="navy.2" fz="lg" maw={340} style={{ position: 'relative' }}>
          Jobs, billing, and reporting for the shop floor — from the first bike in the door to the paid invoice.
        </Text>
        <Group gap="xs" mt="xl" style={{ position: 'relative' }}>
          <IconTools size={16} color="var(--mantine-color-navy-3)" />
          <Text c="navy.3" fz="sm">
            Bike service shop management
          </Text>
        </Group>
      </Box>

      <Box style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} bg="gray.0">
        <Box w={360}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack gap="md">
              <Box hiddenFrom="sm" mb="sm">
                <Group gap={8} justify="center">
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: 'var(--mantine-color-brand-filled)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    S
                  </div>
                  <Title order={3}>ShiftLedger</Title>
                </Group>
              </Box>

              <div>
                <Title order={3} visibleFrom="sm">
                  Welcome back
                </Title>
                <Text c="dimmed" size="sm" mt={4}>
                  Log in with your administrator-provisioned account.
                </Text>
              </div>

              {serverError && (
                <Alert icon={<IconAlertCircle size={16} />} color="danger" variant="light">
                  {serverError}
                </Alert>
              )}

              <TextInput
                label="Email"
                placeholder="you@shiftledger.local"
                error={errors.email?.message}
                {...register('email')}
              />
              <PasswordInput label="Password" error={errors.password?.message} {...register('password')} />

              <Button type="submit" loading={submitting} fullWidth>
                Log in
              </Button>

              <Text ta="center" size="xs" c="dimmed">
                Accounts are provisioned by your administrator.
              </Text>
            </Stack>
          </form>
        </Box>
      </Box>
    </Group>
  );
}
