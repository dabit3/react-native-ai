import {
  View,
  Text,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableHighlight,
  TextInput,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Keyboard
} from 'react-native'
import 'react-native-get-random-values'
import { useContext, useState, useRef } from 'react'
import { ThemeContext, AppContext } from '../context'
import { getEventSource, getFirstN, getFirstNCharsOrLess, getChatType } from '../utils'
import { v4 as uuid } from 'uuid'
import Ionicons from '@expo/vector-icons/Ionicons'
import {
  IOpenAIMessages,
  IOpenAIStateWithIndex
} from '../../types'
import * as Clipboard from 'expo-clipboard'
import { useActionSheet } from '@expo/react-native-action-sheet'
import Markdown from '@ronradtke/react-native-markdown-display'

export function Chat() {
  const [loading, setLoading] = useState<boolean>(false)
  const [input, setInput] = useState<string>('')
  const scrollViewRef = useRef<ScrollView | null>(null)
  const { showActionSheetWithOptions } = useActionSheet()

  // claude state management
  const [claudeAPIMessages, setClaudeAPIMessages] = useState('')
  const [claudeResponse, setClaudeResponse] = useState({
    messages: [],
    index: uuid(),
  })

  // openAI state management
  const [openaiMessages, setOpenaiMessages] = useState<IOpenAIMessages[]>([])
  const [openaiResponse, setOpenaiResponse] = useState<IOpenAIStateWithIndex>({
    messages: [],
    index: uuid()
  })

  // cohere state management
  const [cohereResponse, setCohereResponse] = useState({
    messages: [],
    index: uuid()
  })

  // mistral state management
  const [mistralAPIMessages, setMistralAPIMessages] = useState('')
  const [mistralResponse, setMistralResponse] = useState({
    messages: [],
    index: uuid()
  })


  // Gemini state management
  const [geminiAPIMessages, setGeminiAPIMessages] = useState('')
  const [geminiResponse, setGeminiResponse] = useState({
    messages: [],
    index: uuid()
  })

  const { theme } = useContext(ThemeContext)
  const { chatType } = useContext(AppContext)
  const styles = getStyles(theme)

  async function chat() {
    if (!input) return
    Keyboard.dismiss()
    if (chatType.label.includes('claude')) {
      generateClaudeResponse()
    } else if (chatType.label.includes('cohere')) {
      generateCohereResponse()
    } else if (chatType.label.includes('mistral')) {
      generateMistralResponse()
    } else if (chatType.label.includes('gemini')) {
      generateGeminiResponse()
    }
    else {
      generateOpenaiResponse()
    }
  }
  async function generateGeminiResponse() {
    if (!input) return
    Keyboard.dismiss()
    let localResponse = ''
    const geminiInput = `${input}`

    let geminiArray = [
      ...geminiResponse.messages, {
        user: input,
      }
    ] as [{user: string, assistant?: string}]

    setGeminiResponse(c => ({
      index: c.index,
      messages: JSON.parse(JSON.stringify(geminiArray))
    }))

    setLoading(true)
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({
        animated: true
      })
    }, 1)
    setInput('')

    const eventSourceArgs = {
      body: {
        prompt: geminiInput,
        model: chatType.label
      },
      type: getChatType(chatType)
    }

    const es = await getEventSource(eventSourceArgs)

   
    const listener = (event) => {
      if (event.type === "open") {
        console.log("Open SSE connection.")
        setLoading(false)
      } else if (event.type === "message") {
        if (event.data !== "[DONE]") {
          if (localResponse.length < 850) {
            scrollViewRef.current?.scrollToEnd({
              animated: true
            })
          }
        
          const data = event.data
          localResponse = localResponse + JSON.parse(data)
          geminiArray[geminiArray.length - 1].assistant = localResponse
          setGeminiResponse(c => ({
            index: c.index,
            messages: JSON.parse(JSON.stringify(geminiArray))
          }))
        } else {
          setLoading(false)
          setGeminiAPIMessages(
            `${geminiAPIMessages}\n\nPrompt: ${input}\n\nResponse:${localResponse}`
          )
          es.close()
        }
      } else if (event.type === "error") {
        console.error("Connection error:", event.message)
        setLoading(false)
      } else if (event.type === "exception") {
        console.error("Error:", event.message, event.error)
        setLoading(false)
      }
    }
   
    es.addEventListener("open", listener);
    es.addEventListener("message", listener);
    es.addEventListener("error", listener);
  }

  async function generateMistralResponse() {
    if (!input) return
    Keyboard.dismiss()
    let localResponse = ''
    const mistralInput = `${mistralAPIMessages}\n\n Prompt: ${input}`

    let mistralArray = [
      ...mistralResponse.messages, {
        user: input,
      }
    ] as [{user: string, assistant?: string}]

    setMistralResponse(c => ({
      index: c.index,
      messages: JSON.parse(JSON.stringify(mistralArray))
    }))

    setLoading(true)
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({
        animated: true
      })
    }, 1)
    setInput('')

    const eventSourceArgs = {
      body: {
        prompt: mistralInput,
        model: chatType.label
      },
      type: getChatType(chatType)
    }

    const es = await getEventSource(eventSourceArgs)

    const listener = (event) => {
      if (event.type === "open") {
        console.log("Open SSE connection.")
        setLoading(false)
      } else if (event.type === "message") {
        if (event.data !== "[DONE]") {
          if (localResponse.length < 850) {
            scrollViewRef.current?.scrollToEnd({
              animated: true
            })
          }
          const data = event.data
          localResponse = localResponse + JSON.parse(data).data

          mistralArray[mistralArray.length - 1].assistant = localResponse
          setMistralResponse(c => ({
            index: c.index,
            messages: JSON.parse(JSON.stringify(mistralArray))
          }))
        } else {
          setLoading(false)
          setMistralAPIMessages(
            `${mistralAPIMessages}\n\nPrompt: ${input}\n\nResponse:${getFirstNCharsOrLess(localResponse, 2000)}`
          )
          es.close()
        }
      } else if (event.type === "error") {
        console.error("Connection error:", event.message)
        setLoading(false)
      } else if (event.type === "exception") {
        console.error("Error:", event.message, event.error)
        setLoading(false)
      }
    }
   
    es.addEventListener("open", listener);
    es.addEventListener("message", listener);
    es.addEventListener("error", listener);
  }

  async function generateClaudeResponse() {
    if (!input) return
    Keyboard.dismiss()
    let localResponse = ''
    const claudeInput = `${claudeAPIMessages}\n\nHuman: ${input}\n\nAssistant:`

    let claudeArray = [
      ...claudeResponse.messages, {
        user: input,
      }
    ] as [{user: string, assistant?: string}]

    setClaudeResponse(c => ({
      index: c.index,
      messages: JSON.parse(JSON.stringify(claudeArray))
    }))

    setLoading(true)
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({
        animated: true
      })
    }, 1)
    setInput('')

    const eventSourceArgs = {
      body: {
        prompt: claudeInput,
        model: chatType.label
      },
      type: getChatType(chatType),
    }

    const es = await getEventSource(eventSourceArgs)

    const listener = (event) => {
      if (event.type === "open") {
        console.log("Open SSE connection.")
        setLoading(false)
      } else if (event.type === "message") {
        if (event.data !== "[DONE]") {
          if (localResponse.length < 850) {
            scrollViewRef.current?.scrollToEnd({
              animated: true
            })
          }
          const data = event.data
          localResponse = localResponse + JSON.parse(data).text
          claudeArray[claudeArray.length - 1].assistant = localResponse
          setClaudeResponse(c => ({
            index: c.index,
            messages: JSON.parse(JSON.stringify(claudeArray))
          }))
        } else {
          setLoading(false)
          setClaudeAPIMessages(
            `${claudeAPIMessages}\n\nHuman: ${input}\n\nAssistant:${getFirstNCharsOrLess(localResponse, 2000)}`
          )
          es.close()
        }
      } else if (event.type === "error") {
        console.error("Connection error:", event.message)
        setLoading(false)
      } else if (event.type === "exception") {
        console.error("Error:", event.message, event.error)
        setLoading(false)
      }
    }
    es.addEventListener("open", listener)
    es.addEventListener("message", listener)
    es.addEventListener("error", listener)
  }

  async function generateOpenaiResponse() {
    try {
      setLoading(true)
      // set message state for openai to have context on previous conversations
      let messagesRequest = getFirstN({ messages: openaiMessages })
      if (openaiResponse.messages.length) {
        messagesRequest = [
          ...messagesRequest,
          {
            role: 'assistant',
            content: getFirstNCharsOrLess(
              openaiResponse.messages[openaiResponse.messages.length -1].assistant
            )
          }
        ]
      }
      messagesRequest = [...messagesRequest, {role: 'user', content: input}]
      setOpenaiMessages(messagesRequest)

      // set local openai state to dislay user's most recent question
      let openaiArray = [
        ...openaiResponse.messages,
        {
          user: input,
          assistant: ''
        }
      ]
      setOpenaiResponse(c => ({
        index: c.index,
        messages: JSON.parse(JSON.stringify(openaiArray))
      }))

      let localResponse = ''
      const eventSourceArgs = {
        body: {
          messages: messagesRequest,
          model: chatType.label
        },
        type: getChatType(chatType)
      }
      setInput('')
      const eventSource = getEventSource(eventSourceArgs)

      console.log('about to open listener...')
      const listener = (event:any) => {
        if (event.type === "open") {
          console.log("Open SSE connection.")
          setLoading(false)
        } else if (event.type === 'message') {
          if (event.data !== "[DONE]") {
            if (localResponse.length < 850) {
              scrollViewRef.current?.scrollToEnd({
                animated: true
              })
            }
            // if (!JSON.parse(event.data).content) return
            localResponse = localResponse + JSON.parse(event.data).content
            openaiArray[openaiArray.length - 1].assistant = localResponse
            setOpenaiResponse(c => ({
              index: c.index,
              messages: JSON.parse(JSON.stringify(openaiArray))
            }))
          } else {
            setLoading(false)
            eventSource.close()
          }
        } else if (event.type === "error") {
          console.error("Connection error:", event.message)
          setLoading(false)
          eventSource.close()
        } else if (event.type === "exception") {
          console.error("Error:", event.message, event.error)
          setLoading(false)
          eventSource.close()
        }
      }
      eventSource.addEventListener("open", listener)
      eventSource.addEventListener("message", listener)
      eventSource.addEventListener("error", listener)
    } catch (err) {
      console.log('error in generateOpenaiResponse: ', err)
    }
  }

  async function generateCohereResponse() {
    try {
      if (!input) return
      Keyboard.dismiss()
      let localResponse = ''
      let requestInput = input

      let cohereArray = [
        ...cohereResponse.messages,
        {
          user: input,
          assistant: ''
        }
      ]

      setCohereResponse(r => ({
        index: r.index,
        messages: JSON.parse(JSON.stringify(cohereArray))
      }))

      setLoading(true)
      setInput('')
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({
          animated: true
        })
      }, 1)

      const eventSourceArgs = {
        type: getChatType(chatType),
        body: {
          prompt: requestInput,
          conversationId: cohereResponse.index,
          model: chatType.label
        }
      }

      const es = await getEventSource(eventSourceArgs)

      const listener = (event) => {
        if (
          event.data === "[DONE]"
        ) {
          console.log('done ....')
          return es.close()
        }
        if (event.type === "open") {
          setLoading(false)
        } else if (event.type === 'message') {
          try {
            JSON.parse(event.data)
            if (event.data !== "[DONE]" || !JSON.parse(event.data).is_finished) {
              if (localResponse.length < 850) {
                scrollViewRef.current?.scrollToEnd({
                  animated: true
                })
              }
              if (JSON.parse(event.data).text) {
                if (!localResponse && JSON.parse(event.data).text === '\n') return
                if (
                  !localResponse && 
                  JSON.parse(event.data).text.charAt(0) === ' '
                ) {
                  localResponse = JSON.parse(event.data).text.substring(1)
                } else {
                  localResponse = localResponse + JSON.parse(event.data).text
                }
                cohereArray[cohereArray.length - 1].assistant = localResponse
                setCohereResponse(r => ({
                  index: r.index,
                  messages: JSON.parse(JSON.stringify(cohereArray))
                }))
              }
              if (JSON.parse(event.data).is_finished) {
                setLoading(false)
                es.close()
              }
            } else {
              setLoading(false)
              es.close()
            }
          } catch (err) {
            console.log('error parsing data ... ', err)
            setLoading(false)
            es.close()
          }
        } else if (event.type === "error" || event.type === "exception") {
          console.error("Connection error:", event.message)
          setLoading(false)
          es.close()
        } else {
          console.error("Connection error:", event.message)
          setLoading(false)
          es.close()
        }
      }
     
      es.addEventListener("open", listener)
      es.addEventListener("message", listener)
      es.addEventListener("error", listener)
    } catch (err) {
      console.log('error generating cohere chat...', err)
    }
  }

  async function copyToClipboard(text) {
    await Clipboard.setStringAsync(text)
  }

  async function showClipboardActionsheet(text) {
    const cancelButtonIndex = 2
    showActionSheetWithOptions({
      options: ['Copy to clipboard', 'Clear chat', 'cancel'],
      cancelButtonIndex
    }, selectedIndex => {
      if (selectedIndex === Number(0)) {
        copyToClipboard(text)
      }
      if (selectedIndex === 1) {
        clearChat()
      }
    })
  }

  async function clearChat() {
    if (loading) return
    if (chatType.label.includes('claude')) {
      setClaudeResponse({
        messages: [],
        index: uuid()
      })
      setClaudeAPIMessages('')
    } else if (chatType.label.includes('cohere')) {
      setCohereResponse({
        messages: [],
        index: uuid()
      })
    } else if (chatType.label.includes('mistral')) {
      setMistralResponse({
        messages: [],
        index: uuid()
      })
      setMistralAPIMessages('')
    } else if (chatType.label.includes('gemini')) {
      setGeminiResponse({
        messages: [],
        index: uuid()
      })
      setGeminiAPIMessages('')
    }
     else {
      setOpenaiResponse({
        messages: [],
        index: uuid()
      })
      setOpenaiMessages([])
    }
  }

  function renderItem({
    item, index
  } : {
    item: any, index: number
  }) {
    return (
      <View style={styles.promptResponse} key={index}>
        <View style={styles.promptTextContainer}>
          <View style={styles.promptTextWrapper}>
            <Text style={styles.promptText}>
              {item.user}
            </Text>
          </View>
        </View>
      {
        item.assistant && (
          <View style={styles.textStyleContainer}>
            <Markdown
              style={styles.markdownStyle as any}
            >{item.assistant}</Markdown>
            <TouchableHighlight
              onPress={() => showClipboardActionsheet(item.assistant)}
              underlayColor={'transparent'}
            >
              <View style={styles.optionsIconWrapper}>
                <Ionicons
                  name="apps"
                  size={20}
                  color={theme.textColor}
                />
              </View>
            </TouchableHighlight>
          </View>
        )
      }
      </View>
    )
  }

  const callMade = (() => {
    if (chatType.label.includes('claude')) {
      return claudeResponse.messages.length > 0
    }
    if (chatType.label.includes('cohere')) {
      return cohereResponse.messages.length > 0
    }
    if (chatType.label.includes('mistral')) {
      return mistralResponse.messages.length > 0
    }
    if (chatType.label.includes('gemini')) {
      return geminiResponse.messages.length > 0
    }
    return openaiResponse.messages.length > 0
  })()

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.container}
      keyboardVerticalOffset={110}
    >
      <ScrollView
        keyboardShouldPersistTaps='handled'
        ref={scrollViewRef}
        contentContainerStyle={!callMade && styles.scrollContentContainer}
      >
        {
          !callMade && (
            <View style={styles.midChatInputWrapper}>
              <View style={styles.midChatInputContainer}>
                
                <TextInput
                  onChangeText={v => setInput(v)}
                  style={styles.midInput}
                  placeholder='Message'
                  placeholderTextColor={theme.placeholderTextColor}
                  autoCorrect={true}
                />
                <TouchableHighlight
                  onPress={chat}
                  underlayColor={'transparent'}
                >
                  <View style={styles.midButtonStyle}>
                    <Ionicons
                      name="chatbox-ellipses-outline"
                      size={22} color={theme.tintTextColor}
                    />
                    <Text style={styles.midButtonText}>
                      Start {chatType.name} Chat
                    </Text>
                  </View>
                </TouchableHighlight>
                <Text style={styles.chatDescription}>
                  Chat with a variety of different language models.
                </Text>
              </View>
            </View>
          )
        }
        {
          callMade && (
            <>
            {
              chatType.label.includes('gpt') && (
                <FlatList
                  data={openaiResponse.messages}
                  renderItem={renderItem}
                  scrollEnabled={false}
                />
              )
            }
            {
              chatType.label.includes('claude') && (
                <FlatList
                  data={claudeResponse.messages}
                  renderItem={renderItem}
                  scrollEnabled={false}
                />
              )
            }
            {
              chatType.label.includes('cohere') && (
                <FlatList
                  data={cohereResponse.messages}
                  renderItem={renderItem}
                  scrollEnabled={false}
                />
              )
            }
            {
              chatType.label.includes('mistral') && (
                <FlatList
                  data={mistralResponse.messages}
                  renderItem={renderItem}
                  scrollEnabled={false}
                />
              )
            }
            {
              chatType.label.includes('gemini') && (
                <FlatList
                  data={geminiResponse.messages}
                  renderItem={renderItem}
                  scrollEnabled={false}
                />
              )
            }
            </>
          )
        }
        {
          loading && (
            <ActivityIndicator style={styles.loadingContainer} />
          )
        }
      </ScrollView>
      {
        callMade && (
          <View
              style={styles.chatInputContainer}
            >
            <TextInput
              style={styles.input}
              onChangeText={v => setInput(v)}
              placeholder='Message'
              placeholderTextColor={theme.placeholderTextColor}
              value={input}
            />
            <TouchableHighlight
              underlayColor={'transparent'}
              activeOpacity={0.65}
              onPress={chat}
            >
              <View
                style={styles.chatButton}
              >
                <Ionicons
                  name="arrow-up-outline"
                  size={20} color={theme.tintTextColor}
                />
              </View>
            </TouchableHighlight>
          </View>
        )
      }
    </KeyboardAvoidingView>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  optionsIconWrapper: {
    padding: 10,
    paddingTop: 9,
    alignItems: 'flex-end'
  },
  scrollContentContainer: {
    flex: 1,
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
    borderRadius: 99,
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
  loadingContainer: {
    marginTop: 25
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
    borderRadius: 99,
    color: theme.textColor,
    marginHorizontal: 10,
    paddingVertical: 10,
    paddingHorizontal: 21,
    paddingRight: 39,
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
      borderColor: 'rgba(255, 255, 255, .1)',
      fontFamily: theme.lightFont
    },
    hr: {
      backgroundColor: 'rgba(255, 255, 255, .1)',
      height: 1,
    },
    fence: {
      marginVertical: 5,
      padding: 10,
      color: theme.secondaryTextColor,
      backgroundColor: theme.secondaryBackgroundColor,
      borderColor: 'rgba(255, 255, 255, .1)',
      fontFamily: theme.regularFont
    },
    tr: {
      borderBottomWidth: 1,
      borderColor: 'rgba(255, 255, 255, .2)',
      flexDirection: 'row',
    },
    table: {
      marginTop: 7,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, .2)',
      borderRadius: 3,
    },
    blockquote: {
      backgroundColor: '#312e2e',
      borderColor: '#CCC',
      borderLeftWidth: 4,
      marginLeft: 5,
      paddingHorizontal: 5,
      marginVertical: 5,
    },
  } as any,
})