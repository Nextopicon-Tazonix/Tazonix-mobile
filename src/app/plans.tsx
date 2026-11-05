import React, { useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react-native';
import { api } from '@/api/client';
import type { PlanCode } from '@/api/types';
import { usePlans } from '@/api/hooks';
import { Card, ErrorView, GradientButton, Loading, Row, Screen, T, Tag } from '@/components/ui';
import { useAuth } from '@/store/auth';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { refreshMe } from '@/lib/session';
import { date, money } from '@/lib/format';
import { confirm, notify, showError } from '@/lib/notify';
import { colors } from '@/theme';

export default function Plans() {
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const user = useAuth((s) => s.user);
  const requireAuth = useRequireAuth();
  const qc = useQueryClient();
  const plans = usePlans();
  const [busy, setBusy] = useState<PlanCode | null>(null);
  const current = user?.subscription?.status === 'ACTIVE' ? user.subscription : null;

  const checkout = async (planCode: PlanCode) => {
    setBusy(planCode);
    try {
      const res = await api.post<{ checkoutUrl: string | null; subscription: unknown }>('/subscriptions/checkout', { planCode }, { idempotent: true });
      if (res.checkoutUrl) await WebBrowser.openBrowserAsync(res.checkoutUrl);
      else notify('Plan activated 🎉', 'Your subscription is active.');
      await refreshMe();
      qc.invalidateQueries();
    } catch (e) {
      showError(e, 'Checkout failed');
    } finally {
      setBusy(null);
    }
  };

  const cancel = () =>
    confirm('Cancel subscription?', 'You keep access until the end of the current billing period.', async () => {
      try {
        await api.post('/me/subscription/cancel');
        await refreshMe();
      } catch (e) {
        showError(e);
      }
    }, 'Cancel plan');

  if (plans.isLoading) return <Loading />;
  if (plans.error) return <ErrorView error={plans.error} onRetry={plans.refetch} />;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Choose a plan' }} />
      {reason === 'contact' ? (
        <Card style={{ borderColor: colors.amber }}>
          <T variant="h3">Subscription required</T>
          <T variant="muted">Contacting, inviting and booking talent is available on paid plans.</T>
        </Card>
      ) : null}
      {current ? (
        <Card style={{ gap: 6 }}>
          <T variant="small">Current plan</T>
          <T variant="h2" style={{ color: colors.amber }}>
            {current.planName}
          </T>
          <T variant="muted">
            {current.cancelAtPeriodEnd ? 'Ends' : 'Renews'} {date(current.currentPeriodEnd)}
          </T>
          {!current.cancelAtPeriodEnd ? <GradientButton small variant="danger" title="Cancel subscription" onPress={cancel} /> : null}
        </Card>
      ) : null}
      {(plans.data ?? []).map((p) => {
        const isCurrent = current?.planCode === p.code;
        return (
          <Card key={p.id} style={[{ gap: 8 }, p.code === 'AGENCY' && { borderColor: colors.purple }]}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T variant="h2">{p.name}</T>
              {p.code === 'AGENCY' ? <Tag label="Popular" color={colors.magenta} /> : null}
            </Row>
            <T variant="h3" style={{ color: colors.amber }}>
              {p.priceMinor ? `${money(p.priceMinor, p.currency)} / ${p.interval}` : 'Free'}
            </T>
            {p.features.map((f) => (
              <Row key={f} gap={8}>
                <Check color={colors.success} size={16} />
                <T variant="muted" style={{ flex: 1 }}>
                  {f}
                </T>
              </Row>
            ))}
            {p.code !== 'FREE' ? (
              <GradientButton
                title={isCurrent ? 'Current plan' : `Choose ${p.name}`}
                disabled={isCurrent}
                loading={busy === p.code}
                variant={p.code === 'AGENCY' ? 'gradient' : 'outline'}
                onPress={() => requireAuth(() => checkout(p.code))}
              />
            ) : null}
          </Card>
        );
      })}
      <T variant="small" style={{ textAlign: 'center' }}>
        Prices exclude applicable taxes. Payments are processed securely by our payment partner.
      </T>
    </Screen>
  );
}
