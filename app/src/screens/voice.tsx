import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native'
import { useContext, useState, useRef, useEffect } from 'react'
import { ThemeContext, AppContext } from '../context'
import { getEventSource, getFirstNCharsOrLess, getChatType } from '../utils'
import { DOMAIN } from '../../constants'
import { Audio } from 'expo-av'
import * as Speech from 'expo-speech'
import Ionicons from '@expo/vector-icons/Ionicons'
import Markdown from '@ronradtke/react-native-markdown-display'

type VoiceMessage = {
  user: string
  assistant?: string
}

type VoiceState = 'idle' | 'recording' | 'transcribing' | 'responding'

export function VoiceChat() {
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [currentTranscription, setCurrentTranscription] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [apiMessages, setApiMessages] = useState('')
  const recordingRef = useRef<Audio.Recording | null>(null)
  const scrollViewRef = useRef<ScrollView | null>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current

  const { theme } = useContext(ThemeContext)
  const { chatType } = useContext(AppContext)
  const styles = getStyles(theme)

  useEffect(() => {
    if (voiceState === 'recording') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      )
      pulse.start()
      return () => pulse.stop()
    } else {
      pulseAnim.setValue(1)
    }
  }, [voiceState])

  async function startRecording() {
    try {
      const { granted } = await Audio.requestPermissionsAsync()
      if (!granted) return

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      recordingRef.current = recording
      setVoiceState('recording')
    } catch (err) {
      console.log('Failed to start recording:', err)
    }
  }

  async function stopRecording() {
    if (!recordingRef.current) return

    setVoiceState('transcribing')
    try {
      await recordingRef.current.stopAndUnloadAsync()
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      })

      const uri = recordingRef.current.getURI()
      recordingRef.current = null

      if (!uri) {
        setVoiceState('idle')
        return
      }

      const formData = new FormData()
      formData.append('audio', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any)

      const response = await fetch(`${DOMAIN}/chat/transcribe`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const data = await response.json()

      if (data.text && data.text.trim()) {
        setCurrentTranscription(data.text)
        sendToModel(data.text)
      } else {
        setVoiceState('idle')
      }
    } catch (err) {
      console.log('Failed to transcribe:', err)
      setVoiceState('idle')
    }
  }

  async function sendToModel(text: string) {
    setVoiceState('responding')
    let localResponse = ''

    const newMessages: VoiceMessage[] = [...messages, { user: text }]
    setMessages([...newMessages])
    setCurrentTranscription('')

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)

    const chatTypeStr = getChatType(chatType)

    let body: any
    if (chatTypeStr === 'claude') {
      const claudePrompt = `${apiMessages}\n\nHuman: ${text}\n\nAssistant:`
      body = { prompt: claudePrompt, model: chatType.label }
    } else if (chatTypeStr === 'gemini') {
      body = { prompt: text, model: chatType.label }
    } else {
      const gptMessages = newMessages.reduce((acc: any[], msg) => {
        acc.push({ role: 'user', content: msg.user })
        if (msg.assistant) {
          acc.push({ role: 'assistant', content: msg.assistant })
        }
        return acc
      }, [])
      body = { messages: gptMessages, model: chatType.label }
    }

    const es = await getEventSource({ body, type: chatTypeStr })

    const listener = (event: any) => {
      if (event.type === 'open') {
        // connection opened
      } else if (event.type === 'message') {
        if (event.data !== '[DONE]') {
          if (localResponse.length < 850) {
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
          const data = JSON.parse(event.data)
          if (chatTypeStr === 'claude') {
            if (data.text) localResponse += data.text
          } else if (chatTypeStr === 'gemini') {
            localResponse += typeof data === 'string' ? data : ''
          } else {
            if (typeof data === 'string') {
              localResponse += data
            } else if (data?.content) {
              localResponse += data.content
            }
          }
          const updated = [...newMessages]
          updated[updated.length - 1].assistant = localResponse
          setMessages([...updated])
        } else {
          es.close()
          setVoiceState('idle')
          if (chatTypeStr === 'claude') {
            setApiMessages(prev =>
              `${prev}\n\nHuman: ${text}\n\nAssistant:${getFirstNCharsOrLess(localResponse, 2000)}`
            )
          }
          if (localResponse) {
            speakResponse(localResponse)
          }
        }
      } else if (event.type === 'error' || event.type === 'exception') {
        setVoiceState('idle')
        es.close()
      }
    }

    es.addEventListener('open', listener)
    es.addEventListener('message', listener)
    es.addEventListener('error', listener)
  }

  function speakResponse(text: string) {
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' code block ')
      .replace(/`[^`]*`/g, '')
      .replace(/[#*_~\[\]]/g, '')
      .replace(/\n+/g, '. ')
      .trim()

    if (!cleanText) return

    setIsSpeaking(true)
    Speech.speak(cleanText, {
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
      rate: 1.0,
    })
  }

  function stopSpeaking() {
    Speech.stop()
    setIsSpeaking(false)
  }

  function handleMicPress() {
    if (voiceState === 'idle') {
      if (isSpeaking) stopSpeaking()
      startRecording()
    } else if (voiceState === 'recording') {
      stopRecording()
    }
  }

  function clearConversation() {
    setMessages([])
    setCurrentTranscription('')
    setApiMessages('')
    if (isSpeaking) stopSpeaking()
  }

  const getStatusText = () => {
    switch (voiceState) {
      case 'recording': return 'Listening...'
      case 'transcribing': return 'Transcribing...'
      case 'responding': return 'Thinking...'
      default: return isSpeaking ? 'Speaking...' : 'Tap to speak'
    }
  }

  const getMicColor = () => {
    if (voiceState === 'recording') return '#ff4444'
    if (voiceState === 'transcribing' || voiceState === 'responding') return theme.mutedForegroundColor
    return theme.tintColor
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && voiceState === 'idle' && (
          <View style={styles.emptyState}>
            <Ionicons name="mic-outline" size={48} color={theme.mutedForegroundColor} />
            <Text style={styles.emptyStateTitle}>Voice Chat</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the microphone to start speaking.{'\n'}Your speech will be transcribed and sent to {chatType.name}.
            </Text>
          </View>
        )}
        {messages.map((msg, i) => (
          <View key={i}>
            <View style={styles.userBubble}>
              <Ionicons
                name="mic"
                size={14}
                color={theme.tintTextColor}
                style={styles.micIcon}
              />
              <Text style={styles.userText}>{msg.user}</Text>
            </View>
            {msg.assistant ? (
              <View style={styles.assistantBubble}>
                <Markdown
                  style={{
                    body: {
                      color: theme.textColor,
                      fontFamily: theme.regularFont,
                      fontSize: 15,
                    },
                    code_inline: {
                      backgroundColor: theme.backgroundColor,
                      color: theme.textColor,
                      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                      fontSize: 13,
                    },
                    fence: {
                      backgroundColor: theme.backgroundColor,
                      color: theme.textColor,
                      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                      fontSize: 13,
                      padding: 10,
                      borderRadius: 6,
                    },
                  }}
                >
                  {msg.assistant}
                </Markdown>
              </View>
            ) : (
              <View style={styles.assistantBubble}>
                <ActivityIndicator size="small" color={theme.tintColor} />
              </View>
            )}
          </View>
        ))}
        {currentTranscription ? (
          <View style={styles.userBubble}>
            <Ionicons
              name="mic"
              size={14}
              color={theme.tintTextColor}
              style={styles.micIcon}
            />
            <Text style={styles.userText}>{currentTranscription}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.controlsContainer}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        <View style={styles.buttonRow}>
          {messages.length > 0 && voiceState === 'idle' && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={clearConversation}
            >
              <Ionicons name="trash-outline" size={22} color={theme.textColor} />
            </TouchableOpacity>
          )}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.micButton,
                { backgroundColor: getMicColor() },
                (voiceState === 'transcribing' || voiceState === 'responding') &&
                  styles.micButtonDisabled,
              ]}
              onPress={handleMicPress}
              disabled={voiceState === 'transcribing' || voiceState === 'responding'}
              activeOpacity={0.7}
            >
              <Ionicons
                name={voiceState === 'recording' ? 'stop' : 'mic'}
                size={32}
                color="#fff"
              />
            </TouchableOpacity>
          </Animated.View>
          {isSpeaking && voiceState === 'idle' && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={stopSpeaking}
            >
              <Ionicons name="volume-mute" size={22} color={theme.textColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    messagesContainer: {
      flex: 1,
    },
    messagesContent: {
      padding: 16,
      paddingBottom: 8,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
      paddingHorizontal: 40,
    },
    emptyStateTitle: {
      fontSize: 22,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      marginTop: 16,
    },
    emptyStateSubtext: {
      fontSize: 14,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
    },
    userBubble: {
      backgroundColor: theme.tintColor,
      borderRadius: 16,
      borderBottomRightRadius: 4,
      padding: 12,
      paddingHorizontal: 14,
      marginBottom: 8,
      alignSelf: 'flex-end',
      maxWidth: '80%',
      flexDirection: 'row',
      alignItems: 'center',
    },
    micIcon: {
      marginRight: 6,
    },
    userText: {
      color: theme.tintTextColor,
      fontSize: 15,
      fontFamily: theme.regularFont,
      flex: 1,
    },
    assistantBubble: {
      backgroundColor: theme.borderColor,
      borderRadius: 16,
      borderBottomLeftRadius: 4,
      padding: 12,
      paddingHorizontal: 14,
      marginBottom: 16,
      alignSelf: 'flex-start',
      maxWidth: '85%',
    },
    controlsContainer: {
      alignItems: 'center',
      paddingVertical: 20,
      paddingBottom: 10,
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
    },
    statusText: {
      fontSize: 14,
      fontFamily: theme.mediumFont,
      color: theme.mutedForegroundColor,
      marginBottom: 16,
    },
    buttonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    },
    micButton: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    micButtonDisabled: {
      opacity: 0.5,
    },
    secondaryButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.borderColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
  })
}
