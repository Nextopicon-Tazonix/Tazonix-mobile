import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, gradient } from '@/theme';

/** Gradient "T" monogram + TAZONIX wordmark (brand board primary lockup). */
export function Logo({ size = 40, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <View style={styles.row}>
      <LinearGradient colors={gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.mark, { width: size, height: size, borderRadius: size * 0.24 }]}>
        <Text style={[styles.t, { fontSize: size * 0.68, lineHeight: size * 0.9 }]}>T</Text>
      </LinearGradient>
      {wordmark ? (
        <Text style={[styles.word, { fontSize: size * 0.62 }]}>
          TAZONI<Text style={{ color: colors.magenta }}>X</Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { alignItems: 'center', justifyContent: 'center' },
  t: { color: colors.text, fontFamily: fonts.extrabold },
  word: { color: colors.text, fontFamily: fonts.extrabold, letterSpacing: 1 },
});
