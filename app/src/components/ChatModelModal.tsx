import { useContext, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AppContext, ThemeContext } from '../context'
import { getProviderIcon, PROVIDER_NAMES } from '../../constants'
import { AppText, Sheet, Tag } from './ui'

export function ChatModelModal({
  mode,
  visible,
  onClose
}: {
  mode: 'chat' | 'image'
  visible: boolean
  onClose: () => void
}) {
  const { theme } = useContext(ThemeContext)
  const { models, imageModels, chatType, imageModel, setChatType, setImageModel, connection } =
    useContext(AppContext)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const options = useMemo(() => {
    const choices = mode === 'chat' ? models : imageModels
    return choices
      .filter((m) =>
        `${m.name} ${PROVIDER_NAMES[m.provider]} ${m.description}`.toLowerCase().includes(query.toLowerCase())
      )
      .filter(
        (m) =>
          filter === 'All' ||
          (filter === 'Vision' ? 'supportsVision' in m && m.supportsVision : 'tier' in m && m.tier === filter)
      )
      .sort((a, b) => Number(b.available === true) - Number(a.available === true))
  }, [mode, models, imageModels, query, filter])
  const selected = mode === 'chat' ? chatType.label : imageModel

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={mode === 'chat' ? 'A model for every thought.' : 'Choose your image model.'}
      subtitle={
        mode === 'chat'
          ? 'Switch models, not conversations. Your context stays with you.'
          : 'Create from a prompt. Refine with reference images.'
      }
      footer={
        <AppText muted style={{ fontSize: 12 }}>
          {connection === 'connected'
            ? 'Provider status reflects server keys, not account access. Usage is billed by each provider.'
            : 'Connect your server in Settings to check provider availability.'}
        </AppText>
      }
    >
      <View style={[styles.search, { backgroundColor: theme.surfaceColor, borderColor: theme.borderColor }]}>
        <Ionicons name="search-outline" size={18} color={theme.mutedForegroundColor} />
        <TextInput
          autoFocus
          placeholder="Search models or providers"
          accessibilityLabel="Search models"
          value={query}
          onChangeText={setQuery}
          placeholderTextColor={theme.placeholderTextColor}
          style={[styles.input, { color: theme.textColor, fontFamily: theme.regularFont }]}
        />
      </View>
      {mode === 'chat' && (
        <View style={styles.filters}>
          {['All', 'Fast', 'Balanced', 'Deep', 'Vision'].map((value) => (
            <Pressable
              key={value}
              onPress={() => setFilter(value)}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === value }}
              style={[
                styles.filter,
                { backgroundColor: filter === value ? theme.accentSoft : 'transparent' }
              ]}
            >
              <AppText
                style={{
                  fontSize: 12,
                  color: filter === value ? theme.tintColor : theme.mutedForegroundColor
                }}
              >
                {value}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}>
        {options.length === 0 && (
          <AppText muted style={{ textAlign: 'center', padding: 30 }}>
            No models match this search.
          </AppText>
        )}
        {options.map((option) => {
          const Icon = getProviderIcon(option.provider)
          const active = selected === option.label
          return (
            <Pressable
              key={option.label}
              accessibilityRole="button"
              accessibilityLabel={`Select ${option.name}${option.available === false ? ', provider not configured' : ''}`}
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (mode === 'chat') setChatType(models.find((m) => m.label === option.label)!)
                else setImageModel(option.label)
                onClose()
              }}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.option,
                {
                  borderColor: active ? theme.tintColor : 'transparent',
                  backgroundColor: active || hovered || pressed ? theme.surfaceColor : 'transparent'
                }
              ]}
            >
              <View style={[styles.providerIcon, { backgroundColor: theme.elevatedColor }]}>
                <Icon size={21} theme={theme} />
              </View>
              <View style={{ flex: 1, gap: 5 }}>
                <View style={styles.row}>
                  <AppText style={{ fontFamily: theme.mediumFont }}>{option.name}</AppText>
                  {'recommended' in option && option.recommended && <Tag accent>Everyday pick</Tag>}
                </View>
                <AppText muted style={{ fontSize: 12, lineHeight: 18 }}>
                  {option.description}
                </AppText>
                <View style={styles.row}>
                  <AppText muted style={{ fontSize: 11 }}>
                    {PROVIDER_NAMES[option.provider]}
                  </AppText>
                  {'tier' in option && <Tag>{String(option.tier)}</Tag>}
                  {'supportsVision' in option && option.supportsVision && (
                    <Ionicons name="image-outline" color={theme.mutedForegroundColor} size={13} />
                  )}
                  <AppText
                    style={{
                      fontSize: 11,
                      color: option.available ? theme.successColor : theme.mutedForegroundColor
                    }}
                  >
                    {option.available === undefined
                      ? 'Not checked'
                      : option.available
                        ? 'Configured'
                        : 'Needs API key'}
                  </AppText>
                </View>
              </View>
              {active && <Ionicons name="checkmark-circle" size={21} color={theme.tintColor} />}
            </Pressable>
          )
        })}
      </ScrollView>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  search: {
    marginHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1
  },
  input: { flex: 1, minHeight: 46, fontSize: 14 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginHorizontal: 24, marginTop: 12 },
  filter: { minHeight: 44, paddingHorizontal: 12, borderRadius: 10, justifyContent: 'center' },
  list: { padding: 16, gap: 4 },
  option: {
    padding: 12,
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  providerIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }
})
