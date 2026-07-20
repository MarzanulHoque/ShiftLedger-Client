import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, Button, Center, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
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
    <Center h="100vh" bg="var(--mantine-color-gray-0)">
      <Paper withBorder shadow="sm" p="xl" w={380}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            <Title order={3} ta="center" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
              ShiftLedger
            </Title>

            {serverError && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
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
      </Paper>
    </Center>
  );
}
