import {
  View,
  Text,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Keyboard,
  Share,
  Platform,
  Image
} from 'react-native'
import 'react-native-get-random-values'
import { useContext, useState, useRef, useEffect, useCallback, memo } from 'react'
import { ThemeContext, AppContext } from '../context'
import { useChatStream } from '../hooks/useChatStream'
import { PROMPT_SUGGESTIONS } from '../../constants'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import * as Speech from 'expo-speech'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useActionSheet } from '@expo/react-native-action-sheet'
import Markdown from '@ronradtke/react-native-markdown-display'
import { ChatMessage, ImageAttachment, Theme } from '../../types'

const STORAGE_KEY = 'rnai-chats-v1'

type ChatStates = Record<string, ChatMessage[]>

function stripMarkdown(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/[*_~`#>]/g, '')
}

const MessageBubble = memo(function MessageBubble({
  item,
  theme,
  streaming,
  isLast,
  onOptions,
  onRetry
}: {
  item: ChatMessage,
  theme: Theme,
  streaming: boolean,
  isLast: boolean,
  onOptions: (message: ChatMessage) => void,
  onRetry: () => void
}) {
  const styles = getStyles(theme)
  if (item.role === 'user') {
    return (
      <View style={styles.promptResponse}>
        <View style={styles.promptTextContainer}>
          <View style={styles.promptTextWrapper}>
            {
              item.image && (
                <Image
                  source={{ uri: item.image.uri }}
                  style={styles.promptImage}
                  accessibilityLabel="Attached image"
                />
              )
            }
            {
              !!item.content && (
                <Text style={styles.promptText}>
                  {item.content}
                </Text>
              )
            }
          </View>
        </View>
      </View>
    )
  }
  if (item.error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{item.error}</Text>
        <TouchableOpacity
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
          style={styles.retryButton}
        >
          <Ionicons name="refresh" size={16} color={theme.tintTextColor} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }
  return (
    <View style={styles.textStyleContainer}>
      {
        streaming && isLast && !item.content ? (
          <ActivityIndicator
            style={styles.typingIndicator}
            color={theme.textColor}
          />
        ) : (
          <Markdown style={styles.markdownStyle as any}>{item.content}</Markdown>
        )
      }
      {
        !(streaming && isLast) && !!item.content && (
          <TouchableHighlight
            onPress={() => onOptions(item)}
            underlayColor={'transparent'}
            accessibilityRole="button"
            accessibilityLabel="Message options"
          >
            <View style={styles.optionsIconWrapper}>
              <Ionicons
                name="ellipsis-horizontal"
                size={20}
                color={theme.textColor}
              />
            </View>
          </TouchableHighlight>
        )
      }
    </View>
  )
})

export function Chat() {
  const [input, setInput] = useState<string>('')
  const [attachment, setAttachment] = useState<ImageAttachment | null>(null)
  const [chatStates, setChatStates] = useState<ChatStates>({})
  const [hydrated, setHydrated] = useState(false)
  const flatListRef = useRef<FlatList | null>(null)
  const autoScrollRef = useRef(true)
  const { showActionSheetWithOptions } = useActionSheet()
  const { streaming, send, stop } = useChatStream()

  const { theme } = useContext(ThemeContext)
  const { chatType, systemPrompt } = useContext(AppContext)
  const styles = getStyles(theme)

  const messages = chatStates[chatType.label] || []

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(value => {
        if (value) setChatStates(JSON.parse(value))
      })
      .catch(err => console.log('error restoring chats', err))
      .finally(() => setHydrated(true))
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const timer = setTimeout(() => {
      const sanitized: ChatStates = {}
      for (const [label, msgs] of Object.entries(chatStates)) {
        sanitized[label] = msgs
          .filter(m => !m.error)
          .map(m => m.image ? { ...m, image: { ...m.image, base64: undefined } } : m)
      }
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized))
        .catch(err => console.log('error persisting chats', err))
    }, 400)
    return () => clearTimeout(timer)
  }, [chatStates, hydrated])

  const updateMessages = useCallback((modelLabel: string, updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setChatStates(prev => ({
      ...prev,
      [modelLabel]: updater(prev[modelLabel] || [])
    }))
  }, [])

  function streamResponse(modelLabel: string, history: ChatMessage[]) {
    autoScrollRef.current = true
    updateMessages(modelLabel, () => [
      ...history,
      { role: 'assistant', content: '', model: modelLabel }
    ])
    send(chatType, history, systemPrompt, {
      onToken: response => {
        updateMessages(modelLabel, prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: response, model: modelLabel }
        ])
      },
      onDone: response => {
        updateMessages(modelLabel, prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: response, model: modelLabel }
        ])
      },
      onError: message => {
        updateMessages(modelLabel, prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: '', error: message, model: modelLabel }
        ])
      }
    })
  }

  function chat(text?: string) {
    const value = (text ?? input).trim()
    if (!value && !attachment) return
    if (streaming) return
    Keyboard.dismiss()
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null)

    const userMessage: ChatMessage = {
      role: 'user',
      content: value,
      ...(attachment ? { image: attachment } : {})
    }
    const history = [...messages.filter(m => !m.error), userMessage]
    setInput('')
    setAttachment(null)
    streamResponse(chatType.label, history)
  }

  function retryLast() {
    if (streaming) return
    const history = messages.filter(m => !m.error)
    const lastUserIndex = history.map(m => m.role).lastIndexOf('user')
    if (lastUserIndex === -1) return
    streamResponse(chatType.label, history.slice(0, lastUserIndex + 1))
  }

  function regenerate() {
    retryLast()
  }

  async function attachImage() {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true
      })
      if (res.canceled || !res.assets?.length) return
      const asset = res.assets[0]
      setAttachment({
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        base64: asset.base64 || undefined
      })
    } catch (err) {
      console.log('error picking image:', err)
    }
  }

  async function copyToClipboard(text: string) {
    await Clipboard.setStringAsync(text)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null)
  }

  async function shareConversation() {
    const transcript = messages
      .filter(m => !m.error)
      .map(m => `**${m.role === 'user' ? 'You' : chatType.name}**: ${m.content}`)
      .join('\n\n')
    try {
      await Share.share({ message: transcript })
    } catch {}
  }

  function clearChat() {
    if (streaming) return
    Speech.stop()
    updateMessages(chatType.label, () => [])
  }

  function showMessageOptions(message: ChatMessage) {
    const options = [
      'Copy to clipboard',
      'Speak aloud',
      'Regenerate response',
      'Share conversation',
      'Clear chat',
      'Cancel'
    ]
    showActionSheetWithOptions({
      options,
      cancelButtonIndex: options.length - 1,
      destructiveButtonIndex: 4
    }, index => {
      switch (index) {
        case 0: copyToClipboard(message.content); break
        case 1: Speech.speak(stripMarkdown(message.content)); break
        case 2: regenerate(); break
        case 3: shareConversation(); break
        case 4: clearChat(); break
      }
    })
  }

  const callMade = messages.length > 0

  function renderItem({ item, index }: { item: ChatMessage, index: number }) {
    return (
      <MessageBubble
        item={item}
        theme={theme}
        streaming={streaming}
        isLast={index === messages.length - 1}
        onOptions={showMessageOptions}
        onRetry={retryLast}
      />
    )
  }

  function renderAttachmentPreview() {
    if (!attachment) return null
    return (
      <View style={styles.attachmentPreview}>
        <Image source={{ uri: attachment.uri }} style={styles.attachmentThumbnail} />
        <Text style={styles.attachmentText} numberOfLines={1}>Image attached</Text>
        <TouchableOpacity
          onPress={() => setAttachment(null)}
          accessibilityRole="button"
          accessibilityLabel="Remove attached image"
          style={styles.attachmentRemove}
        >
          <Ionicons name="close-circle" size={20} color={theme.textColor} />
        </TouchableOpacity>
      </View>
    )
  }

  function renderInputRow(midScreen: boolean) {
    return (
      <View style={midScreen ? undefined : styles.chatInputContainer}>
        {
          chatType.supportsVision && !midScreen && (
            <TouchableOpacity
              onPress={attachImage}
              accessibilityRole="button"
              accessibilityLabel="Attach an image"
              style={styles.attachIconButton}
            >
              <Ionicons name="image-outline" size={18} color={theme.textColor} />
            </TouchableOpacity>
          )
        }
        <TextInput
          style={midScreen ? styles.midInput : styles.input}
          onChangeText={setInput}
          placeholder='Message'
          multiline
          placeholderTextColor={theme.placeholderTextColor}
          autoCorrect={true}
          value={input}
          accessibilityLabel="Message input"
        />
        {
          !midScreen && (
            streaming ? (
              <TouchableOpacity
                onPress={stop}
                accessibilityRole="button"
                accessibilityLabel="Stop generating"
              >
                <View style={styles.chatButton}>
                  <Ionicons
                    name="stop"
                    size={20} color={theme.tintTextColor}
                  />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => chat()}
                accessibilityRole="button"
                accessibilityLabel="Send message"
              >
                <View style={styles.chatButton}>
                  <Ionicons
                    name="arrow-up-outline"
                    size={20} color={theme.tintTextColor}
                  />
                </View>
              </TouchableOpacity>
            )
          )
        }
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={110}
    >
      {
        !callMade ? (
          <View style={styles.midChatInputWrapper}>
            <View style={styles.midChatInputContainer}>
              {renderInputRow(true)}
              <TouchableHighlight
                onPress={() => chat()}
                underlayColor={'transparent'}
                accessibilityRole="button"
                accessibilityLabel="Start chat"
              >
                <View style={styles.midButtonStyle}>
                  <Ionicons
                    name="chatbox-ellipses-outline"
                    size={22} color={theme.tintTextColor}
                  />
                  <Text style={styles.midButtonText}>
                    Start chat
                  </Text>
                </View>
              </TouchableHighlight>
              {renderAttachmentPreview()}
              {
                chatType.supportsVision && !attachment && (
                  <TouchableOpacity
                    onPress={attachImage}
                    accessibilityRole="button"
                    accessibilityLabel="Attach an image"
                    style={styles.midAttachButton}
                  >
                    <Ionicons name="image-outline" size={16} color={theme.textColor} />
                    <Text style={styles.midAttachButtonText}>Attach an image</Text>
                  </TouchableOpacity>
                )
              }
              <Text style={styles.chatDescription}>
                Chat with a variety of different language models.
              </Text>
              <View style={styles.suggestionsContainer}>
                {
                  PROMPT_SUGGESTIONS.map(suggestion => (
                    <TouchableOpacity
                      key={suggestion}
                      onPress={() => chat(suggestion)}
                      accessibilityRole="button"
                      style={styles.suggestionChip}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))
                }
              </View>
            </View>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(_, index) => `${chatType.label}-${index}`}
              keyboardShouldPersistTaps='handled'
              contentContainerStyle={styles.listContent}
              onScrollBeginDrag={() => { autoScrollRef.current = false }}
              onScroll={event => {
                const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
                const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y
                if (distanceFromBottom < 40) autoScrollRef.current = true
              }}
              scrollEventThrottle={100}
              onContentSizeChange={() => {
                if (autoScrollRef.current) {
                  flatListRef.current?.scrollToEnd({ animated: true })
                }
              }}
            />
            {renderAttachmentPreview()}
            {renderInputRow(false)}
          </>
        )
      }
    </KeyboardAvoidingView>
  )
}

const getStyles = (theme: Theme) => StyleSheet.create({
  optionsIconWrapper: {
    padding: 10,
    paddingTop: 9,
    alignItems: 'flex-end'
  },
  listContent: {
    paddingBottom: 10
  },
  typingIndicator: {
    marginVertical: 10,
    alignSelf: 'flex-start',
    marginLeft: 5
  },
  errorContainer: {
    marginHorizontal: 10,
    marginTop: 10,
    padding: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  errorText: {
    color: theme.textColor,
    fontFamily: theme.regularFont,
    marginBottom: 10
  },
  retryButton: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: theme.tintColor,
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 14
  },
  retryButtonText: {
    color: theme.tintTextColor,
    fontFamily: theme.mediumFont,
    marginLeft: 6
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 18,
    paddingHorizontal: 14,
    gap: 8
  },
  suggestionChip: {
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 99,
    paddingVertical: 8,
    paddingHorizontal: 14
  },
  suggestionText: {
    color: theme.textColor,
    fontFamily: theme.regularFont,
    fontSize: 13
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 10
  },
  attachmentThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 10
  },
  attachmentText: {
    flex: 1,
    color: theme.textColor,
    fontFamily: theme.regularFont,
    fontSize: 13
  },
  attachmentRemove: {
    padding: 6
  },
  attachIconButton: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: theme.borderColor
  },
  midAttachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 99,
    paddingVertical: 7,
    paddingHorizontal: 14
  },
  midAttachButtonText: {
    color: theme.textColor,
    fontFamily: theme.mediumFont,
    fontSize: 13,
    marginLeft: 7
  },
  chatDescription: {
    color: theme.textColor,
    textAlign: 'center',
    marginTop: 15,
    fontSize: 13,
    paddingHorizontal: 34,
    opacity: .8,
    fontFamily: theme.regularFont
  },
  midInput: {
    marginBottom: 8,
    borderWidth: 1,
    paddingHorizontal: 25,
    marginHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 24,
    color: theme.textColor,
    borderColor: theme.borderColor,
    fontFamily: theme.mediumFont,
  },
  midButtonStyle: {
    flexDirection: 'row',
    marginHorizontal: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 99,
    backgroundColor: theme.tintColor,
    justifyContent: 'center',
    alignItems: 'center'
  },
  midButtonText: {
    color: theme.tintTextColor,
    marginLeft: 10,
    fontFamily: theme.boldFont,
    fontSize: 16
  },
  midChatInputWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  midChatInputContainer: {
    width: '100%',
    paddingTop: 5,
    paddingBottom: 5
  },
  promptResponse: {
    marginTop: 10,
  },
  textStyleContainer: {
    borderWidth: 1,
    marginRight: 25,
    borderColor: theme.borderColor,
    padding: 15,
    paddingBottom: 6,
    paddingTop: 5,
    margin: 10,
    borderRadius: 13
  },
  promptTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 15,
    marginLeft: 24,
  },
  promptTextWrapper: {
    borderRadius: 8,
    borderTopRightRadius: 0,
    backgroundColor: theme.tintColor,
    overflow: 'hidden'
  },
  promptImage: {
    width: 180,
    height: 180,
    borderRadius: 4,
    margin: 5
  },
  promptText: {
    color: theme.tintTextColor,
    fontFamily: theme.regularFont,
    paddingVertical: 5,
    paddingHorizontal: 9,
    fontSize: 16
  },
  chatButton: {
    marginRight: 14,
    padding: 5,
    borderRadius: 99,
    backgroundColor: theme.tintColor
  },
  chatInputContainer: {
    paddingTop: 5,
    borderColor: theme.borderColor,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 5
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    color: theme.textColor,
    marginHorizontal: 10,
    paddingVertical: 10,
    paddingHorizontal: 21,
    paddingRight: 39,
    maxHeight: 110,
    borderColor: theme.borderColor,
    fontFamily: theme.semiBoldFont,
  },
  container: {
    backgroundColor: theme.backgroundColor,
    flex: 1
  },
  markdownStyle: {
    body: {
      color: theme.textColor,
      fontFamily: theme.regularFont
    },
    paragraph: {
      color: theme.textColor,
      fontSize: 16,
      fontFamily: theme.regularFont
    },
    heading1: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      marginVertical: 5
    },
    heading2: {
      marginTop: 20,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      marginBottom: 5
    },
    heading3: {
      marginTop: 20,
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      marginBottom: 5
    },
    heading4: {
      marginTop: 10,
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      marginBottom: 5
    },
    heading5: {
      marginTop: 10,
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      marginBottom: 5
    },
    heading6: {
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      marginVertical: 5
    },
    list_item: {
      marginTop: 7,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: 16,
    },
    ordered_list_icon: {
      color: theme.textColor,
      fontSize: 16,
      fontFamily: theme.regularFont
    },
    bullet_list: {
      marginTop: 10
    },
    ordered_list: {
      marginTop: 7
    },
    bullet_list_icon: {
      color: theme.textColor,
      fontSize: 16,
      fontFamily: theme.regularFont
    },
    code_inline: {
      color: theme.secondaryTextColor,
      backgroundColor: theme.secondaryBackgroundColor,
      borderWidth: 1,
      borderColor: theme.codeBorderColor,
      fontFamily: theme.lightFont
    },
    hr: {
      backgroundColor: theme.codeBorderColor,
      height: 1,
    },
    fence: {
      marginVertical: 5,
      padding: 10,
      color: theme.secondaryTextColor,
      backgroundColor: theme.secondaryBackgroundColor,
      borderColor: theme.codeBorderColor,
      fontFamily: theme.regularFont
    },
    tr: {
      borderBottomWidth: 1,
      borderColor: theme.borderColor,
      flexDirection: 'row',
    },
    table: {
      marginTop: 7,
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 3,
    },
    blockquote: {
      backgroundColor: theme.quoteBackgroundColor,
      borderColor: theme.tintColor,
      borderLeftWidth: 4,
      marginLeft: 5,
      paddingHorizontal: 5,
      marginVertical: 5,
    },
  } as any,
})
