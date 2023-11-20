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
  Image,
  ActivityIndicator,
  ImageStyle,
  ViewStyle,
  Share
} from 'react-native'
import {
  // Loading,
  // Icon,
  // PauseAudio,
  // PlayAudio,
  // ShareIcon,
  // OptionsIcon
} from '../components'
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuid } from 'uuid'
import { AppContext, ThemeContext } from '../context'
import { getEventSource, getChatType } from '../utils'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import * as Clipboard from 'expo-clipboard'
import { useActionSheet } from '@expo/react-native-action-sheet'
import Markdown from '@ronradtke/react-native-markdown-display';
// import 'react-native-url-polyfill/auto'

const { height } = Dimensions.get('window')

export function Assistant({ navigation }) {
  const [loading, setLoading] = useState(false)
  const scrollViewRef = useRef<ScrollView | null>(null)
  const inputRef = useRef()
  const [input, setInput] = useState('')
  const [file, setFile] = useState<any>(null)
  const { showActionSheetWithOptions } = useActionSheet()
  const [loadingAudio, setLoadingAudio] = useState(false)
  const [updating, setUpdating] = useState()

  const playingSound = useRef({
    playing: false,
    paused: false,
    sound: null
  })
  const [count, setCount] = useState(0)

  function setPlayingSound(sound) {
    playingSound.current = sound
    setCount(c => c + 1)
  }

  const {
    chatType
  } = useContext(AppContext)
  const { theme } = useContext(ThemeContext)

  // openAI
  const [openaiResponse, setOpenaiResponse] = useState({
    messages: [],
    index: uuid()
  })
  
  function onChangeText(v) {
    setInput(v)
  }

  async function clearChat() {
    if (loading) return
    setFile(null)
    setOpenaiResponse({
      messages: [],
      index: uuid()
    })
  }

  async function chat() {
    if (!input) return
    if (!file) return
    generateAssistantResponse()
  }

  async function generateAssistantResponse() {
    try {
      Keyboard.dismiss()
      const fileUpload = file
  
      let openaiArray = [
        ...openaiResponse.messages,
        {
          user: input,
          image: fileUpload,
          assistant: ''
        }
      ]
      setOpenaiResponse(c => ({
        index: c.index,
        messages: JSON.parse(JSON.stringify(openaiArray))
      }))
  
      setInput('')
      setLoading(true)
  
      const imageId = uuid()

      const es = await getEventSource({
        body: {
          prompt: input
        },
        headers: '',
        type: getChatType(chatType),
      })

      let localResponse = ''

      const listener = (event) => {
        if (event.type === "open") {
          console.log("Open SSE connection.")
          setLoading(false)
        } else if (event.type === 'message') {
          if (event.data !== "[DONE]") {
            localResponse = localResponse + JSON.parse(event.data).data
            openaiArray[openaiArray.length - 1].assistant = localResponse
            setOpenaiResponse(c => ({
              index: c.index,
              messages: JSON.parse(JSON.stringify(openaiArray))
            }))
          } else {
            console.log('closing connection ... ')
            setLoading(false)
            es.close()
          }
        } else if (event.type === "error") {
          console.error("Connection error:", event.message)
          setLoading(false)
          es.close()
        } else if (event.type === "exception") {
          console.error("Error:", event.message, event.error)
          setLoading(false)
          es.close()
        }
      }

      es.addEventListener("open", listener)
      es.addEventListener("message", listener)
      es.addEventListener("error", listener)
    } catch (err) {
      console.log('error calling Vision API:', err)
      setLoading(false)
    }
  }

  async function chooseDocument() {
    try {
      let res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      })
      if (!res || !res.assets) return
      setFile(res.assets[0])
    } catch (err) {
      console.log('error:', err)
    }
  }

  const styles = getStyleSheet(theme)

  const isStarted = openaiResponse.messages.length 

  function renderItem({ item, index }) {
    return (
      <View style={styles.promptResponse} key={index}>
        <View style={styles.promptTextContainer}>
          <View style={styles.promptTextWrapper}>
            <Text style={styles.promptText}>
              {item.user}
            </Text>
          </View>
        </View>
        <View style={styles.textStyleContainer}>
          <Image
            source={{uri: item.image.uri}}
            style={styles.image as ImageStyle}
          />
          {
            item.assistant && (
              <>
              <Markdown
                style={styles.textStyle as any}
              >{item.assistant}</Markdown>
              </>
            )
          }
          </View>
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
                  onChangeText={onChangeText}
                  style={styles.midInput}
                  placeholder='What do you want to know about this image?'
                  placeholderTextColor={theme.placeholderTextColor}
                  autoCorrect={true}
                />
                <TouchableHighlight
                  underlayColor={'transparent'}
                  onPress={chooseDocument}
                  style={{
                    position: 'absolute',
                    top: 113,
                    right: 30,
                    padding: 5
                  }}
                >
                  <MaterialCommunityIcons
                    style={styles.closeIcon}
                    name="image"
                    color={theme.mainTextColor}
                    size={24}
                  />
                </TouchableHighlight>
                <TouchableHighlight
                  onPress={chat}
                  underlayColor={'transparent'}
                >
                  <View style={styles.midButtonStyle}>
                    <Ionicons
                      name="chatbubbles-outline"
                      size={22} color="white"
                    />
                    <Text style={styles.midButtonText}>
                      Chat
                    </Text>
                  </View>
                </TouchableHighlight>
                <Text style={styles.chatDescription}>
                  Vision model with GPT-4 level capabilities.
                </Text>
                {
                  file && (
                      <View style={styles.midFileNameContainer}>
                        <Text style={styles.fileName}>
                          {file.name || 'Image from Camera Roll'}
                        </Text>
                        <TouchableHighlight
                          onPress={() => setFile(null)}
                          style={styles.closeIconContainer}
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
              </View>
            </View>
          )
        }
        {
          Boolean(isStarted) && (
            <FlatList
              data={openaiResponse.messages}
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
              {file.name || 'Image from Camera Roll'}
            </Text>
            <TouchableHighlight
              onPress={() => setFile(null)}
              style={styles.closeIconContainer}
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
              onChangeText={onChangeText}
              style={styles.input}
              placeholder='What do you want to know about this image?'
              placeholderTextColor={theme.placeholderTextColor}
              autoCorrect={true}
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
                style={styles.closeIcon}
                name="image"
                color={theme.mainTextColor}
                size={24}
              />
            </TouchableHighlight>
            <TouchableHighlight
              onPress={chat}
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
    color: theme.lightTextColor,
    textAlign: 'center',
    marginTop: 15,
    fontSize: 13,
    opacity: .8,
    fontFamily: 'Geist-Light'
  },
  image: {
    // width: 250,
    // height: 250,
    // borderRadius: 8,
    // marginBottom: 5,
    // marginTop: 10,
    // borderWidth:1,
    // borderColor: theme.borderColor
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
    color: theme.lightWhite,
    borderColor: theme.lightWhiteBorder,
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
    fontFamily: 'Geist-Regular',
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
    right: -7,
    top: -7,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 25,
  },
  closeIcon: {
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
  chatTypeText: {
    color: 'rgba(255, 255, 255, .8)',
    textAlign: 'center',
    fontFamily: 'Geist-SemiBold'
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
      color: 'white',
      fontFamily: 'Geist-Regular'
    },
    paragraph: {
      color: 'white',
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
      color: 'white',
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
      color: 'white',
      fontSize: 16,
      fontFamily: 'Geist-Regular'
    },
    code_inline: {
      backgroundColor: '#312e2e',
      color: 'white',
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
  promptTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 15,
    marginLeft: 24,
    marginBottom: 10
  },
  promptTextWrapper: {
    borderRadius: 8,
    backgroundColor: theme.backgroundColor
  },
  promptText: {
    color: 'rgba(255, 255, 255, 1)',
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