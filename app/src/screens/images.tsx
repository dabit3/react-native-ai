import {
  View,
  Text,
  TouchableHighlight,
  KeyboardAvoidingView,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Share,
  Keyboard,
  Image
} from 'react-native'
import { useState, useEffect, useRef, useContext } from 'react'
import {
  Icon
} from '../components'
import { DOMAIN } from '../../constants'
import { IMAGE_MODELS } from '../../constants'
import { v4 as uuid } from 'uuid'
import { ThemeContext, AppContext } from '../context'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as FileSystem from 'expo-file-system';
import { useActionSheet } from '@expo/react-native-action-sheet'
import * as Clipboard from 'expo-clipboard'

const { width } = Dimensions.get('window')

export function Images({ navigation } : { navigation: any }) {
  const [callMade, setCallMade] = useState(false)
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [input, setInput] = useState('')
  const scrollViewRef = useRef<ScrollView | null>(null)
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<any>({
    index: uuid,
    values: []
  })

  const { showActionSheetWithOptions } = useActionSheet()

  const {
    handlePresentModalPress,
    imageModel
  } = useContext(AppContext)


  async function generate() {
    if (loading) return
    if (!input) return
    Keyboard.dismiss()
    setLoading(true)
    const currentModel = imageModel

    console.log('currentModel:', currentModel)
    console.log('input:', input)

    try {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({
          animated: true
        })
      }, 1)
      setCallMade(true)
      let imagesArray = [
        ...images.values, {
          user: input,
        }
      ]
      setImages(images => ({
        index: images.index,
        values: JSON.parse(JSON.stringify(imagesArray))
      }))
      setInput('')

      const response = await fetch(`${DOMAIN}/images/fal`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: input,
          model: imageModel
        })
      })
      const json = await response.json()

      if (json.image) {
        imagesArray[imagesArray.length - 1].image = json.image
        imagesArray[imagesArray.length - 1].model = currentModel
        setImages(i => ({
          index: i.index,
          values: imagesArray          
        }))
        setLoading(false)
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({
            animated: true
          })
        }, 50)
      } else {
        setLoading(false)
        console.log('error generating image ...', json)
      }
    } catch (err) {
      setLoading(false)
      console.log('error generating image ...', err)
    }
  }


  async function copyToClipboard(text:string) {
    await Clipboard.setStringAsync(text)
  }

  function clearPrompts() {
    setCallMade(false)
    setImages({
      index: uuid,
      values: []
    })
  }

  async function showClipboardActionsheet(d) {
    handlePresentModalPress()
    const cancelButtonIndex = 3
    showActionSheetWithOptions({
      options: ['Save image', 'Clear prompts', 'cancel'],
      cancelButtonIndex
    }, selectedIndex => {
      if (selectedIndex === Number(0)) {
        downloadImageToDevice(d.image)
      }
      if (selectedIndex === Number(1)) {
        clearPrompts()
      }

    })
  }

  async function downloadImageToDevice(url: string) {
    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        FileSystem.documentDirectory + uuid() + '.png',
      )
      
      try {
        const data = await downloadResumable.downloadAsync();
        console.log('Finished downloading ', data)
      } catch (e) {
        console.error(e);
      }
    } catch (err) {
      console.log('error saving image ...', err)
    }
  }

  function onChangeText(val: string) {
    setInput(val)
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.container}
        keyboardVerticalOffset={110}
        >
        <ScrollView
          contentContainerStyle={!callMade && styles.scrollContentContainer}
          ref={scrollViewRef}
          keyboardShouldPersistTaps='handled'
          style={styles.scrollContainer}
        >
          {
            !callMade && (
              <View style={styles.midChatInputWrapper}>
                <View style={styles.midChatInputContainer}>
                  <View style={styles.iconContainer}>
                    <Icon
                      width={50}
                      height={50}
                      style={{marginBottom: 10}}
                    />
                  </View>
                  <TextInput
                    onChangeText={onChangeText}
                    style={styles.midInput}
                    placeholder='What do you want to create?'
                    placeholderTextColor={theme.mutedForegroundColor}
                    autoCorrect={true}
                  />
                  <TouchableHighlight
                    onPress={generate}
                    underlayColor={'transparent'}
                    onLongPress={
                      () => {
                        Keyboard.dismiss()
                        handlePresentModalPress()
                      }
                    }
                  >
                    <View style={styles.midButtonStyle}>
                      <Ionicons
                        name="images-outline"
                        size={22} color="white"
                      />
                      <Text style={styles.midButtonText}>
                        Create
                      </Text>
                    </View>
                  </TouchableHighlight>
                  <Text style={styles.chatDescription}>
                    Generate images and art using natural language. Choose from a variety of models.
                  </Text>
                </View>
              </View>
            )
          }
          {
            images.values.map((v, index) => (
              <View key={index} style={styles.imageContainer}>
                <View style={styles.promptTextContainer}>
                  <TouchableHighlight
                    underlayColor={'transparent'}
                  >
                    <View style={styles.promptTextWrapper}>
                      <Text style={styles.promptText}>
                        {v.user}
                      </Text>
                    </View>
                  </TouchableHighlight>
                </View>
                {
                  v.image && (
                    <View>
                      <TouchableHighlight
                        onPress={() => showClipboardActionsheet(v)}
                        underlayColor={'transparent'}
                      >
                        <Image
                          source={{ uri: v.image }}
                          style={styles.image}
                        />
                      </TouchableHighlight>
                      <View style={styles.modelLabelContainer}>
                          <Text style={
                            styles.modelLabelText
                          }>
                            created with {v.model}
                          </Text>
                        </View>
                    </View>
                  )
                }
              </View>
            ))
          }
          { loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator />
            </View>
          ) }
        </ScrollView>
        {
          callMade && (
            <View style={styles.chatInputContainer}>
              <TextInput
                onChangeText={onChangeText}
                style={styles.input}
                placeholder='What else do you want to create?'
                placeholderTextColor={theme.placeholderTextColor}
                autoCorrect={true}
              />
              <TouchableHighlight
                onPress={generate}
                underlayColor={'transparent'}
                onLongPress={
                  () => {
                    Keyboard.dismiss()
                    handlePresentModalPress()
                  }
                }
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
    </View>
  )
}

const getStyles = theme => StyleSheet.create({
  imageContainer: {
    marginBottom: 15
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
  modelLabelContainer: {
    padding: 9,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: theme.borderColor,
    paddingLeft: 13,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginHorizontal: 5,
  },
  modelLabelText: {
    color: theme.mutedForegroundColor,
    fontFamily: 'Geist-Regular',
    fontSize: 13
  },
  imageButtonContainer: {
    backgroundColor: theme.secondaryBackgroundColor,
    padding: 11
  },
  imageTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  progressBarContainer: {
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 25,
    paddingRight: 10,
    marginTop: 5
  },
  loadingContainer: {
    marginVertical: 25,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center'
  },
  image: {
    width: width - 10,
    height: width - 10,
    marginTop: 5,
    marginHorizontal: 5,
    borderRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  promptTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 5,
    marginLeft: 24,
    marginBottom: 5
  },
  promptTextWrapper: {
    borderRadius: 6,
    backgroundColor: '#0381ff',
  },
  promptText: {
    color: 'rgba(255, 255, 255, 1)',
    fontFamily: 'Geist-Regular',
    paddingVertical: 5,
    paddingHorizontal: 9,
    fontSize: 16
  },
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  scrollContentContainer: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: 10
  },
  midChatInputWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  midChatInputContainer: {
    width: '100%',
    paddingTop: 5,
    paddingBottom: 5
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
  buttonStyle: {
    marginRight: 14,
    marginLeft: 5,
    padding: 5,
    borderRadius: 99,
    backgroundColor: theme.tintColor
  },
  buttonText: {
    color: theme.textColor,
    fontFamily: 'Geist-Medium',
  },
})