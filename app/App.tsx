import { Component, ErrorInfo, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native'
import { useFonts } from 'expo-font'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Main } from './src/main'
import { ThemeContext, AppContext } from './src/context'
import { getTheme } from './src/theme'
import { DOMAIN, IMAGE_MODELS, MODELS, fetchModels, normalizeDomain } from './constants'
import { ChatModelModal } from './src/components/ChatModelModal'
import { IAppContext, ImageModel, Model } from './types'

const SETTINGS_KEY = 'rnai-settings-v2'

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {}
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Let’s try that again.</Text>
        <Text>The app encountered an unexpected error. Your saved work is still on this device.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => this.setState({ failed: false })}
          style={styles.retry}
        >
          <Text>Reload workspace</Text>
        </Pressable>
      </View>
    )
  }
}

function WorkspaceApp() {
  const scheme = useColorScheme()
  const [themeName, setTheme] = useState('system')
  const [chatLabel, setChatLabel] = useState('claudeSonnet5')
  const [imageModel, setImageModel] = useState('nanoBanana2')
  const [models, setModels] = useState<Model[]>(Object.values(MODELS))
  const [imageModels, setImageModels] = useState<ImageModel[]>(Object.values(IMAGE_MODELS))
  const [systemPrompt, setSystemPrompt] = useState('')
  const [apiUrl, setApiUrl] = useState(DOMAIN)
  const [token, setToken] = useState('')
  const [connection, setConnectionStatus] = useState<IAppContext['connection']>('unconfigured')
  const [modal, setModal] = useState<'chat' | 'image' | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [toast, setToast] = useState('')
  const registryRequest = useRef<AbortController | null>(null)
  const writes = useRef(Promise.resolve())
  const settingsWritable = useRef(true)
  const [fontsLoaded, fontError] = useFonts({
    'Geist-Regular': require('./assets/fonts/Geist-Regular.otf'),
    'Geist-Medium': require('./assets/fonts/Geist-Medium.otf'),
    'Geist-SemiBold': require('./assets/fonts/Geist-SemiBold.otf')
  })
  const notify = useCallback((message: string) => setToast(message), [])

  useEffect(() => {
    let mounted = true
    AsyncStorage.multiGet([SETTINGS_KEY, 'rnai-theme', 'rnai-systemPrompt'])
      .then((values) => {
        if (!mounted) return
        const stored = values[0][1]
        if (stored) {
          const data = JSON.parse(stored)
          if (typeof data.theme === 'string') setTheme(data.theme)
          if (typeof data.chatLabel === 'string') setChatLabel(data.chatLabel)
          if (typeof data.imageModel === 'string') setImageModel(data.imageModel)
          if (typeof data.systemPrompt === 'string') setSystemPrompt(data.systemPrompt.slice(0, 8000))
          if (typeof data.apiUrl === 'string') setApiUrl(normalizeDomain(data.apiUrl))
        } else {
          if (values[1][1]) setTheme(values[1][1])
          if (values[2][1]) setSystemPrompt(values[2][1])
        }
      })
      .catch(() => {
        settingsWritable.current = false
        notify('Saved settings could not be read. The original settings will not be overwritten.')
      })
      .finally(() => {
        if (mounted) setHydrated(true)
      })
    return () => {
      mounted = false
    }
  }, [notify])

  useEffect(() => {
    if (!hydrated || !settingsWritable.current) return
    const timer = setTimeout(() => {
      const value = JSON.stringify({ theme: themeName, chatLabel, imageModel, systemPrompt, apiUrl })
      writes.current = writes.current
        .then(() => AsyncStorage.setItem(SETTINGS_KEY, value))
        .catch(() => notify('Settings could not be saved. Check the free space on this device.'))
    }, 300)
    return () => clearTimeout(timer)
  }, [themeName, chatLabel, imageModel, systemPrompt, apiUrl, hydrated, notify])

  const refreshModels = useCallback(async () => {
    registryRequest.current?.abort()
    const controller = new AbortController()
    registryRequest.current = controller
    setConnectionStatus(apiUrl ? 'checking' : 'unconfigured')
    const timeout = setTimeout(() => controller.abort(), 8000)
    const result = await fetchModels(apiUrl, controller.signal)
    clearTimeout(timeout)
    if (registryRequest.current !== controller) return
    setModels(result.models)
    setImageModels(result.imageModels)
    setConnectionStatus(!apiUrl ? 'unconfigured' : result.connected ? 'connected' : 'offline')
    if (result.connected) {
      setChatLabel((current) =>
        result.models.find((m) => m.label === current)?.available
          ? current
          : result.models.find((m) => m.available)?.label || current
      )
      setImageModel((current) =>
        result.imageModels.find((m) => m.label === current)?.available
          ? current
          : result.imageModels.find((m) => m.available)?.label || current
      )
    }
  }, [apiUrl])

  useEffect(() => {
    if (!hydrated) return
    void refreshModels()
    return () => {
      registryRequest.current?.abort()
      registryRequest.current = null
    }
  }, [refreshModels, hydrated])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  const chatType = models.find((m) => m.label === chatLabel) || models[0]
  const theme = useMemo(() => getTheme(themeName, scheme), [themeName, scheme])
  const setChatType = useCallback((model: Model) => setChatLabel(model.label), [])
  const closeModal = useCallback(() => setModal(null), [])
  const handlePresentModalPress = useCallback((mode: 'chat' | 'image' = 'chat') => setModal(mode), [])
  const setConnection = useCallback((url: string, authToken: string) => {
    setApiUrl(normalizeDomain(url))
    setToken(authToken.trim())
  }, [])
  const context = useMemo<IAppContext>(
    () => ({
      chatType,
      setChatType,
      imageModel,
      setImageModel,
      models,
      imageModels,
      systemPrompt,
      setSystemPrompt,
      apiUrl,
      token,
      setConnection,
      connection,
      refreshModels,
      notify,
      closeModal,
      handlePresentModalPress
    }),
    [
      chatType,
      setChatType,
      imageModel,
      models,
      imageModels,
      systemPrompt,
      apiUrl,
      token,
      setConnection,
      connection,
      refreshModels,
      notify,
      closeModal,
      handlePresentModalPress
    ]
  )

  if ((!fontsLoaded && !fontError) || !hydrated)
    return (
      <View style={[styles.loading, { backgroundColor: theme.backgroundColor }]}>
        <ActivityIndicator color={theme.tintColor} accessibilityLabel="Loading workspace" />
      </View>
    )

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme }}>
      <AppContext.Provider value={context}>
        <StatusBar style={theme.statusBarStyle} />
        <Main />
        <ChatModelModal
          key={modal || 'closed'}
          mode={modal || 'chat'}
          visible={!!modal}
          onClose={closeModal}
        />
        {!!toast && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${toast} Dismiss notification`}
            accessibilityLiveRegion="polite"
            onPress={() => setToast('')}
            style={[styles.toast, { backgroundColor: theme.textColor }]}
          >
            <Text
              style={{
                fontFamily: theme.regularFont,
                color: theme.backgroundColor,
                fontSize: 13,
                lineHeight: 20
              }}
            >
              {toast}
            </Text>
          </Pressable>
        )}
      </AppContext.Provider>
    </ThemeContext.Provider>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <WorkspaceApp />
      </ErrorBoundary>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  toast: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    maxWidth: 440,
    marginHorizontal: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14
  },
  fallback: { flex: 1, backgroundColor: '#FAFAF7', padding: 32, justifyContent: 'center', gap: 20 },
  fallbackTitle: { fontSize: 26, color: '#272B26' },
  retry: { padding: 16, backgroundColor: '#E7EDDF', borderRadius: 12, alignSelf: 'flex-start' }
})
