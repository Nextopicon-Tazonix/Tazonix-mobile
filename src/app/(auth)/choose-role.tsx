import React from 'react';
import { router } from 'expo-router';
import { Briefcase, Mic } from 'lucide-react-native';
import { Card, Row, Screen, T } from '@/components/ui';
import { colors } from '@/theme';

const roles = [
  {
    role: 'TALENT',
    icon: Mic,
    title: "I'm Talent",
    body: 'Singers, dancers, actors, musicians, creators. Build a profile, enter competitions, get discovered and booked.',
  },
  {
    role: 'SEEKER',
    icon: Briefcase,
    title: "I'm looking for talent",
    body: 'Agencies, producers, event organizers and brands. Discover talent, post opportunities and run competitions.',
  },
] as const;

export default function ChooseRole() {
  return (
    <Screen>
      <T variant="h1">How will you use Tazonix?</T>
      <T variant="muted">You can add another role later.</T>
      {roles.map(({ role, icon: Icon, title, body }) => (
        <Card key={role} onPress={() => router.push({ pathname: '/sign-up', params: { role } })}>
          <Row gap={14} style={{ alignItems: 'flex-start' }}>
            <Icon color={role === 'TALENT' ? colors.magenta : colors.blue} size={28} />
            <Row style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start' }} gap={4}>
              <T variant="h3">{title}</T>
              <T variant="muted">{body}</T>
            </Row>
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
