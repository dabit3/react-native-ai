import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import * as Speech from 'expo-speech'
import Markdown from '@ronradtke/react-native-markdown-display'
import { AppContext, ThemeContext } from '../context'
import { useChatStream } from '../hooks/useChatStream'
import { ChatMessage, Conversation, ImageAttachment, Theme } from '../../types'
import { PROMPT_SUGGESTIONS } from '../../constants'
import { conversationTitle, getContextMessages, transcript } from '../conversations'
import { newId, pickImages, saveImage } from '../media'
import { errorMessage } from '../utils'
import { AppText, Button, IconButton, Mark, Notice, Sheet, Tag } from '../components/ui'
import { MediaImage } from '../components/MediaImage'

function stripMarkdown(text: string) {
  return text.replace(/```[\s\S]*?```/g, ' code block ').replace(/[*_~`#>]/g, '')
}

const Message = memo(function Message({
  message,
  theme,
  live = false,
  last = false,
  onCopy,
  onSpeak,
  onRetry,
  onImage
}: {
  message: ChatMessage
  theme: Theme
  live?: boolean
  last?: boolean
  onCopy: (text: string) => void
  onSpeak: (text: string) => void
  onRetry: () => void
  onImage: (image: ImageAttachment) => void
}) {
  const markdown = useMemo(
    () => ({
      body: { color: theme.textColor, fontFamily: theme.regularFont, fontSize: 16, lineHeight: 27 },
      paragraph: { marginTop: 0, marginBottom: 14 },
      heading1: {
        fontFamily: theme.semiBoldFont,
        fontSize: 25,
        lineHeight: 34,
        marginTop: 18,
        marginBottom: 12
      },
      heading2: {
        fontFamily: theme.semiBoldFont,
        fontSize: 21,
        lineHeight: 29,
        marginTop: 16,
        marginBottom: 10
      },
      heading3: {
        fontFamily: theme.semiBoldFont,
        fontSize: 18,
        lineHeight: 26,
        marginTop: 14,
        marginBottom: 8
      },
      strong: { fontFamily: theme.semiBoldFont },
      link: { color: theme.tintColor, textDecorationLine: 'underline' as const },
      code_inline: {
        color: theme.textColor,
        backgroundColor: theme.surfaceColor,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 13
      },
      fence: {
        backgroundColor: theme.surfaceColor,
        borderColor: theme.borderColor,
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        color: theme.textColor,
        fontSize: 13,
        lineHeight: 22
      },
      code_block: {
        backgroundColor: theme.surfaceColor,
        borderColor: theme.borderColor,
        borderRadius: 12,
        color: theme.textColor,
        padding: 16
      },
      blockquote: {
        backgroundColor: theme.surfaceColor,
        borderColor: theme.tintColor,
        borderLeftWidth: 3,
        paddingHorizontal: 16,
        paddingVertical: 8
      },
      table: { borderColor: theme.borderColor, borderRadius: 8 },
      tr: { borderColor: theme.borderColor },
      th: { padding: 8 },
      td: { padding: 8 },
      hr: { backgroundColor: theme.borderColor, marginVertical: 18 }
    }),
    [theme]
  )
  const user = message.role === 'user'
  return (
    <View style={[styles.message, user && styles.userMessage]}>
      {!user && (
        <View style={styles.messageLabel}>
          <Mark size={16} />
          <AppText muted style={{ fontSize: 12 }}>
            {message.model || 'Assistant'}
          </AppText>
          {message.stopped && <Tag>Stopped</Tag>}
        </View>
      )}
      {!!message.images?.length && (
        <View style={styles.messageImages}>
          {message.images.map((image) => (
            <Pressable
              key={image.id}
              onPress={() => onImage(image)}
              accessibilityRole="button"
              accessibilityLabel="View attached image"
            >
              <MediaImage image={image} style={styles.messageImage} />
            </Pressable>
          ))}
        </View>
      )}
      {!!message.content &&
        (user ? (
          <View style={[styles.userBubble, { backgroundColor: theme.surfaceColor }]}>
            <AppText selectable style={{ fontSize: 16, lineHeight: 26 }}>
              {message.content}
            </AppText>
          </View>
        ) : live ? (
          <Text
            selectable
            style={{ color: theme.textColor, fontFamily: theme.regularFont, fontSize: 16, lineHeight: 27 }}
          >
            {message.content}
            <Text style={{ color: theme.tintColor }}> ▍</Text>
          </Text>
        ) : (
          <Markdown
            style={markdown}
            rules={{ image: () => null }}
            onLinkPress={(url) => {
              if (/^https?:\/\//i.test(url)) void Linking.openURL(url)
              return false
            }}
          >
            {message.content}
          </Markdown>
        ))}
      {live && !message.content && (
        <View accessibilityLiveRegion="polite" style={styles.thinking}>
          <ActivityIndicator size="small" color={theme.tintColor} />
          <AppText muted style={{ fontSize: 13 }}>
            A moment to think…
          </AppText>
        </View>
      )}
      {!!message.error && (
        <View style={{ marginTop: 12 }}>
          <Notice>{message.error}</Notice>
        </View>
      )}
      {!user && !live && (
        <View style={styles.messageActions}>
          {!!message.content && (
            <>
              <IconButton icon="copy-outline" label="Copy response" onPress={() => onCopy(message.content)} />
              <IconButton
                icon="volume-medium-outline"
                label="Read response aloud"
                onPress={() => onSpeak(message.content)}
              />
            </>
          )}
          {last && (
            <Button variant="ghost" icon="refresh-outline" onPress={onRetry}>
              {message.error ? 'Try again' : 'Regenerate'}
            </Button>
          )}
        </View>
      )}
    </View>
  )
})

export function Chat({
  conversation,
  onSave,
  onActivate,
  onBusy,
  onSettings
}: {
  conversation?: Conversation
  onSave: (value: Conversation) => void
  onActivate: (id: string) => void
  onBusy: (busy: boolean) => void
  onSettings: () => void
}) {
  const { theme } = useContext(ThemeContext)
  const { chatType, systemPrompt, apiUrl, token, handlePresentModalPress, notify, connection } =
    useContext(AppContext)
  const { width } = useWindowDimensions()
  const compact = width < 600
  const insets = useSafeAreaInsets()
  const { streaming, send, stop } = useChatStream()
  const [input, setInput] = useState('')
  const [images, setImages] = useState<ImageAttachment[]>([])
  const [live, setLive] = useState<ChatMessage | null>(null)
  const [picking, setPicking] = useState(false)
  const [viewImage, setViewImage] = useState<ImageAttachment | null>(null)
  const [showJump, setShowJump] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [exporting, setExporting] = useState(false)
  const inputRef = useRef<TextInput>(null)
  const listRef = useRef<FlatList<ChatMessage>>(null)
  const atBottom = useRef(true)
  const locked = useRef(false)
  const drafts = useRef<Record<string, { input: string; images: ImageAttachment[] }>>({})
  const currentDraft = useRef('new')
  const messages = useMemo(
    () => [...(conversation?.messages || []), ...(live ? [live] : [])],
    [conversation?.messages, live]
  )
  const hasMessages = messages.length > 0
  const imageCount = (conversation?.messages || []).reduce((count, m) => count + (m.images?.length || 0), 0)

  useEffect(() => {
    const key = conversation?.id || 'new'
    if (currentDraft.current === key) return
    const draft = drafts.current[key]
    setInput(draft?.input || '')
    setImages(draft?.images || [])
    currentDraft.current = key
    atBottom.current = true
    setShowJump(false)
  }, [conversation?.id])

  useEffect(() => {
    drafts.current[currentDraft.current] = { input, images }
  }, [input, images])
  useEffect(
    () => () => {
      void Speech.stop()
    },
    []
  )

  const copy = useCallback(
    async (text: string) => {
      try {
        await Clipboard.setStringAsync(text)
        notify('Copied to clipboard.')
      } catch {
        notify('The text could not be copied. Select it to copy manually.')
      }
    },
    [notify]
  )
  const speak = useCallback(
    (text: string) => {
      void Speech.stop()
      setSpeaking(true)
      Speech.speak(stripMarkdown(text), {
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => {
          setSpeaking(false)
          notify('Speech is not available on this device.')
        }
      })
    },
    [notify]
  )

  async function attach(camera = false) {
    if (picking || streaming) return
    setPicking(true)
    try {
      const selected = await pickImages(4 - images.length - imageCount, camera)
      setImages((current) => [...current, ...selected])
    } catch (error) {
      notify(errorMessage(error))
    } finally {
      setPicking(false)
    }
  }

  const generate = useCallback(
    (history: ChatMessage[]) => {
      if (locked.current) return
      locked.current = true
      onBusy(true)
      atBottom.current = true
      setShowJump(false)
      const now = Date.now()
      const id = conversation?.id || newId()
      const base: Conversation = {
        id,
        title: conversation?.title || conversationTitle(history),
        model: chatType.label,
        messages: history,
        createdAt: conversation?.createdAt || now,
        updatedAt: now
      }
      const assistant: ChatMessage = { id: newId(), role: 'assistant', content: '', model: chatType.name }
      onSave(base)
      onActivate(id)
      setLive(assistant)
      const complete = (content: string, error?: string, stopped?: boolean) => {
        onSave({
          ...base,
          updatedAt: Date.now(),
          messages: [
            ...history,
            { ...assistant, content, ...(error ? { error } : {}), ...(stopped ? { stopped } : {}) }
          ]
        })
        setLive(null)
        locked.current = false
        onBusy(false)
      }
      void send(
        chatType,
        history,
        systemPrompt,
        { url: apiUrl, token },
        {
          onToken: (content) => setLive({ ...assistant, content }),
          onDone: (content, stopped) => complete(content, undefined, stopped),
          onError: (error, content) => complete(content, error)
        }
      )
    },
    [conversation, chatType, systemPrompt, apiUrl, token, send, onSave, onActivate, onBusy]
  )

  function submit() {
    if (locked.current || picking || (!input.trim() && !images.length)) return
    if (!apiUrl) {
      onSettings()
      return
    }
    if (chatType.available === false) {
      handlePresentModalPress()
      return
    }
    if (!chatType.supportsVision && (images.length || imageCount)) {
      notify('Choose a model with vision support for this conversation.')
      handlePresentModalPress()
      return
    }
    const user: ChatMessage = {
      id: newId(),
      role: 'user',
      content: input.trim(),
      ...(images.length ? { images } : {})
    }
    setInput('')
    setImages([])
    drafts.current[currentDraft.current] = { input: '', images: [] }
    if (Platform.OS !== 'web')
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined)
    generate([
      ...(conversation?.messages || []).filter((m) => !m.error && (m.content || m.images?.length)),
      user
    ])
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const retry = useCallback(() => {
    if (!conversation || locked.current) return
    const index = conversation.messages.map((m) => m.role).lastIndexOf('user')
    if (index !== -1) generate(conversation.messages.slice(0, index + 1).filter((m) => !m.error))
  }, [conversation, generate])

  const renderMessage = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => (
      <Message
        message={item}
        theme={theme}
        live={item.id === live?.id}
        last={!streaming && index === messages.length - 1}
        onCopy={copy}
        onSpeak={speak}
        onRetry={retry}
        onImage={setViewImage}
      />
    ),
    [theme, live?.id, streaming, messages.length, copy, speak, retry]
  )

  async function exportConversation() {
    if (!conversation) return
    setExporting(true)
    try {
      const text = transcript(conversation)
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }))
        const link = document.createElement('a')
        link.href = url
        link.download = 'conversation.md'
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      } else await Share.share({ message: text })
    } catch {
      notify('The conversation could not be exported. Try again.')
    } finally {
      setExporting(false)
    }
  }

  const composer = (
    <View style={[styles.composer, { backgroundColor: theme.elevatedColor, borderColor: theme.borderColor }]}>
      {!!images.length && (
        <ScrollView horizontal contentContainerStyle={styles.attachments}>
          {images.map((image) => (
            <View key={image.id} style={{ position: 'relative' }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Preview attached image"
                onPress={() => setViewImage(image)}
              >
                <MediaImage image={image} style={styles.thumbnail} />
              </Pressable>
              <IconButton
                icon="close"
                label="Remove attached image"
                onPress={() => setImages((current) => current.filter((i) => i.id !== image.id))}
                style={{
                  position: 'absolute',
                  right: -5,
                  top: -5,
                  width: 30,
                  height: 30,
                  backgroundColor: theme.elevatedColor,
                  borderRadius: 15
                }}
              />
            </View>
          ))}
        </ScrollView>
      )}
      <TextInput
        ref={inputRef}
        value={input}
        onChangeText={setInput}
        multiline
        maxLength={32000}
        accessibilityLabel="Message"
        placeholder={
          images.length ? 'What would you like to know about these images?' : 'What’s on your mind?'
        }
        placeholderTextColor={theme.placeholderTextColor}
        style={[styles.input, { color: theme.textColor, fontFamily: theme.regularFont }]}
        onKeyPress={(event) => {
          if (Platform.OS !== 'web') return
          const key = event.nativeEvent as unknown as {
            key: string
            shiftKey?: boolean
            isComposing?: boolean
          }
          if (key.key === 'Enter' && !key.shiftKey && !key.isComposing) {
            event.preventDefault()
            submit()
          }
        }}
      />
      <View style={styles.composerToolbar}>
        <View style={styles.toolbarLeft}>
          <IconButton
            icon="add"
            label="Attach images"
            disabled={picking || streaming || images.length + imageCount >= 4}
            onPress={() => void attach()}
          />
          {Platform.OS !== 'web' && (
            <IconButton
              icon="camera-outline"
              label="Take a photo"
              disabled={picking || streaming || images.length + imageCount >= 4}
              onPress={() => void attach(true)}
            />
          )}
          {picking ? (
            <ActivityIndicator size="small" color={theme.tintColor} />
          ) : (
            <AppText muted style={{ fontSize: 11 }}>
              {images.length
                ? `${images.length} image${images.length === 1 ? '' : 's'} attached`
                : 'Text, ideas, or images'}
            </AppText>
          )}
        </View>
        <Pressable
          onPress={streaming ? stop : submit}
          disabled={!streaming && (picking || (!input.trim() && !images.length))}
          accessibilityRole="button"
          accessibilityLabel={streaming ? 'Stop response' : 'Send message'}
          accessibilityState={{ disabled: !streaming && (picking || (!input.trim() && !images.length)) }}
          style={({ pressed }) => [
            styles.send,
            {
              backgroundColor: theme.tintColor,
              opacity: pressed ? 0.7 : !streaming && !input.trim() && !images.length ? 0.35 : 1
            }
          ]}
        >
          <Ionicons name={streaming ? 'stop' : 'arrow-up'} color={theme.tintTextColor} size={21} />
        </Pressable>
      </View>
    </View>
  )

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + (width < 960 ? 58 : 0)}
    >
      <View style={[styles.header, compact && { paddingHorizontal: 16 }]}>
        <Pressable
          disabled={streaming}
          onPress={() => handlePresentModalPress()}
          accessibilityRole="button"
          accessibilityLabel={`Change model. Current model: ${chatType.name}`}
          style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [
            styles.modelButton,
            { backgroundColor: hovered ? theme.surfaceColor : 'transparent' }
          ]}
        >
          <chatType.icon size={18} theme={theme} />
          <AppText style={{ fontFamily: theme.mediumFont, fontSize: 13 }}>{chatType.name}</AppText>
          <Ionicons name="chevron-down" size={14} color={theme.mutedForegroundColor} />
        </Pressable>
        <View style={styles.toolbarLeft}>
          {!compact && <Tag>{streaming ? 'Writing' : 'Your space to think'}</Tag>}
          {hasMessages && (
            <IconButton
              icon="share-outline"
              label="Export conversation"
              onPress={() => void exportConversation()}
              disabled={streaming || exporting}
            />
          )}
        </View>
      </View>
      {!hasMessages ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.emptyScroll, compact && { padding: 20 }]}
        >
          <View style={[styles.empty, compact && { gap: 24 }]}>
            <View style={{ gap: 20 }}>
              <Mark size={40} />
              <View style={{ gap: 14 }}>
                <AppText
                  style={{
                    fontSize: compact ? 34 : 46,
                    lineHeight: compact ? 42 : 56,
                    letterSpacing: -1.8,
                    fontFamily: theme.mediumFont
                  }}
                >
                  A little curiosity.{'\n'}A lot of possibility.
                </AppText>
                <AppText muted style={{ fontSize: compact ? 14 : 16, lineHeight: 25 }}>
                  Think it through. Make it clearer. Start something new.
                </AppText>
              </View>
            </View>
            {composer}
            <View style={styles.suggestions}>
              {PROMPT_SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion.title}
                  accessibilityRole="button"
                  onPress={() => {
                    setInput(suggestion.prompt)
                    inputRef.current?.focus()
                    if (suggestion.attach) void attach()
                  }}
                  style={({ hovered, pressed }: { pressed: boolean; hovered?: boolean }) => [
                    styles.suggestion,
                    {
                      width: compact ? '100%' : '48.7%',
                      borderColor: hovered ? theme.tintColor : theme.borderColor,
                      backgroundColor: hovered || pressed ? theme.surfaceColor : 'transparent'
                    }
                  ]}
                >
                  <Ionicons name={suggestion.icon} size={19} color={theme.tintColor} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <AppText style={{ fontSize: 13, fontFamily: theme.mediumFont }}>
                      {suggestion.title}
                    </AppText>
                    <AppText muted style={{ fontSize: 11 }}>
                      {suggestion.subtitle}
                    </AppText>
                  </View>
                  <Ionicons
                    name="arrow-up-outline"
                    size={15}
                    color={theme.mutedForegroundColor}
                    style={{ transform: [{ rotate: '45deg' }] }}
                  />
                </Pressable>
              ))}
            </View>
            {(connection !== 'connected' || chatType.available === false) && (
              <Notice action="Settings" onAction={onSettings}>
                {!apiUrl
                  ? 'One small step: connect your AI server to get started.'
                  : connection === 'offline'
                    ? 'Your server is offline. Your saved conversations are still here.'
                    : connection === 'checking'
                      ? 'Checking your server connection…'
                      : 'Add a provider key to your server, then refresh models in Settings.'}
              </Notice>
            )}
            <AppText muted style={{ fontSize: 11, textAlign: 'center' }}>
              Your conversations stay on this device. Prompts go to your chosen provider.
            </AppText>
          </View>
        </ScrollView>
      ) : (
        <>
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            initialNumToRender={12}
            maxToRenderPerBatch={8}
            windowSize={7}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.messageList, compact && { paddingHorizontal: 20 }]}
            scrollEventThrottle={100}
            onScroll={(event) => {
              const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
              atBottom.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 80
              setShowJump(!atBottom.current)
            }}
            onContentSizeChange={() => {
              if (atBottom.current) listRef.current?.scrollToEnd({ animated: false })
            }}
          />
          {showJump && (
            <View style={styles.jump}>
              <Button
                variant="secondary"
                icon="arrow-down"
                onPress={() => {
                  atBottom.current = true
                  listRef.current?.scrollToEnd({ animated: true })
                  setShowJump(false)
                }}
              >
                Latest message
              </Button>
            </View>
          )}
          <View style={[styles.bottom, compact && { paddingHorizontal: 16 }]}>
            <View style={styles.bottomInner}>
              {speaking && (
                <Button
                  variant="ghost"
                  icon="stop-circle-outline"
                  onPress={() => {
                    void Speech.stop()
                    setSpeaking(false)
                  }}
                >
                  Stop reading
                </Button>
              )}
              {getContextMessages(conversation?.messages || []).trimmed && (
                <AppText muted style={{ fontSize: 11, paddingBottom: 8 }}>
                  Older messages are saved, but only the recent context is sent to the model.
                </AppText>
              )}
              {composer}
              <AppText muted style={styles.disclaimer}>
                {streaming
                  ? 'You can stop the response at any time.'
                  : `AI can make mistakes. Check important details.${Platform.OS === 'web' && !compact ? '  ·  Shift + Enter for a new line' : ''}`}
              </AppText>
            </View>
          </View>
        </>
      )}
      <Sheet visible={!!viewImage} title="A closer look" onClose={() => setViewImage(null)} wide>
        {viewImage && (
          <View style={{ padding: 20, gap: 16 }}>
            <MediaImage image={viewImage} contain style={{ height: compact ? 320 : 500, borderRadius: 12 }} />
            <Button
              variant="secondary"
              icon="download-outline"
              onPress={() => {
                void saveImage(viewImage)
                  .then(() => notify('Image saved.'))
                  .catch((error) => notify(errorMessage(error)))
              }}
            >
              Save image
            </Button>
          </View>
        )}
      </Sheet>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    minHeight: 76,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  modelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12
  },
  emptyScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 36,
    paddingTop: 30,
    paddingBottom: 48
  },
  empty: { width: '100%', maxWidth: 720, gap: 28 },
  composer: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    ...Platform.select({ web: { boxShadow: '0 3px 16px rgba(35,45,25,0.035)' } })
  },
  input: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 16,
    minHeight: 66,
    maxHeight: 170,
    fontSize: 16,
    lineHeight: 25,
    textAlignVertical: 'top'
  },
  composerToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toolbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  send: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  suggestion: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  attachments: { gap: 12, padding: 10, paddingBottom: 0 },
  thumbnail: { width: 72, height: 72, borderRadius: 12 },
  messageList: {
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 24,
    width: '100%',
    maxWidth: 840,
    alignSelf: 'center'
  },
  message: { marginBottom: 28, width: '100%' },
  userMessage: { alignItems: 'flex-end', marginBottom: 36 },
  userBubble: { borderRadius: 18, paddingHorizontal: 20, paddingVertical: 14, maxWidth: '90%' },
  messageLabel: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 14 },
  messageImages: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  messageImage: { width: 140, height: 140, borderRadius: 14 },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  messageActions: { flexDirection: 'row', alignItems: 'center', marginLeft: -10, marginTop: 4 },
  bottom: { paddingHorizontal: 40, paddingTop: 8, alignItems: 'center' },
  bottomInner: { width: '100%', maxWidth: 760 },
  disclaimer: { textAlign: 'center', fontSize: 10, lineHeight: 17, paddingVertical: 12 },
  jump: { alignSelf: 'center', padding: 8 }
})
