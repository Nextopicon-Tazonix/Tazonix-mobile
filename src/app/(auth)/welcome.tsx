import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Globe, Sparkles, Trophy, Users } from 'lucide-react-native';
import { GoldDivider, GradientButton, Row, T } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { colors, space } from '@/theme';

const pillars = [
  { icon: Users, label: 'Talent discovery' },
  { icon: Sparkles, label: 'AI-powered matching' },
  { icon: Trophy, label: 'Competitions' },
  { icon: Globe, label: 'Global opportunities' },
];

export default function Welcome() {
  return (
    <LinearGradient colors={[colors.navy, '#1A1050', '#3A0F4A']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        <View style={{ alignItems: 'center', gap: space.lg, marginTop: space.xxl }}>
          <Logo size={56} />
          <T variant="tagline" style={{ textAlign: 'center' }}>
            Discover talent. Unlock possibilities.
          </T>
          <GoldDivider />
        </View>

        <View style={{ gap: space.md }}>
          <T variant="h1" style={{ textAlign: 'center' }}>
            Talent has no borders.
          </T>
          <T variant="muted" style={{ textAlign: 'center' }}>
            A global platform for real talent and real opportunities. Get discovered, enter competitions, and get booked.
          </T>
          <Row style={{ flexWrap: 'wrap', justifyContent: 'center', marginTop: space.sm }} gap={space.sm}>
            {pillars.map(({ icon: Icon, label }) => (
              <Row key={label} gap={6} style={styles.pill}>
                <Icon color={colors.amber} size={14} />
                <T variant="small" style={{ color: colors.text }}>
                  {label}
                </T>
              </Row>
            ))}
          </Row>
        </View>

        <View style={{ gap: space.md }}>
          <GradientButton title="Join as Talent" onPress={() => router.push({ pathname: '/sign-up', params: { role: 'TALENT' } })} />
          <GradientButton
            title="Post Opportunities"
            variant="outline"
            onPress={() => router.push({ pathname: '/sign-up', params: { role: 'SEEKER' } })}
          />
          <Row style={{ justifyContent: 'center', marginTop: space.sm }} gap={space.lg}>
            <Pressable onPress={() => router.push('/sign-in')} hitSlop={8}>
              <T style={{ color: colors.blue, fontFamily: 'Montserrat_600SemiBold' }}>I have an account</T>
            </Pressable>
            <Pressable onPress={() => router.replace('/home')} hitSlop={8}>
              <T style={{ color: colors.textMuted, fontFamily: 'Montserrat_600SemiBold' }}>Browse as guest</T>
            </Pressable>
          </Row>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: space.xl, justifyContent: 'space-between' },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
});
