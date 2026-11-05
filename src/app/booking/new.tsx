import React, { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, api } from '@/api/client';
import { GradientButton, Input, Row, Screen, T, Tag } from '@/components/ui';
import { toMinor } from '@/lib/format';
import { notify, showError } from '@/lib/notify';

const currencies = ['CAD', 'USD', 'NGN'];

export default function NewBooking() {
  const { talentId, name } = useLocalSearchParams<{ talentId: string; name?: string }>();
  const qc = useQueryClient();
  const [eventDate, setEventDate] = useState('');
  const [venue, setVenue] = useState('');
  const [details, setDetails] = useState('');
  const [fee, setFee] = useState('');
  const [currency, setCurrency] = useState('CAD');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (Number.isNaN(Date.parse(eventDate))) return notify('Invalid date', 'Use the format YYYY-MM-DD.');
    setLoading(true);
    try {
      await api.post('/bookings', {
        talentId,
        eventDate: new Date(eventDate).toISOString(),
        venue: venue.trim(),
        details: details.trim() || null,
        feeMinor: toMinor(fee),
        currency,
      });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      notify('Booking requested', `${name ?? 'The talent'} will be asked to accept.`);
      router.back();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SUBSCRIPTION_REQUIRED') router.replace({ pathname: '/plans', params: { reason: 'contact' } });
      else showError(e, 'Could not request booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Request booking' }} />
      <T variant="h2">Book {name ?? 'talent'}</T>
      <Input label="Event date (YYYY-MM-DD)" value={eventDate} onChangeText={setEventDate} placeholder="2026-12-20" />
      <Input label="Venue" value={venue} onChangeText={setVenue} placeholder="Massey Hall, Toronto" />
      <Input label="Details" value={details} onChangeText={setDetails} multiline placeholder="Set length, audience, rider…" />
      <Input label="Fee" value={fee} onChangeText={setFee} keyboardType="decimal-pad" placeholder="1500.00" />
      <Row>
        {currencies.map((c) => (
          <Tag key={c} label={c} selected={currency === c} onPress={() => setCurrency(c)} />
        ))}
      </Row>
      <GradientButton title="Send booking request" loading={loading} disabled={!eventDate || !venue.trim() || !fee} onPress={submit} />
    </Screen>
  );
}
