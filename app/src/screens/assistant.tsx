import { useState, useContext, useRef, useEffect } from 'react'
import {
  View,
  Text,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableHighlight,
  TextInput,
  FlatList,
  ScrollView,
  Dimensions,
  Keyboard,
  ActivityIndicator
} from 'react-native'
import { ThemeContext } from '../context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { DOMAIN } from '../../constants'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import Markdown from '@ronradtke/react-native-markdown-display';
import * as DocumentPicker from 'expo-document-picker';

const { height } = Dimensions.get('window')

export function Assistant({ navigation }) {
  const [loading, setLoading] = useState(false)
  const scrollViewRef = useRef<ScrollView | null>(null)
  const [input, setInput] = useState<string>("")
  const [instructions, setInstructions] = useState<string>("")
  const [file, setFile] = useState<any>(null)

  const [assistantId, setAssistantId] = useState<string>('')
  const [threadId, setThreadId] = useState<string>('')
  const [openaiResponse, setOpenaiResponse] = useState<any>([])

  const { theme } = useContext(ThemeContext)

  function onChangeInputText(v) {
    setInput(v)
  }

  function onChangeInstructionsText(v) {
    setInput(v)
  }

  async function clearChat() {
    if (loading) return
    setFile(null)
  }

  async function createThread() {
    if (!input) return
    generateAssistantResponse()
  }

  async function generateAssistantResponse() {
    try {
      Keyboard.dismiss()
      const fileCopy = file
      let localInput = {
        type: 'user',
        value: input
      } as any

      if (instructions) {
        localInput.instructions = instructions
      }
      setOpenaiResponse([localInput])
  
      setInput('')
      setInstructions('')
      setLoading(true)
      setFile(null)
  
      const body: {
        input: string,
        instructions?: string
      } = {
        input
      }
      if (instructions) {
        body.instructions = instructions
      }
      let response
      if (fileCopy) {
        const formData = new FormData()
        // @ts-ignore
        formData.append('file', {
          uri: fileCopy.uri.replace('file://', ''),
          name: fileCopy.name,
          type: fileCopy.mimeType
        })
        for (const key in body) {
          formData.append(key, body[key])
        }
        response = await fetch(`${DOMAIN}/chat/create-assistant`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }).then(res => res.json())
        
      } else {
        response = await fetch(`${DOMAIN}/chat/create-assistant`, {
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(res => res.json())
      }

      const {
        assistantId: _assistantId, threadId: _threadId, runId: _runId
      } = await response
    
      setThreadId(_threadId)
      setAssistantId(_assistantId)
      checkThread(_runId, _threadId)
    } catch (err) {
      console.log('error calling assistant API:', err)
      setLoading(false)
    }
  }

  async function checkThread(_runId, _threadId) {
    try {
      let finished = false
      while (!finished) {
        const response = await fetch(`${DOMAIN}/chat/run-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            thread_id: _threadId,
            run_id: _runId
          })
        }).then(res => res.json())
        if (response.status === 'completed') {
          finished = true
          break
        } else {
          await new Promise(resolve => setTimeout(resolve, 250))
        }
      }

      const thread = await fetch(`${DOMAIN}/chat/get-thread-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          thread_id: _threadId
        })
      }).then(res => res.json())

      const { data } = thread
      let localResponse:any = []
      
      data.data.forEach((data) => {
        data.content.forEach(({ text }) => {
          if (data.role === 'assistant') {
            localResponse.push({
              type: 'assistant',
              value: text.value
            })
          } else {
            localResponse.push({
              type: 'user',
              value: text.value
            })
          }
        })
      })
      setOpenaiResponse(localResponse.reverse())
      setLoading(false)
    } catch (err) {
      console.log('error: ', err)
      setLoading(false)
    }
  }

  async function addMessageToThread() {
    try {
      if (!input) return
      Keyboard.dismiss()
      const fileCopy = file

      let localInput = {
        type: 'user',
        value: input
      } as any
      setInput('')
      setOpenaiResponse([...openaiResponse, localInput])
      setInput('')
      setLoading(true)
      setFile(null)
  
      const body: {
        input: string,
        thread_id: string,
        assistant_id: string
      } = {
        input,
        thread_id: threadId,
        assistant_id: assistantId
      }
      let response
      if (fileCopy) {
        const formData = new FormData()
        // @ts-ignore
        formData.append('file', {
          uri: fileCopy.uri.replace('file://', ''),
          name: fileCopy.name,
          type: fileCopy.mimeType
        })
        for (const key in body) {
          formData.append(key, body[key])
        }
        response = await fetch(`${DOMAIN}/chat/add-message-to-thread`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }).then(res => res.json())
      } else {
        response = await fetch(`${DOMAIN}/chat/add-message-to-thread`, {
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(res => res.json())
      }

      const {
        runId: _runId
      } = response

      checkThread(_runId, threadId)
    } catch (err) {
      console.log('error: ', err)
      setLoading(false)
    }
  }

  async function chooseDocument() {
    try {
      const res = await DocumentPicker.getDocumentAsync()
      console.log('res: ', res)
      if (!res || !res.assets) return
      setFile(res.assets[0])
    } catch (err) {
      console.log('error:', err)
    }
  }

  const styles = getStyleSheet(theme)
  const isStarted = openaiResponse.length 

  function renderItem({ item, index }) {
    return (
      <View style={styles.promptResponse} key={index}>
          {
            item.type === 'user' && (
              <View style={styles.promptTextContainer}>
                <View style={styles.promptTextWrapper}>
                  <Text style={styles.promptText}>
                    {item.value}
                  </Text>
                </View>
              </View>
            )
          }
          {
            item.type === 'assistant' && (
              <View style={styles.textStyleContainer}>
                <Markdown
                  style={styles.textStyle as any}
                >{item.value}</Markdown>
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
        ref={scrollViewRef}
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={!isStarted && { flex: 1 }}
      >
        {
          (!isStarted) && (
            <View style={styles.midChatInputWrapper}>
              <View style={styles.midChatInputContainer}>
                <TextInput
                  onChangeText={onChangeInputText}
                  style={styles.midInput}
                  placeholder='What would you like to ask?'
                  placeholderTextColor={theme.placeholderTextColor}
                  autoCorrect={true}
                  value={input}
                />
                <TextInput
                  onChangeText={onChangeInstructionsText}
                  style={styles.midInput}
                  placeholder='Assistant instructions (optional)'
                  placeholderTextColor={theme.placeholderTextColor}
                  autoCorrect={true}
                  value={instructions}
                />
                <TouchableHighlight
                  underlayColor={'transparent'}
                  onPress={chooseDocument}
                  style={{
                    position: 'absolute',
                    top: 13,
                    right: 30,
                    padding: 5
                  }}
                >
                  <MaterialCommunityIcons
                    name="file-outline"
                    color={theme.mainTextColor}
                    size={24}
                  />
                </TouchableHighlight>
                <TouchableHighlight
                  onPress={createThread}
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
                {
                  file && (
                      <View style={styles.midFileNameContainer}>
                        <Text style={styles.fileName}>
                          {file.name || 'File from device'}
                        </Text>
                        <TouchableHighlight
                          onPress={() => setFile(null)}
                          style={styles.closeIconContainer}
                          underlayColor={'transparent'}
                        >
                          <MaterialCommunityIcons
                            style={styles.closeIcon}
                            name="close"
                            color={theme.settingsButtonBackgroundColor}
                            size={14}
                          />
                        </TouchableHighlight>
                      </View>
                    )
                  }
                  <Text style={styles.chatDescription}>
                    Chat with an assistant (with optional instructions and file interpreter)
                  </Text>
              </View>
            </View>
          )
        }
        {
          Boolean(isStarted) && (
            <FlatList
              data={openaiResponse}
              renderItem={renderItem}
              scrollEnabled={false}
              style={{ paddingTop: 10 }}
            />
          )
        }
        {
          loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator />
            </View>
          )
        }
      </ScrollView>
      {
       Boolean(isStarted) && file && (
          <View style={styles.fileNameContainer}>
            <Text style={styles.fileName}>
              {file.name || 'File from device'}
            </Text>
            <TouchableHighlight
              onPress={() => setFile(null)}
              style={styles.closeIconContainer}
              underlayColor={'transparent'}
            >
              <MaterialCommunityIcons
                style={styles.closeIcon}
                name="close"
                color={theme.settingsButtonBackgroundColor}
                size={14}
              />
            </TouchableHighlight>
          </View>
        )
      }
      {
        (Boolean(isStarted)) && (
          <View style={styles.chatInputContainer}>
            <TextInput
              onChangeText={onChangeInputText}
              style={styles.input}
              placeholder='What else do you want to know?'
              placeholderTextColor={theme.placeholderTextColor}
              autoCorrect={true}
              value={input}
            />
            <TouchableHighlight
              underlayColor={'transparent'}
              onPress={chooseDocument}
              style={{
                position: 'absolute',
                right: 65
              }}
            >
              <MaterialCommunityIcons
                name="file-outline"
                color={theme.mainTextColor}
                size={24}
              />
            </TouchableHighlight>
            <TouchableHighlight
              onPress={addMessageToThread}
              underlayColor={'transparent'}
            >
              <View style={styles.buttonStyle}>
                <Ionicons
                  name="md-arrow-up"
                  size={20} color="white"
                />
              </View>
            </TouchableHighlight>
          </View>
        )
      }
    </KeyboardAvoidingView>
  )
}

const getStyleSheet = theme => StyleSheet.create({
  chatDescription: {
    color: theme.textColor,
    textAlign: 'center',
    marginTop: 15,
    fontSize: 13,
    opacity: .8,
    paddingHorizontal: 30,
    fontFamily: 'Geist-Light'
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 8,
    marginBottom: 5,
    marginTop: 10,
    borderWidth:1,
    borderColor: theme.borderColor
  },
  shareIconWrapper: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  optionsIconWrapper: {
    padding: 10,
    paddingTop: 9,
    justifyContent: 'center',
    alignItems: 'center'
  },
  optionIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 20,
  },
  loadingContainer: {
    marginVertical: 25,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center'
  },
  loadingAudioText: {
    color: theme.mainTextColor,
    marginRight: 10,
    fontFamily: 'Geist-SemiBold'
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  midInput: {
    marginBottom: 8,
    borderWidth: 1,
    paddingHorizontal: 25,
    paddingRight: 48,
    marginHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 99,
    color: theme.textColor,
    borderColor: theme.borderColor,
    fontFamily: 'Geist-SemiBold',
  },
  midChatInputWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  midChatInputContainer: {
    width: '100%',
    paddingTop: 5,
    paddingBottom: 5
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
  soundPlaybackLabel: {
    color: theme.textColor,
    fontFamily: 'Geist-SemiBold',
    marginRight: 10
  },
  soundPlaybackContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.borderColor,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 17,
    marginHorizontal: 10,
    borderRadius: 13
  },
  soundPauseContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.borderColor,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 17,
    margin: 10,
    marginTop: 0,
    borderRadius: 13
  },
  closeIconContainer: {
    position: 'absolute',
    right: -15,
    top: -17,
    padding: 10,
    backgroundColor: 'transparent',
    borderRadius: 25,
  },
  closeIcon: {
    borderWidth: 1,
    padding: 4,
    backgroundColor: theme.backgroundColor,
    borderColor: theme.borderColor,
    borderRadius: 15
  },
  fileNameContainer: {
    marginHorizontal: 10,
    marginRight: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 7,
  },
  midFileNameContainer: {
    marginTop: 20,
    marginHorizontal: 10,
    marginRight: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 7,
  },
  fileName: {
    color: theme.textColor,
  },
  chatButtonContainer: {
    backgroundColor: theme.tintColor,
    padding: 11
  },
  chatTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  heroContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: height - 300
  },
  promptResponse: {
    marginTop: 10,
  },
  textStyleContainer: {
    borderWidth: 1,
    borderColor: theme.borderColor,
    padding: 15,
    paddingBottom: 10,
    paddingTop: 3,
    margin: 10,
    marginTop: 0,
    borderRadius: 13
  },
  textStyle: {
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
      fontSize: 16
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
      color: theme.textColor,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, .1)',
      fontFamily: 'Geist-Light'
    },
    hr: {
      backgroundColor: 'rgba(255, 255, 255, .1)',
      height: 1,
    },
    fence: {
      marginVertical: 5,
      padding: 10,
      backgroundColor: '#312e2e',
      color: theme.textColor,
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
  promptTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 15,
    marginLeft: 24,
    marginBottom: 10
  },
  promptTextWrapper: {
    borderRadius: 8,
    backgroundColor: theme.tintColor
  },
  promptText: {
    color: theme.secondaryTextColor,
    fontFamily: 'Geist-Regular',
    paddingVertical: 5,
    paddingHorizontal: 9,
    fontSize: 16
  },
  buttonStyle: {
    marginRight: 14,
    padding: 5,
    borderRadius: 99,
    backgroundColor: '#0381ff'
  },
  buttonText: {
    color: theme.textColor,
    fontFamily: 'Geist-Medium',
  },
  chatInputContainer: {
    paddingTop: 5,
    borderColor:'white',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 5
  },
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor
  },
  input: {
    flex: 1,
    height: 43,
    borderWidth: 1,
    borderRadius: 99,
    color: theme.lightWhite,
    marginHorizontal: 6,
    paddingHorizontal: 21,
    paddingBottom: 3,
    paddingRight: 39,
    borderColor: theme.borderColor,
    fontFamily: 'Geist-SemiBold',
  }
})