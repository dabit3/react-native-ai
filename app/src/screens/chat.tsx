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
import { useContext, useState } from 'react'
import { ThemeContext, AppContext } from '../context'
import { getEventSource, getFirstN, getFirstNCharsOrLess, getChatType } from '../utils'
import { v4 as uuid } from 'uuid'
import FeatherIcon from '@expo/vector-icons/Feather'
import {
  IOpenAIMessages,
  IOpenAIUserHistory,
  IOpenAIStateWithIndex
} from '../../types'
import Markdown from '@ronradtke/react-native-markdown-display'

export function Chat() {
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')

  // openAI state management
  const [openaiMessages, setOpenaiMessages] = useState<IOpenAIMessages[]>([])
  const [openaiResponse, setOpenaiResponse] = useState<IOpenAIStateWithIndex>({
    messages: [],
    index: uuid()
  })

  const { theme } = useContext(ThemeContext)
  const { chatType } = useContext(AppContext)
  const styles = getStyles(theme)

  async function chat() {
    if (!input) return
    Keyboard.dismiss()
    if (chatType.includes('claude')) {
      generateClaudeResponse()
    } else if (chatType.includes('cohere')) {
      generateCohereResponse()
    } else {
      generateOpenaiResponse()
    }
  }

  async function generateCohereResponse() {}
  async function generateClaudeResponse() {}

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
    
      console.log('messagesRequest: ', messagesRequest)
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
          model: chatType
        },
        type: getChatType(chatType),
      }
      const eventSource = await getEventSource(eventSourceArgs)

      console.log('aboutto open listener...')
      const listener = (event:any) => {
        console.log('event:', event)
        if (event.type === "open") {
          console.log("Open SSE connection.")
          setLoading(false)
        } else if (event.type === 'message') {
          if (event.data !== "[DONE]") {

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

    }
  }


  function renderOpenaiItem({
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
      >
        <FlatList
          data={openaiResponse.messages}
          renderItem={renderOpenaiItem}
          scrollEnabled={false}
        />
      </ScrollView>
      <View
        style={styles.inputContainer}
      >
       <TextInput
        style={styles.input}
        onChangeText={v => setInput(v)}
        placeholder='Message'
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
    </KeyboardAvoidingView>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
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
      fontFamily: 'Geist-SemiBold',
      marginVertical: 5
    },
    heading2: {
      fontFamily: 'Geist-SemiBold',
      marginVertical: 5
    },
    heading3: {
      fontFamily: 'Geist-Medium',
      marginVertical: 5
    },
    heading4: {
      fontFamily: 'Geist-Medium',
      marginVertical: 5
    },
    heading5: {
      fontFamily: 'Geist-Medium',
      marginVertical: 5
    },
    heading6: {
      fontFamily: 'Geist-Medium',
      marginVertical: 5
    },
    list_item: {
      marginTop: 7,
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
  },
  promptResponse: {
    marginTop: 10,
  },
  textStyleContainer: {
    borderWidth: 1,
    borderColor: theme.borderColor,
    padding: 15,
    paddingBottom: 5,
    paddingTop: 0,
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
    backgroundColor: theme.tintColor,
  },
  promptText: {
    color: theme.secondaryTextColor,
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
  inputContainer: {
    padding: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: '92%',
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 13,
    fontFamily: 'Geist-Regular',
    padding: 7,
    borderColor: theme.borderColor
  },
  container: {
    backgroundColor: theme.backgroundColor,
    flex: 1
  },
  mainText: {
    fontFamily: 'Geist-Regular'
  },
})