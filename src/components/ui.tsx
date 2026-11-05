import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { colors, fonts, gradient, radius, space } from '@/theme';
import { absoluteUrl } from '@/api/client';
import type { LucideIcon } from 'lucide-react-native';

// ---------- Text ----------
type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'muted' | 'small' | 'label' | 'tagline';
export function T({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  return <Text {...rest} style={[textStyles[variant], style]} />;
}
const textStyles = StyleSheet.create({
  h1: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.text, lineHeight: 34 },
  h2: { fontFamily: fonts.bold, fontSize: 22, color: colors.text, lineHeight: 28 },
  h3: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, lineHeight: 21 },
  muted: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  small: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, marginBottom: 6 },
  tagline: { fontFamily: fonts.medium, fontSize: 11, color: colors.text, letterSpacing: 3, textTransform: 'uppercase' },
});

// ---------- Screen ----------
export function Screen({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  edges = ['bottom'],
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.blue} /> : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

// ---------- Buttons ----------
type BtnVariant = 'gradient' | 'outline' | 'ghost' | 'danger' | 'solid';
export function GradientButton({
  title,
  onPress,
  variant = 'gradient',
  loading,
  disabled,
  icon,
  style,
  small,
}: {
  title: string;
  onPress?: () => void;
  variant?: BtnVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const isDisabled = disabled || loading;
  const inner = (
    <View style={[styles.btnInner, small && styles.btnSmall]}>
      {loading ? <ActivityIndicator color={colors.text} /> : icon}
      <Text style={[styles.btnText, small && { fontSize: 13 }, variant === 'danger' && { color: colors.danger }]}>{title}</Text>
    </View>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'outline' && styles.btnOutline,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        variant === 'solid' && { backgroundColor: colors.blue },
        isDisabled && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {variant === 'gradient' ? (
        <LinearGradient colors={gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnGradient}>
          {inner}
        </LinearGradient>
      ) : (
        inner
      )}
    </Pressable>
  );
}

// ---------- Card ----------
export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}>
        {children}
      </Pressable>
    );
  return <View style={[styles.card, style]}>{children}</View>;
}

// ---------- Input ----------
export function Input({ label, error, style, ...rest }: TextInputProps & { label?: string; error?: string | null }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ marginBottom: space.md }}>
      {label ? <T variant="label">{label}</T> : null}
      <TextInput
        placeholderTextColor={colors.textFaint}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          styles.input,
          rest.multiline && { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 },
          focused && { borderColor: colors.blue },
          !!error && { borderColor: colors.danger },
          style,
        ]}
      />
      {error ? <T style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>{error}</T> : null}
    </View>
  );
}

// ---------- Tag / chips ----------
export function Tag({
  label,
  selected,
  onPress,
  color,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  const content = (
    <View
      style={[
        styles.tag,
        color ? { borderColor: color } : null,
        selected && { backgroundColor: colors.blue, borderColor: colors.blue },
      ]}
    >
      <Text style={[styles.tagText, color && !selected ? { color } : null]}>{label}</Text>
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

export function Segmented<V extends string>({
  value,
  options,
  onChange,
}: {
  value: V;
  options: { value: V; label: string }[];
  onChange: (v: V) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          style={[styles.segment, value === o.value && styles.segmentActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === o.value }}
        >
          <Text style={[styles.segmentText, value === o.value && { color: colors.text }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---------- Avatar ----------
export function Avatar({ uri, name, size = 44 }: { uri?: string | null; name?: string; size?: number }) {
  const src = absoluteUrl(uri);
  const initials = (name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  if (src) return <Image source={{ uri: src }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />;
  return (
    <LinearGradient
      colors={gradient.cool}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: size * 0.38 }}>{initials}</Text>
    </LinearGradient>
  );
}

// ---------- States ----------
export function EmptyState({ title, message, action }: { title: string; message?: string; action?: React.ReactNode }) {
  return (
    <View style={styles.empty}>
      <T variant="h3" style={{ textAlign: 'center' }}>
        {title}
      </T>
      {message ? (
        <T variant="muted" style={{ textAlign: 'center', marginTop: 6 }}>
          {message}
        </T>
      ) : null}
      {action ? <View style={{ marginTop: space.lg, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={colors.blue} size="large" />
    </View>
  );
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Something went wrong';
  return (
    <EmptyState
      title="Couldn't load this"
      message={message}
      action={onRetry ? <GradientButton title="Try again" variant="outline" onPress={onRetry} /> : undefined}
    />
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <T variant="h3">{title}</T>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ color: colors.blue, fontFamily: fonts.semibold }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Row({ children, style, gap = space.sm }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function GoldDivider() {
  return <LinearGradient colors={gradient.warm} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.divider} />;
}

export function ListRow({ title, subtitle, right, onPress }: { title: string; subtitle?: string; right?: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.listRow, pressed && onPress && { opacity: 0.7 }]}>
      <View style={{ flex: 1 }}>
        <T variant="h3" style={{ fontSize: 15 }}>
          {title}
        </T>
        {subtitle ? <T variant="small">{subtitle}</T> : null}
      </View>
      {right}
    </Pressable>
  );
}

export function MenuItem({ icon: Icon, title, subtitle, onPress }: { icon: LucideIcon; title: string; subtitle?: string; onPress: () => void }) {
  return <ListRow title={title} subtitle={subtitle} onPress={onPress} right={<Icon color={colors.textMuted} size={20} />} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  btn: { borderRadius: radius.pill, overflow: 'hidden', minHeight: 48, justifyContent: 'center' },
  btnGradient: { borderRadius: radius.pill, minHeight: 48, justifyContent: 'center' },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  btnSmall: { paddingHorizontal: 14, paddingVertical: 8 },
  btnText: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  btnOutline: { borderWidth: 1.5, borderColor: colors.purple, backgroundColor: 'transparent' },
  btnGhost: { backgroundColor: colors.surfaceAlt },
  btnDanger: { borderWidth: 1.5, borderColor: colors.danger, backgroundColor: 'transparent' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: colors.border },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  tag: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surfaceAlt,
  },
  tagText: { color: colors.text, fontFamily: fonts.medium, fontSize: 12 },
  segmented: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.pill, padding: 4, borderWidth: 1, borderColor: colors.border },
  segment: { flex: 1, paddingVertical: 8, borderRadius: radius.pill, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.purple },
  segmentText: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 13 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: space.xxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.sm },
  divider: { height: 3, width: 64, borderRadius: 2 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: space.md,
  },
});
