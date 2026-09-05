import { ComponentProps, ReactNode, useContext } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { ThemeContext } from '../context'

export type IconName = ComponentProps<typeof Ionicons>['name']

export function AppText({
  children,
  muted,
  style,
  numberOfLines,
  selectable = false
}: {
  children: ReactNode
  muted?: boolean
  style?: StyleProp<TextStyle>
  numberOfLines?: number
  selectable?: boolean
}) {
  const { theme } = useContext(ThemeContext)
  return (
    <Text
      selectable={selectable}
      numberOfLines={numberOfLines}
      style={[
        {
          color: muted ? theme.mutedForegroundColor : theme.textColor,
          fontFamily: theme.regularFont,
          fontSize: 14,
          lineHeight: 21
        },
        style
      ]}
    >
      {children}
    </Text>
  )
}

export function Mark({ size = 28 }: { size?: number }) {
  const { theme } = useContext(ThemeContext)
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <Path
        d="M16 2V30M2 16H30M6.1 6.1L25.9 25.9M6.1 25.9L25.9 6.1"
        stroke={theme.tintColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M10 2L16 8L22 2M30 10L24 16L30 22M22 30L16 24L10 30M2 22L8 16L2 10"
        stroke={theme.tintColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function IconButton({
  icon,
  label,
  onPress,
  disabled,
  active,
  style
}: {
  icon: IconName
  label: string
  onPress: () => void
  disabled?: boolean
  active?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const { theme } = useContext(ThemeContext)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.iconButton,
        {
          backgroundColor: active || hovered || pressed ? theme.accentSoft : 'transparent',
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1
        },
        style
      ]}
    >
      <Ionicons name={icon} size={20} color={active ? theme.tintColor : theme.mutedForegroundColor} />
    </Pressable>
  )
}

export function Button({
  children,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  loading,
  style
}: {
  children: string
  onPress: () => void
  icon?: IconName
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled?: boolean
  loading?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const { theme } = useContext(ThemeContext)
  const color =
    variant === 'primary' ? theme.tintTextColor : variant === 'danger' ? theme.dangerColor : theme.textColor
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={children}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.button,
        {
          backgroundColor:
            variant === 'primary'
              ? theme.tintColor
              : variant === 'secondary'
                ? theme.surfaceColor
                : 'transparent',
          borderColor: variant === 'secondary' ? theme.borderColor : 'transparent',
          opacity: disabled ? 0.4 : pressed ? 0.65 : hovered ? 0.85 : 1
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : icon ? (
        <Ionicons name={icon} size={17} color={color} />
      ) : null}
      <AppText style={{ color, fontFamily: theme.mediumFont }}>{children}</AppText>
    </Pressable>
  )
}

export function Tag({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  const { theme } = useContext(ThemeContext)
  return (
    <View style={[styles.tag, { backgroundColor: accent ? theme.accentSoft : theme.surfaceColor }]}>
      <AppText
        style={{ fontSize: 11, lineHeight: 16, color: accent ? theme.tintColor : theme.mutedForegroundColor }}
      >
        {children}
      </AppText>
    </View>
  )
}

export function Notice({
  children,
  action,
  onAction
}: {
  children: ReactNode
  action?: string
  onAction?: () => void
}) {
  const { theme } = useContext(ThemeContext)
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.notice, { borderColor: theme.borderColor, backgroundColor: theme.surfaceColor }]}
    >
      <Ionicons name="information-circle-outline" size={18} color={theme.mutedForegroundColor} />
      <AppText muted style={{ flex: 1, fontSize: 13 }}>
        {children}
      </AppText>
      {action && onAction && (
        <Button variant="ghost" onPress={onAction}>
          {action}
        </Button>
      )}
    </View>
  )
}

export function Sheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false
}: {
  visible: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  const { theme } = useContext(ThemeContext)
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              {
                backgroundColor: theme.backgroundColor,
                borderColor: theme.borderColor,
                maxWidth: wide ? 920 : 560
              }
            ]}
          >
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1, gap: 5 }}>
                <AppText style={{ fontSize: 22, lineHeight: 29, fontFamily: theme.semiBoldFont }}>
                  {title}
                </AppText>
                {!!subtitle && (
                  <AppText muted style={{ fontSize: 13 }}>
                    {subtitle}
                  </AppText>
                )}
              </View>
              <IconButton icon="close" label="Close dialog" onPress={onClose} />
            </View>
            {children}
            {footer && <View style={[styles.sheetFooter, { borderColor: theme.borderColor }]}>{footer}</View>}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.page}
    >
      <View style={styles.pageInner}>{children}</View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0
  },
  button: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  tag: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start' },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 20, 14, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  sheet: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({ web: { boxShadow: '0 20px 80px rgba(0,0,0,0.15)' } })
  },
  sheetHeader: { padding: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sheetFooter: { paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1 },
  page: { flexGrow: 1, padding: 24, paddingBottom: 48, alignItems: 'center' },
  pageInner: { width: '100%', maxWidth: 860, gap: 28 }
})
