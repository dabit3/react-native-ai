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
  Keyboard,
  Image
} from 'react-native'
import { useState, useRef, useContext } from 'react'
import { DOMAIN, IMAGE_MODELS, ILLUSION_DIFFUSION_IMAGES } from '../../constants'
import { v4 as uuid } from 'uuid'
import { ThemeContext, AppContext } from '../context'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useActionSheet } from '@expo/react-native-action-sheet'
import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import * as Clipboard from 'expo-clipboard'

const { width } = Dimensions.get('window')

type ImagesState = {
  index: typeof uuid,
  values: any[]
}

export function Images() {
  const [callMade, setCallMade] = useState(false)
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [input, setInput] = useState('')
  const scrollViewRef = useRef<ScrollView | null>(null)
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState<any>(null)
  const [images, setImages] = useState<ImagesState>({
    index: uuid,
    values: []
  })
  const {
    handlePresentModalPress,
    closeModal,
    imageModel,
    illusionImage
  } = useContext(AppContext)

  const { showActionSheetWithOptions } = useActionSheet()

  const hideInput =
  imageModel === IMAGE_MODELS.removeBg.label ||
  imageModel === IMAGE_MODELS.upscale.label
  const buttonLabel = imageModel === IMAGE_MODELS.removeBg.label ? 'Remove background' : 'Upscale'

  async function generate() {
    if (loading) return
    if (hideInput && !image) {
      console.log('no image selected')
      return
    } else if (!hideInput && !input) {
      console.log('no input')
      return
    }
    Keyboard.dismiss()
    const imageCopy = image
    const currentModel = IMAGE_MODELS[imageModel].name
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

      let response

      const body = {
        prompt: input,
        model: imageModel
      } as any

      setLoading(true)
      setImage(null)
      setInput('')

      if (imageCopy) {
        const formData = new FormData()
        // @ts-ignore
        formData.append('file', {
          uri: imageCopy.uri.replace('file://', ''),
          name: uuid(),
          type: imageCopy.mimeType
        })
        for (const key in body) {
          formData.append(key, body[key])
        }

        response = await fetch(`${DOMAIN}/images/fal`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }).then(res => res.json())
      } else {
        if (imageModel === IMAGE_MODELS.illusionDiffusion.label) {
          body.baseImage = ILLUSION_DIFFUSION_IMAGES[illusionImage].image
        }

        response = await fetch(`${DOMAIN}/images/fal`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }).then(res => res.json())
      }
      if (response.image) {
        imagesArray[imagesArray.length - 1].image = response.image
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
        console.log('error generating image ...', response)
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
    closeModal()
    const cancelButtonIndex = 2
    showActionSheetWithOptions({
      options: ['Save image', 'Clear prompts', 'cancel'],
      cancelButtonIndex
    }, selectedIndex => {
      if (selectedIndex === Number(0)) {
        console.log('saving image ...')
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
        await downloadResumable.downloadAsync()
      } catch (e) {
        console.error(e)
      }
    } catch (err) {
      console.log('error saving image ...', err)
    }
  }

  function onChangeText(val: string) {
    setInput(val)
  }

  async function chooseImage() {
    try {
      let res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      })
      if (!res || !res.assets) return
      setImage(res.assets[0])
    } catch (err) {
      console.log('error:', err)
    }
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
                  {
                    !hideInput && (
                      <>
                        <TextInput
                          onChangeText={onChangeText}
                          style={styles.midInput}
                          placeholder='What do you want to create?'
                          placeholderTextColor={theme.placeholderTextColor}
                          autoCorrect={true}
                          value={input}
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
                              size={22} color={theme.tintTextColor}
                            />
                            <Text style={styles.midButtonText}>
                              Create
                            </Text>
                          </View>
                        </TouchableHighlight>
                      </>
                    )
                  }
                  {
                    hideInput && (
                      <TouchableHighlight
                        onPress={image ? generate : chooseImage}
                        underlayColor={'transparent'}
                      >
                        <View style={styles.midButtonStyle}>
                          <Ionicons
                            name="images-outline"
                            size={22} color={theme.tintTextColor}
                          />
                          <Text style={styles.midButtonText}>
                            {
                              image ? buttonLabel : 'Choose image'
                            }
                          </Text>
                        </View>
                      </TouchableHighlight>
                    )
                  }
                  {
                  image && (
                      <View style={styles.midFileNameContainer}>
                        <Text style={styles.fileName}>
                          {image.name || 'Image from Camera Roll'}
                        </Text>
                        <TouchableHighlight
                          onPress={() => setImage(null)}
                          style={styles.closeIconContainer}
                          underlayColor={'transparent'}
                        >
                          <MaterialIcons
                            style={styles.closeIcon}
                            name="close"
                            color={theme.textColor}
                            size={14}
                          />
                        </TouchableHighlight>
                      </View>
                    )
                  }
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
                {
                  v.user && (
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
                  )
                }
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
                            Created with Fal.ai model {v.model}
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
            <>
              {
                !hideInput && (
                  <View style={styles.chatInputContainer}>
                    <TextInput
                      onChangeText={onChangeText}
                      style={styles.input}
                      placeholder='What else do you want to create?'
                      placeholderTextColor={theme.placeholderTextColor}
                      autoCorrect={true}
                      value={input}
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
                          size={20} color={theme.tintTextColor}
                        />
                      </View>
                    </TouchableHighlight>
                  </View>
                )
              }
              {
                hideInput && (
                  <TouchableHighlight
                    onPress={image ? generate : chooseImage}
                    underlayColor={'transparent'}
                  >
                    <View style={styles.bottomButtonStyle}>
                      <Ionicons
                        name="images-outline"
                        size={22} color={theme.tintTextColor}
                      />
                      <Text style={styles.midButtonText}>
                        {
                          image ? buttonLabel : 'Choose image'
                        }
                      </Text>
                    </View>
                  </TouchableHighlight>
                )
              }
            </>
          )
        }
      </KeyboardAvoidingView>
    </View>
  )
}

const getStyles = theme => StyleSheet.create({
  closeIcon: {
    borderWidth: 1,
    padding: 4,
    backgroundColor: theme.backgroundColor,
    borderColor: theme.borderColor,
    borderRadius: 15
  },
  closeIconContainer: {
    position: 'absolute',
    right: -15,
    top: -17,
    padding: 10,
    backgroundColor: 'transparent',
    borderRadius: 25,
  },
  fileName: {
    color: theme.textColor,
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
    fontFamily: theme.regularFont
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
    fontFamily: theme.regularFont,
    fontSize: 13
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
  chatInputContainer: {
    paddingTop: 5,
    borderColor: theme.borderColor,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
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
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
  bottomButtonStyle: {
    marginVertical: 5,
    flexDirection: 'row',
    marginHorizontal: 6,
    paddingHorizontal: 7,
    paddingVertical: 7,
    borderRadius: 4,
    backgroundColor: theme.tintColor,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonStyle: {
    marginRight: 14,
    padding: 5,
    borderRadius: 99,
    backgroundColor: theme.tintColor
  },
  buttonText: {
    color: theme.textColor,
    fontFamily: theme.mediumFont,
  },
})