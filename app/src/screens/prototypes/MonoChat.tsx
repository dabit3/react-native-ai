import {
  View,
  Text,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native'
import { useState, useRef } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'

const { width } = Dimensions.get('window')

const MONO_THEME = {
  bg: '#fafafa',
  surface: '#ffffff',
  text: '#0a0a0a',
  textSecondary: '#525252',
  textMuted: '#a3a3a3',
  accent: '#0a0a0a',
  accentSoft: '#f5f5f5',
  border: '#e5e5e5',
  borderSubtle: '#f0f0f0',
  success: '#22c55e',
  font: 'Geist-Regular',
  fontLight: 'Geist-Light',
  fontMedium: 'Geist-Medium',
  fontSemiBold: 'Geist-SemiBold',
  fontBold: 'Geist-Bold',
  fontBlack: 'Geist-Black',
}

const MOCK_CONVERSATIONS = [
  { id: 1, title: 'WebSocket Hook', time: '2m ago', preview: 'Here\'s a clean approach...' },
  { id: 2, title: 'API Architecture', time: '1h ago', preview: 'For a scalable REST API...' },
  { id: 3, title: 'State Management', time: '3h ago', preview: 'Consider using Zustand...' },
]

const MOCK_MESSAGES = [
  {
    user: 'How should I structure a monorepo with shared packages between a React Native app and a Next.js web app?',
    assistant: 'A Turborepo setup with pnpm workspaces works well here. Structure it like this:\n\n```\npackages/\n  ui/          → shared components\n  config/      → shared tsconfig, eslint\n  utils/       → shared utilities\napps/\n  mobile/      → React Native (Expo)\n  web/         → Next.js\n```\n\nKey decisions:\n\n1. Use `packages/ui` for truly cross-platform components (Text, Button, Layout primitives)\n2. Keep platform-specific code in each app\n3. Share business logic via `packages/utils`\n4. Use path aliases so imports read clean:\n   `import { Button } from \'@repo/ui\'`\n\nThe shared UI package should export React Native components that are aliased to web equivalents via `react-native-web` in the Next.js app.',
  },
  {
    user: 'What about shared types and API clients?',
  },
]

export function MonoChat() {
  const [input, setInput] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [selectedModel, setSelectedModel] = useState('Claude Sonnet 5')
  const [showModelPicker, setShowModelPicker] = useState(false)
  const scrollViewRef = useRef<ScrollView | null>(null)

  const models = ['Claude Sonnet 5', 'GPT 5.2', 'Gemini', 'Claude Fable 5']

  return (
    <View style={styles.container}>
      {/* Sidebar overlay */}
      {showSidebar && (
        <TouchableOpacity
          style={styles.sidebarOverlay}
          activeOpacity={1}
          onPress={() => setShowSidebar(false)}
        >
          <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Conversations</Text>
              <TouchableOpacity onPress={() => setShowSidebar(false)}>
                <Ionicons name="close" size={20} color={MONO_THEME.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.newChatButton}>
              <Ionicons name="add" size={18} color={MONO_THEME.text} />
              <Text style={styles.newChatText}>New conversation</Text>
            </TouchableOpacity>
            {MOCK_CONVERSATIONS.map((conv) => (
              <TouchableOpacity key={conv.id} style={styles.conversationItem}>
                <Text style={styles.conversationTitle}>{conv.title}</Text>
                <Text style={styles.conversationPreview}>{conv.preview}</Text>
                <Text style={styles.conversationTime}>{conv.time}</Text>
              </TouchableOpacity>
            ))}
          </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={0}
      >
        {/* Minimal header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowSidebar(true)}
          >
            <Ionicons name="menu-outline" size={22} color={MONO_THEME.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modelSelector}
            onPress={() => setShowModelPicker(!showModelPicker)}
          >
            <Text style={styles.modelSelectorText}>{selectedModel}</Text>
            <Ionicons
              name={showModelPicker ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={MONO_THEME.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="create-outline" size={20} color={MONO_THEME.text} />
          </TouchableOpacity>
        </View>

        {/* Inline model picker */}
        {showModelPicker && (
          <View style={styles.modelPickerContainer}>
            {models.map((model) => (
              <TouchableOpacity
                key={model}
                style={[
                  styles.modelPickerItem,
                  selectedModel === model && styles.modelPickerItemActive
                ]}
                onPress={() => {
                  setSelectedModel(model)
                  setShowModelPicker(false)
                }}
              >
                <Text style={[
                  styles.modelPickerText,
                  selectedModel === model && styles.modelPickerTextActive
                ]}>
                  {model}
                </Text>
                {selectedModel === model && (
                  <Ionicons name="checkmark" size={16} color={MONO_THEME.text} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Messages - editorial style */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {MOCK_MESSAGES.map((msg, index) => (
            <View key={index} style={styles.messageBlock}>
              {/* User query - displayed as bold heading */}
              <View style={styles.userBlock}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>N</Text>
                </View>
                <Text style={styles.userText}>{msg.user}</Text>
              </View>

              {/* Assistant response - clean typography */}
              {msg.assistant && (
                <View style={styles.assistantBlock}>
                  <View style={styles.assistantHeader}>
                    <View style={styles.assistantAvatar}>
                      <Ionicons name="sparkles" size={12} color="#fff" />
                    </View>
                    <Text style={styles.assistantLabel}>{selectedModel}</Text>
                  </View>
                  <Text style={styles.assistantText}>{msg.assistant}</Text>
                  <View style={styles.assistantFooter}>
                    <TouchableOpacity style={styles.footerAction}>
                      <Ionicons name="copy-outline" size={15} color={MONO_THEME.textMuted} />
                      <Text style={styles.footerActionText}>Copy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.footerAction}>
                      <Ionicons name="refresh-outline" size={15} color={MONO_THEME.textMuted} />
                      <Text style={styles.footerActionText}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.footerAction}>
                      <Ionicons name="share-outline" size={15} color={MONO_THEME.textMuted} />
                      <Text style={styles.footerActionText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Thinking indicator */}
              {!msg.assistant && index === MOCK_MESSAGES.length - 1 && (
                <View style={styles.assistantBlock}>
                  <View style={styles.assistantHeader}>
                    <View style={styles.assistantAvatar}>
                      <Ionicons name="sparkles" size={12} color="#fff" />
                    </View>
                    <Text style={styles.thinkingText}>Thinking...</Text>
                  </View>
                  <View style={styles.thinkingBar}>
                    <View style={styles.thinkingProgress} />
                  </View>
                </View>
              )}

              {/* Divider between message groups */}
              {index < MOCK_MESSAGES.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))}
        </ScrollView>

        {/* Input - clean floating bar */}
        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Message..."
              placeholderTextColor={MONO_THEME.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
            />
            <View style={styles.inputActions}>
              <TouchableOpacity style={styles.inputAction}>
                <Ionicons name="attach-outline" size={20} color={MONO_THEME.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  input.length > 0 && styles.sendBtnActive
                ]}
              >
                <Ionicons
                  name="arrow-up"
                  size={16}
                  color={input.length > 0 ? '#fff' : MONO_THEME.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MONO_THEME.bg,
  },
  keyboardAvoid: {
    flex: 1,
  },
  // Sidebar
  sidebarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 100,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.78,
    backgroundColor: MONO_THEME.surface,
    paddingTop: 60,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sidebarTitle: {
    fontFamily: MONO_THEME.fontBold,
    fontSize: 20,
    color: MONO_THEME.text,
    letterSpacing: -0.5,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: MONO_THEME.accentSoft,
    marginBottom: 20,
    gap: 8,
  },
  newChatText: {
    fontFamily: MONO_THEME.fontMedium,
    fontSize: 14,
    color: MONO_THEME.text,
  },
  conversationItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: MONO_THEME.borderSubtle,
  },
  conversationTitle: {
    fontFamily: MONO_THEME.fontSemiBold,
    fontSize: 14,
    color: MONO_THEME.text,
    marginBottom: 3,
  },
  conversationPreview: {
    fontFamily: MONO_THEME.font,
    fontSize: 13,
    color: MONO_THEME.textSecondary,
    marginBottom: 4,
  },
  conversationTime: {
    fontFamily: MONO_THEME.font,
    fontSize: 11,
    color: MONO_THEME.textMuted,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: MONO_THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: MONO_THEME.borderSubtle,
  },
  menuButton: {
    padding: 8,
  },
  modelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: MONO_THEME.accentSoft,
    gap: 4,
  },
  modelSelectorText: {
    fontFamily: MONO_THEME.fontSemiBold,
    fontSize: 14,
    color: MONO_THEME.text,
  },
  // Model picker
  modelPickerContainer: {
    backgroundColor: MONO_THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: MONO_THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modelPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modelPickerItemActive: {
    backgroundColor: MONO_THEME.accentSoft,
  },
  modelPickerText: {
    fontFamily: MONO_THEME.fontMedium,
    fontSize: 14,
    color: MONO_THEME.textSecondary,
  },
  modelPickerTextActive: {
    color: MONO_THEME.text,
    fontFamily: MONO_THEME.fontSemiBold,
  },
  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  messageBlock: {
    marginBottom: 8,
  },
  userBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: MONO_THEME.text,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  userAvatarText: {
    fontFamily: MONO_THEME.fontBold,
    fontSize: 12,
    color: '#fff',
  },
  userText: {
    flex: 1,
    fontFamily: MONO_THEME.fontSemiBold,
    fontSize: 16,
    color: MONO_THEME.text,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  assistantBlock: {
    marginBottom: 16,
    paddingLeft: 40,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  assistantAvatar: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: MONO_THEME.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assistantLabel: {
    fontFamily: MONO_THEME.fontMedium,
    fontSize: 12,
    color: MONO_THEME.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  assistantText: {
    fontFamily: MONO_THEME.font,
    fontSize: 15,
    color: MONO_THEME.text,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  assistantFooter: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 4,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  footerActionText: {
    fontFamily: MONO_THEME.fontMedium,
    fontSize: 12,
    color: MONO_THEME.textMuted,
  },
  thinkingText: {
    fontFamily: MONO_THEME.fontMedium,
    fontSize: 13,
    color: MONO_THEME.textMuted,
  },
  thinkingBar: {
    height: 3,
    backgroundColor: MONO_THEME.borderSubtle,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  thinkingProgress: {
    width: '40%',
    height: '100%',
    backgroundColor: MONO_THEME.text,
    borderRadius: 2,
  },
  divider: {
    height: 1,
    backgroundColor: MONO_THEME.borderSubtle,
    marginVertical: 24,
  },
  // Input
  inputArea: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
    backgroundColor: MONO_THEME.bg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: MONO_THEME.surface,
    borderWidth: 1,
    borderColor: MONO_THEME.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontFamily: MONO_THEME.font,
    fontSize: 15,
    color: MONO_THEME.text,
    paddingVertical: 4,
    maxHeight: 100,
    lineHeight: 22,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  inputAction: {
    padding: 4,
  },
  sendBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: MONO_THEME.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnActive: {
    backgroundColor: MONO_THEME.text,
  },
})
