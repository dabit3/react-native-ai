import {
  View,
  Text,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native'
import { useState, useRef } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'

const AURORA_THEME = {
  gradientStart: '#0f0c29',
  gradientMid: '#1a1040',
  gradientEnd: '#24243e',
  cardBg: 'rgba(255, 255, 255, 0.06)',
  cardBorder: 'rgba(255, 255, 255, 0.12)',
  glowPrimary: '#7c3aed',
  glowSecondary: '#06b6d4',
  glowTertiary: '#ec4899',
  textPrimary: '#f8fafc',
  textSecondary: 'rgba(248, 250, 252, 0.7)',
  textMuted: 'rgba(248, 250, 252, 0.4)',
  inputBg: 'rgba(255, 255, 255, 0.08)',
  inputBorder: 'rgba(255, 255, 255, 0.15)',
  accentGradient: ['#7c3aed', '#06b6d4'],
  userBubbleGradient: ['#7c3aed', '#6366f1'],
  font: 'Geist-Regular',
  fontMedium: 'Geist-Medium',
  fontSemiBold: 'Geist-SemiBold',
  fontBold: 'Geist-Bold',
}

const MOCK_MODELS = [
  { label: 'Claude Sonnet 5', icon: 'sparkles-outline', active: true },
  { label: 'GPT 5.2', icon: 'flash-outline', active: false },
  { label: 'Gemini', icon: 'diamond-outline', active: false },
  { label: 'Kimi K2.7', icon: 'planet-outline', active: false },
]

const MOCK_MESSAGES = [
  { user: 'How can I implement a custom hook for managing WebSocket connections in React?', assistant: 'Here\'s a clean approach to a WebSocket custom hook:\n\n```typescript\nfunction useWebSocket(url: string) {\n  const [messages, setMessages] = useState([]);\n  const wsRef = useRef<WebSocket | null>(null);\n\n  useEffect(() => {\n    wsRef.current = new WebSocket(url);\n    wsRef.current.onmessage = (event) => {\n      setMessages(prev => [...prev, JSON.parse(event.data)]);\n    };\n    return () => wsRef.current?.close();\n  }, [url]);\n\n  const send = useCallback((data) => {\n    wsRef.current?.send(JSON.stringify(data));\n  }, []);\n\n  return { messages, send };\n}\n```\n\nThis handles connection lifecycle, automatic cleanup, and provides a stable `send` function.' },
  { user: 'Can you add reconnection logic with exponential backoff?' },
]

export function AuroraChat() {
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState(0)
  const scrollViewRef = useRef<ScrollView | null>(null)

  return (
    <View style={styles.container}>
      <View style={styles.backgroundGradient}>
        <View style={styles.gradientLayer1} />
        <View style={styles.gradientLayer2} />
        <View style={styles.gradientLayer3} />
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={100}
      >
        {/* Header with model chips */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Aurora</Text>
            <TouchableOpacity style={styles.headerAction}>
              <Ionicons name="settings-outline" size={20} color={AURORA_THEME.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modelChipsContainer}
          >
            {MOCK_MODELS.map((model, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedModel(index)}
                style={[
                  styles.modelChip,
                  selectedModel === index && styles.modelChipActive
                ]}
              >
                <Ionicons
                  name={model.icon as any}
                  size={14}
                  color={selectedModel === index ? AURORA_THEME.textPrimary : AURORA_THEME.textMuted}
                />
                <Text style={[
                  styles.modelChipText,
                  selectedModel === index && styles.modelChipTextActive
                ]}>
                  {model.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {MOCK_MESSAGES.map((msg, index) => (
            <View key={index} style={styles.messageGroup}>
              {/* User message */}
              <View style={styles.userMessageContainer}>
                <View style={styles.userBubble}>
                  <Text style={styles.userMessageText}>{msg.user}</Text>
                </View>
              </View>

              {/* Assistant message */}
              {msg.assistant && (
                <View style={styles.assistantMessageContainer}>
                  <View style={styles.assistantGlowIndicator} />
                  <View style={styles.assistantBubble}>
                    <Text style={styles.assistantMessageText}>{msg.assistant}</Text>
                    <View style={styles.assistantActions}>
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="copy-outline" size={14} color={AURORA_THEME.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="refresh-outline" size={14} color={AURORA_THEME.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Loading indicator for last message without response */}
              {!msg.assistant && index === MOCK_MESSAGES.length - 1 && (
                <View style={styles.assistantMessageContainer}>
                  <View style={styles.assistantGlowIndicator} />
                  <View style={styles.loadingBubble}>
                    <View style={styles.typingDots}>
                      <View style={[styles.dot, styles.dot1]} />
                      <View style={[styles.dot, styles.dot2]} />
                      <View style={[styles.dot, styles.dot3]} />
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Input area */}
        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle-outline" size={22} color={AURORA_THEME.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Ask anything..."
              placeholderTextColor={AURORA_THEME.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity style={styles.sendButton}>
              <View style={styles.sendButtonInner}>
                <Ionicons name="arrow-up" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.inputHint}>
            {MOCK_MODELS[selectedModel].label} may produce inaccurate information
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AURORA_THEME.gradientStart,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AURORA_THEME.gradientStart,
  },
  gradientLayer2: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: AURORA_THEME.glowPrimary,
    opacity: 0.08,
  },
  gradientLayer3: {
    position: 'absolute',
    bottom: -50,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: AURORA_THEME.glowSecondary,
    opacity: 0.06,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  headerTitle: {
    fontFamily: AURORA_THEME.fontBold,
    fontSize: 22,
    color: AURORA_THEME.textPrimary,
    letterSpacing: -0.5,
  },
  headerAction: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: AURORA_THEME.cardBg,
    borderWidth: 1,
    borderColor: AURORA_THEME.cardBorder,
  },
  modelChipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  modelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  modelChipActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
    borderColor: 'rgba(124, 58, 237, 0.5)',
  },
  modelChipText: {
    fontFamily: AURORA_THEME.fontMedium,
    fontSize: 13,
    color: AURORA_THEME.textMuted,
  },
  modelChipTextActive: {
    color: AURORA_THEME.textPrimary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageGroup: {
    marginBottom: 24,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userBubble: {
    maxWidth: '80%',
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
    borderRadius: 20,
    borderBottomRightRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  userMessageText: {
    fontFamily: AURORA_THEME.font,
    fontSize: 15,
    color: AURORA_THEME.textPrimary,
    lineHeight: 22,
  },
  assistantMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assistantGlowIndicator: {
    width: 3,
    height: 24,
    borderRadius: 2,
    backgroundColor: AURORA_THEME.glowSecondary,
    marginRight: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  assistantBubble: {
    flex: 1,
    backgroundColor: AURORA_THEME.cardBg,
    borderWidth: 1,
    borderColor: AURORA_THEME.cardBorder,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  assistantMessageText: {
    fontFamily: AURORA_THEME.font,
    fontSize: 15,
    color: AURORA_THEME.textPrimary,
    lineHeight: 23,
    opacity: 0.95,
  },
  assistantActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  loadingBubble: {
    flex: 1,
    backgroundColor: AURORA_THEME.cardBg,
    borderWidth: 1,
    borderColor: AURORA_THEME.cardBorder,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AURORA_THEME.glowSecondary,
  },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.9 },
  inputArea: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: AURORA_THEME.inputBg,
    borderWidth: 1,
    borderColor: AURORA_THEME.inputBorder,
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  attachButton: {
    padding: 8,
    marginBottom: 2,
  },
  textInput: {
    flex: 1,
    fontFamily: AURORA_THEME.font,
    fontSize: 15,
    color: AURORA_THEME.textPrimary,
    paddingVertical: 8,
    paddingHorizontal: 4,
    maxHeight: 100,
  },
  sendButton: {
    marginBottom: 2,
  },
  sendButtonInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AURORA_THEME.glowPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputHint: {
    fontFamily: AURORA_THEME.font,
    fontSize: 11,
    color: AURORA_THEME.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
})
