import {
  View,
  Text,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableHighlight,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  Share
} from 'react-native'
import 'react-native-get-random-values';
import { useContext, useState, useRef } from 'react'
import { ThemeContext, AppContext } from '../context'
import { getEventSource, getFirstN, getFirstNCharsOrLess, getChatType } from '../utils'
import { v4 as uuid } from 'uuid'
import Ionicons from '@expo/vector-icons/Ionicons'
import FeatherIcon from '@expo/vector-icons/Feather'
import {
  IOpenAIMessages,
  IOpenAIUserHistory,
  IOpenAIStateWithIndex
} from '../../types'
import Markdown from '@ronradtke/react-native-markdown-display'

export function Chat() {
  const [loading, setLoading] = useState<boolean>(false)
  const [input, setInput] = useState<string>('')
  const [callMade, setCallMade] = useState<boolean>(false)
  const scrollViewRef = useRef<ScrollView | null>(null)

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

  const { theme } = useContext(ThemeContext)
  const { chatType } = useContext(AppContext)
  const styles = getStyles(theme)

  async function chat() {
    if (!input) return
    setCallMade(true)
    Keyboard.dismiss()
    if (chatType.label.includes('claude')) {
      generateClaudeResponse()
    } else if (chatType.label.includes('cohere')) {
      generateCohereResponse()
    } else {
      generateOpenaiResponse()
    }
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
          console.log('data: ', data)
          localResponse = localResponse + JSON.parse(data).completion
          claudeArray[claudeArray.length - 1].assistant = localResponse
          setClaudeResponse(c => ({
            index: c.index,
            messages: JSON.parse(JSON.stringify(claudeArray))
          }))
        } else {
          setLoading(false)
          // set claude api messages to include user's input and assistant's response for future context
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
        type: getChatType(chatType),
      }
      setInput('')
      const eventSource = getEventSource(eventSourceArgs)

      console.log('aboutto open listener...')
      const listener = (event:any) => {
        console.log('event:', event)
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
      eventSource.addEventListener("open", listener);
      eventSource.addEventListener("message", listener);
      eventSource.addEventListener("error", listener);
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
     
      es.addEventListener("open", listener);
      es.addEventListener("message", listener);
      es.addEventListener("error", listener);
    } catch (err) {
      console.log('error generating cohere chat...', err)
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
          </View>
        )
      }
      </View>
    )
  }

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
                  placeholderTextColor={theme.mutedForegroundColor}
                  autoCorrect={true}
                />
                <TouchableHighlight
                  onPress={chat}
                  underlayColor={'transparent'}
                >
                  <View style={styles.midButtonStyle}>
                    <Ionicons
                      name="chatbox-ellipses-outline"
                      size={22} color="white"
                    />
                    <Text style={styles.midButtonText}>
                      Chat
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
              placeholderTextColor={theme.tabBarInactiveTintColor}
              value={input}
            />
            <TouchableHighlight
              underlayColor={'transparent'}
              activeOpacity={0.65}
              style={styles.chatButtonContainer}
              onPress={chat}
            >
              <View
                style={styles.chatButton}
              >
                <FeatherIcon
                  name='arrow-up'
                  color={theme.highlightedTextColor}
                  size={20}
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
    fontFamily: 'Geist-Light'
  },
  midInput: {
    marginBottom: 8,
    borderWidth: 1,
    paddingHorizontal: 25,
    marginHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 99,
    color: theme.lightWhite,
    borderColor: theme.borderColor,
    fontFamily: 'Geist-Medium',
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
    color: theme.buttonTextColor,
    marginLeft: 10,
    fontFamily: 'Geist-Bold',
    fontSize: 18
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
    color: 'white',
    fontFamily: 'Geist-Regular',
    paddingVertical: 5,
    paddingHorizontal: 9,
    fontSize: 16
  },
  chatButtonContainer: {
    borderRadius: 100,
    marginLeft: 5
  },
  chatButton: {
    backgroundColor: theme.tintColor,
    padding: 5,
    borderRadius: 100
  },
  chatInputContainer: {
    paddingTop: 5,
    borderColor:'white',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 5,
    paddingHorizontal: 10
  },
  input: {
    width: '92%',
    color: theme.textColor,
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 13,
    fontFamily: 'Geist-Regular',
    padding: 7,
    borderColor: theme.borderColor
  },
  container: {
    backgroundColor: theme.backgroundColor,
    flex: 1,
    paddingTop: 5
  },
  mainText: {
    fontFamily: 'Geist-Regular'
  },
  markdownStyle: {
    body: {
      color: theme.textColor,
      fontFamily: 'Geist-Regular'
    },
    paragraph: {
      color: theme.textColor,
      fontSize: 16,
      fontFamily: 'Geist-Regular'
    },
    heading1: {
      color: theme.textColor,
      fontFamily: 'Geist-SemiBold',
      marginVertical: 5
    },
    heading2: {
      color: theme.textColor,
      fontFamily: 'Geist-SemiBold',
      marginVertical: 5
    },
    heading3: {
      color: theme.textColor,
      fontFamily: 'Geist-Medium',
      marginVertical: 5
    },
    heading4: {
      color: theme.textColor,
      fontFamily: 'Geist-Medium',
      marginVertical: 5
    },
    heading5: {
      color: theme.textColor,
      fontFamily: 'Geist-Medium',
      marginVertical: 5
    },
    heading6: {
      color: theme.textColor,
      fontFamily: 'Geist-Medium',
      marginVertical: 5
    },
    list_item: {
      marginTop: 7,
      color: theme.textColor,
      fontFamily: 'Geist-Regular',
      fontSize: 16,
    },
    ordered_list_icon: {
      color: theme.textColor,
      fontSize: 16,
      fontFamily: 'Geist-Regular'
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
      fontFamily: 'Geist-Regular'
    },
    code_inline: {
      backgroundColor: '#312e2e',
      color: theme.textColor,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, .1)'
    },
    hr: {
      backgroundColor: 'rgba(255, 255, 255, .1)',
      height: 1,
    },
    fence: {
      marginVertical: 5,
      padding: 10,
      backgroundColor: '#312e2e',
      color: 'white',
      borderColor: 'rgba(255, 255, 255, .1)'
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