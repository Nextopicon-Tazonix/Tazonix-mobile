import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Wallet } from '@/api/types';
import { Card, EmptyState, ErrorView, GradientButton, Input, ListRow, Loading, Row, Screen, SectionHeader, T, Tag } from '@/components/ui';
import { SignInPrompt } from '@/components/SignInPrompt';
import { useAuth } from '@/store/auth';
import { date, money, titleCase, toMinor } from '@/lib/format';
import { notify, showError } from '@/lib/notify';
import { colors } from '@/theme';

const MIN_PAYOUT = 1000;

export default function WalletScreen() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['wallet'], queryFn: () => api.get<Wallet>('/me/wallet'), enabled: !!user });
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<string | null>(null);
  const [method, setMethod] = useState('Bank transfer');

  const payout = useMutation({
    mutationFn: (body: { amountMinor: number; currency: string; method: string }) => api.post('/me/payouts', body, { idempotent: true }),
    onSuccess: () => {
      setAmount('');
      notify('Payout requested', 'Our finance team will review and process it.');
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (e) => showError(e, 'Payout failed'),
  });

  if (!user) return <SignInPrompt title="Your wallet" />;
  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <ErrorView error={q.error} onRetry={q.refetch} />;
  const w = q.data;
  const selected = currency ?? w.balances[0]?.currency ?? 'CAD';
  const bal = w.balances.find((b) => b.currency === selected);

  const request = () => {
    const amountMinor = toMinor(amount);
    if (amountMinor < MIN_PAYOUT) return notify('Amount too small', `Minimum payout is ${money(MIN_PAYOUT, selected)}.`);
    if (!bal || amountMinor > bal.availableMinor) return notify('Insufficient balance', 'You can only withdraw your available balance.');
    payout.mutate({ amountMinor, currency: selected, method });
  };

  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <Stack.Screen options={{ title: 'Wallet' }} />
      {w.balances.length ? (
        w.balances.map((b) => (
          <Card key={b.currency} style={{ borderColor: colors.amber }}>
            <T variant="small">Available ({b.currency})</T>
            <T variant="h1" style={{ color: colors.amber }}>
              {money(b.availableMinor, b.currency)}
            </T>
            {b.pendingMinor ? <T variant="muted">{money(b.pendingMinor, b.currency)} pending (hold period)</T> : null}
          </Card>
        ))
      ) : (
        <Card>
          <T variant="h2">{money(0)}</T>
          <T variant="muted">Win competitions and complete bookings to earn rewards.</T>
        </Card>
      )}
      <T variant="small">Wallet funds are real money. Engagement points are tracked separately and cannot be withdrawn.</T>

      {w.balances.some((b) => b.availableMinor >= MIN_PAYOUT) ? (
        <Card style={{ gap: 8 }}>
          <T variant="h3">Request payout</T>
          <Row>
            {w.balances.map((b) => (
              <Tag key={b.currency} label={b.currency} selected={selected === b.currency} onPress={() => setCurrency(b.currency)} />
            ))}
          </Row>
          <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="50.00" />
          <Input label="Payout method" value={method} onChangeText={setMethod} />
          <GradientButton title="Request payout" loading={payout.isPending} disabled={!amount} onPress={request} />
        </Card>
      ) : null}

      <SectionHeader title="Transactions" />
      {w.transactions.length ? (
        w.transactions.map((t) => (
          <ListRow
            key={t.id}
            title={t.description ?? titleCase(t.type)}
            subtitle={`${date(t.createdAt)} · ${titleCase(t.status)}`}
            right={
              <T style={{ color: t.amountMinor >= 0 ? colors.success : colors.danger, fontFamily: 'Montserrat_700Bold' }}>
                {t.amountMinor >= 0 ? '+' : ''}
                {money(t.amountMinor, t.currency)}
              </T>
            }
          />
        ))
      ) : (
        <EmptyState title="No transactions yet" />
      )}

      {w.payouts.length ? (
        <>
          <SectionHeader title="Payouts" />
          {w.payouts.map((p) => (
            <ListRow
              key={p.id}
              title={money(p.amountMinor, p.currency)}
              subtitle={`${date(p.createdAt)} · ${p.method}${p.note ? ` · ${p.note}` : ''}`}
              right={<Tag label={titleCase(p.status)} color={p.status === 'PAID' ? colors.success : p.status === 'REJECTED' ? colors.danger : colors.amber} />}
            />
          ))}
        </>
      ) : null}
    </Screen>
  );
}
