import { useContext, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AppContext, ThemeContext } from '../context'
import { THEMES } from '../theme'
import { PROVIDER_NAMES, normalizeDomain } from '../../constants'
import { AppText, Button, Notice, Page, Tag } from '../components/ui'
import { errorMessage } from '../utils'

export function Settings() {
  const { theme, themeName, setTheme } = useContext(ThemeContext)
  const {
    apiUrl,
    token,
    setConnection,
    connection,
    refreshModels,
    chatType,
    imageModel,
    imageModels,
    models,
    handlePresentModalPress,
    systemPrompt,
    setSystemPrompt,
    notify
  } = useContext(AppContext)
  const [url, setUrl] = useState(apiUrl)
  const [sessionToken, setSessionToken] = useState(token)
  const [error, setError] = useState('')
  const field = [
    styles.field,
    {
      borderColor: theme.borderColor,
      backgroundColor: theme.elevatedColor,
      color: theme.textColor,
      fontFamily: theme.regularFont
    }
  ]
  const section = [styles.section, { borderColor: theme.borderColor, backgroundColor: theme.elevatedColor }]

  function connect() {
    try {
      const normalized = normalizeDomain(url)
      if (!normalized) throw new Error('Enter your server address.')
      const parsed = new URL(normalized)
      if (
        parsed.protocol !== 'https:' &&
        !['localhost', '127.0.0.1', '10.0.2.2', '[::1]'].includes(parsed.hostname) &&
        sessionToken
      )
        throw new Error('Use HTTPS to send a session token to a remote server.')
      setError('')
      setUrl(normalized)
      if (normalized === apiUrl) void refreshModels()
      setConnection(normalized, sessionToken)
      notify('Connection settings saved. Provider keys stay on your server.')
    } catch (failure) {
      setError(errorMessage(failure))
    }
  }

  return (
    <Page>
      <View style={{ gap: 10, paddingTop: 28 }}>
        <AppText muted style={styles.eyebrow}>
          MAKE IT YOURS
        </AppText>
        <AppText style={[styles.title, { fontFamily: theme.mediumFont }]}>A calmer workspace.</AppText>
        <AppText muted>Just the essentials, exactly how you like them.</AppText>
      </View>
      <View style={section}>
        <View style={styles.heading}>
          <Ionicons name="color-palette-outline" size={20} color={theme.tintColor} />
          <AppText style={{ fontFamily: theme.mediumFont, fontSize: 16 }}>Appearance</AppText>
        </View>
        <View style={styles.themes}>
          {[
            {
              label: 'system',
              name: 'System',
              backgroundColor: theme.backgroundColor,
              tintColor: theme.tintColor
            },
            ...Object.values(THEMES)
          ].map((option) => (
            <Pressable
              key={option.label}
              accessibilityRole="button"
              accessibilityLabel={`Use ${option.name} appearance`}
              accessibilityState={{ selected: themeName === option.label }}
              onPress={() => setTheme(option.label)}
              style={[
                styles.themeChoice,
                {
                  borderColor: themeName === option.label ? theme.tintColor : theme.borderColor,
                  backgroundColor: themeName === option.label ? theme.accentSoft : 'transparent'
                }
              ]}
            >
              <View
                style={[
                  styles.themePreview,
                  { backgroundColor: option.backgroundColor, borderColor: theme.borderColor }
                ]}
              >
                {option.label === 'system' ? (
                  <Ionicons name="contrast-outline" color={theme.tintColor} size={22} />
                ) : (
                  <>
                    <View
                      style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: option.tintColor }}
                    />
                    <View style={{ gap: 5 }}>
                      <View
                        style={{
                          width: 27,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: option.tintColor,
                          opacity: 0.5
                        }}
                      />
                      <View
                        style={{
                          width: 19,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: option.tintColor,
                          opacity: 0.25
                        }}
                      />
                    </View>
                  </>
                )}
              </View>
              <AppText
                style={{
                  fontSize: 12,
                  color: themeName === option.label ? theme.tintColor : theme.mutedForegroundColor
                }}
              >
                {option.name}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={section}>
        <View style={styles.heading}>
          <Ionicons name="radio-outline" size={20} color={theme.tintColor} />
          <AppText style={{ fontFamily: theme.mediumFont, fontSize: 16, flex: 1 }}>
            Your AI connection
          </AppText>
          <Tag accent={connection === 'connected'}>
            {connection === 'connected'
              ? 'Connected'
              : connection === 'checking'
                ? 'Checking'
                : 'Not connected'}
          </Tag>
        </View>
        <AppText muted style={{ fontSize: 13 }}>
          Connect the app to your React Native AI server. Your provider API keys belong on that server, never
          in the app.
        </AppText>
        <View style={styles.fieldGroup}>
          <AppText style={styles.label}>Server address</AppText>
          <TextInput
            accessibilityLabel="Server address"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="http://localhost:3050"
            placeholderTextColor={theme.placeholderTextColor}
            value={url}
            onChangeText={setUrl}
            style={field}
          />
        </View>
        <View style={styles.fieldGroup}>
          <AppText style={styles.label}>
            Session token{' '}
            <AppText muted style={styles.label}>
              (optional)
            </AppText>
          </AppText>
          <TextInput
            accessibilityLabel="Server session token"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            placeholder="Only if your server requires authentication"
            placeholderTextColor={theme.placeholderTextColor}
            value={sessionToken}
            onChangeText={setSessionToken}
            style={field}
          />
          <AppText muted style={{ fontSize: 11 }}>
            Held in memory for this session. It is not saved to device storage.
          </AppText>
        </View>
        {!!error && <Notice>{error}</Notice>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Button onPress={connect} icon="link-outline" loading={connection === 'checking'}>
            Save connection
          </Button>
          <Button
            variant="secondary"
            onPress={() => void refreshModels()}
            disabled={!apiUrl || connection === 'checking'}
            icon="refresh-outline"
          >
            Refresh models
          </Button>
        </View>
        <AppText muted style={{ fontSize: 12, lineHeight: 20 }}>
          On a physical phone, use your computer’s local network address or an HTTPS tunnel. Localhost refers
          to the phone itself.
        </AppText>
        <View style={[styles.providers, { borderColor: theme.borderColor }]}>
          {Object.entries(PROVIDER_NAMES).map(([provider, name]) => {
            const configured = models.some((m) => m.provider === provider && m.available)
            return (
              <View key={provider} style={styles.provider}>
                <AppText style={{ fontSize: 13 }}>{name}</AppText>
                <AppText muted style={{ fontSize: 12 }}>
                  {connection !== 'connected'
                    ? 'Not checked'
                    : configured
                      ? 'API key configured'
                      : 'Needs API key'}
                </AppText>
              </View>
            )
          })}
        </View>
        <AppText muted style={{ fontSize: 11 }}>
          Provider status checks server settings, not model access or billing. Your provider account must
          allow the selected model.
        </AppText>
      </View>
      <View style={section}>
        <View style={styles.heading}>
          <Ionicons name="sparkles-outline" size={20} color={theme.tintColor} />
          <AppText style={{ fontFamily: theme.mediumFont, fontSize: 16 }}>Default models</AppText>
        </View>
        {[
          { title: 'Conversations', name: chatType.name, mode: 'chat' as const },
          {
            title: 'Image studio',
            name:
              imageModels.find((m) => m.label === imageModel)?.name ||
              imageModels[0]?.name ||
              'Choose a model',
            mode: 'image' as const
          }
        ].map((item) => (
          <Pressable
            key={item.mode}
            accessibilityRole="button"
            accessibilityLabel={`Change ${item.title} model`}
            onPress={() => handlePresentModalPress(item.mode)}
            style={[styles.modelRow, { borderColor: theme.borderColor }]}
          >
            <View style={{ flex: 1 }}>
              <AppText muted style={{ fontSize: 11 }}>
                {item.title}
              </AppText>
              <AppText style={{ fontFamily: theme.mediumFont }}>{item.name}</AppText>
            </View>
            <Ionicons name="chevron-forward" color={theme.mutedForegroundColor} size={16} />
          </Pressable>
        ))}
      </View>
      <View style={section}>
        <View style={styles.heading}>
          <Ionicons name="create-outline" size={20} color={theme.tintColor} />
          <AppText style={{ fontFamily: theme.mediumFont, fontSize: 16 }}>A little context about you</AppText>
        </View>
        <AppText muted style={{ fontSize: 13 }}>
          Tell the model how you like to work. These instructions go with every chat message, but not image
          requests.
        </AppText>
        <TextInput
          accessibilityLabel="Custom instructions"
          multiline
          maxLength={8000}
          value={systemPrompt}
          onChangeText={setSystemPrompt}
          placeholder="Keep it concise. Ask questions when you need context. I prefer practical examples."
          placeholderTextColor={theme.placeholderTextColor}
          style={[field, { minHeight: 132, textAlignVertical: 'top', paddingVertical: 14, lineHeight: 23 }]}
        />
        <AppText muted style={{ fontSize: 11, textAlign: 'right' }}>
          Saved automatically · {systemPrompt.length.toLocaleString()} / 8,000
        </AppText>
      </View>
      <View style={{ gap: 10, paddingHorizontal: 8 }}>
        <AppText style={{ fontFamily: theme.mediumFont }}>Your work, your device.</AppText>
        <AppText muted style={{ fontSize: 12, lineHeight: 21 }}>
          Conversations and images are stored locally, without encryption. Nothing syncs between devices. Your
          server forwards requests to the selected provider. Provider retention policies still apply. Export
          anything you want to keep before you clear app or browser data.
        </AppText>
        <AppText muted style={{ fontSize: 11, paddingTop: 12 }}>
          React Native AI · An open workspace for human ideas.
        </AppText>
      </View>
    </Page>
  )
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 10, letterSpacing: 1.8 },
  title: { fontSize: 34, lineHeight: 43, letterSpacing: -1.3 },
  section: { borderWidth: 1, borderRadius: 20, padding: 24, gap: 18 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  themes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeChoice: { width: 96, borderWidth: 1, borderRadius: 12, alignItems: 'center', gap: 8, padding: 8 },
  themePreview: {
    width: '100%',
    height: 48,
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7
  },
  fieldGroup: { gap: 8 },
  label: { fontSize: 12 },
  field: { minHeight: 48, borderWidth: 1, borderRadius: 11, paddingHorizontal: 14, fontSize: 14 },
  providers: { borderTopWidth: 1, paddingTop: 14, gap: 12 },
  provider: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14
  }
})
