import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  ScrollView,
  Dimensions,
  Image
} from 'react-native'
import { useContext } from 'react'
import { AppContext, ThemeContext } from '../context'
import {
  AnthropicIcon,
  OpenAIIcon,
  CohereIcon,
  MistralIcon,
  GeminiIcon
 } from '../components/index'
import FontAwesome from '@expo/vector-icons/FontAwesome5'
import { IIconProps } from '../../types'
import { MODELS, IMAGE_MODELS, ILLUSION_DIFFUSION_IMAGES } from '../../constants'
import * as themes from '../theme'

const { width } = Dimensions.get('window')
const models = Object.values(MODELS)
const imageModels = Object.values(IMAGE_MODELS)
const _themes = Object.values(themes).map(v => ({
  name: v.name,
  label: v.label
}))
const diffusionImages = Object.values(ILLUSION_DIFFUSION_IMAGES)

export function Settings() {
  const { theme, setTheme, themeName } = useContext(ThemeContext)
  const {
    chatType,
    setChatType,
    setImageModel,
    imageModel,
    illusionImage,
    setIllusionImage
  } = useContext(AppContext)

  const styles = getStyles(theme)

  function renderIcon({
    type, props
  }: IIconProps) {
    if (type.includes('gpt')) {
      return <OpenAIIcon {...props} />
    }
    if (type.includes('claude')) {
      return <AnthropicIcon {...props} />
    }
    if (type.includes('cohere')) {
      return <CohereIcon {...props} />
    }
    if (type.includes('mistral')) {
      return <MistralIcon{...props} />
    }
    if (type.includes('gemini')) {
      return <GeminiIcon{...props} />
    }
    if (type.includes('fastImage')) {
      return <FontAwesome name="images" {...props} />
    }
    if (type.includes('removeBg')) {
      return <FontAwesome name="eraser" {...props} />
    }
    if (type.includes('upscale')) {
      return <FontAwesome name="chevron-up" {...props} />
    }
    if (type.includes('illusion')) {
      return <FontAwesome name="cubes" {...props} />
    }
    return <FontAwesome name="images" {...props} />
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View
        style={styles.titleContainer}
      >
        <Text
            style={styles.mainText}
        >Theme</Text>
      </View>
      {
        _themes.map((value, index) => (
          <TouchableHighlight
            key={index}
            underlayColor='transparent'
            onPress={() => {
              setTheme(value.label)
            }}
          >
            <View
              style={{
                ...styles.chatChoiceButton,
                ...getDynamicViewStyle(themeName, value.label, theme)
              }}
            >
            <Text
              style={{
                ...styles.chatTypeText,
                ...getDynamicTextStyle(themeName, value.label, theme)
              }}
            >
              {value.name}
            </Text>
          </View>
        </TouchableHighlight>
        ))
      }
      <View
        style={styles.titleContainer}
      >
      <Text
          style={styles.mainText}
        >Chat Model</Text>
      </View>
      <View style={styles.buttonContainer}>
        {
          models.map((model, index) => {
            return (
              <TouchableHighlight
                key={index}
                underlayColor='transparent'
                onPress={() => {
                  setChatType(model)
                }}
              >
                <View
                  style={{...styles.chatChoiceButton, ...getDynamicViewStyle(chatType.label, model.label, theme)}}
                >
                {
                  renderIcon({
                    type: model.label,
                    props: {
                      theme,
                      size: 18,
                      style: {marginRight: 8},
                      selected: chatType.label === model.label
                    }
                  })
                }
                <Text
                  style={{...styles.chatTypeText, ...getDynamicTextStyle(chatType.label, model.label, theme)}}
                >
                  { model.name }
                </Text>
              </View>
            </TouchableHighlight>
            )
          })
        }
      </View>
      <View
        style={styles.titleContainer}
      >
      <Text
          style={styles.mainText}
        >Image Model</Text>
      </View>
      <View style={styles.buttonContainer}>
        {
          imageModels.map((model, index) => {
            return (
              <TouchableHighlight
                key={index}
                underlayColor='transparent'
                onPress={() => {
                  setImageModel(model.label)
                }}
              >
                <View
                  style={{...styles.chatChoiceButton, ...getDynamicViewStyle(imageModel, model.label, theme)}}
                >
                {
                  renderIcon({
                    type: model.label,
                    props: {
                      theme,
                      size: 18,
                      style: {marginRight: 8},
                      color: imageModel === model.label ? theme.tintTextColor : theme.textColor
                    }
                  })
                }
                <Text
                  style={{...styles.chatTypeText, ...getDynamicTextStyle(imageModel, model.label, theme)}}
                >
                  { model.name }
                </Text>
              </View>
            </TouchableHighlight>
            )
          })
        }
        <View
          style={styles.titleContainer}
        >
          <Text
            style={styles.mainText}
          >Illusion Diffusion Base</Text>
        </View>
        <View
          style={styles.illusionImageContainer}
        >
          {
            diffusionImages.map((model, index) => (
              <TouchableHighlight
                key={index}
                underlayColor='transparent'
                onPress={() => {
                  setIllusionImage(model.label)
                }}
              >
                <Image
                  source={{ uri: model.image}}
                  style={{
                    ...styles.illusionImage,
                    borderColor: illusionImage === model.label ? theme.tintColor : theme.textColor
                  }}
                />
              </TouchableHighlight>
            ))
          }
        </View>
      </View>
    </ScrollView>
  )
}

function getDynamicTextStyle(baseType:string, type:string, theme:any) {
  if (type === baseType) {
    return {
      color: theme.tintTextColor,
    }
  } else return {}
}


function getDynamicViewStyle(baseType:string, type:string, theme:any) {
  if (type === baseType) {
    return {
      backgroundColor: theme.tintColor
    }
  } else return {}
}

const getStyles = (theme:any) => StyleSheet.create({
  illusionImage: {
    width: (width - 30) / 3,
    height: (width - 30) / 3,
    borderWidth: 4,
  },
  illusionImageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10
  },
  buttonContainer: {
    marginBottom: 20
  },
  container: {
    padding: 14,
    flex: 1,
    backgroundColor: theme.backgroundColor,
    paddingTop: 10,
  },
  contentContainer: {
    paddingBottom: 40
  },
  titleContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10
  },
  chatChoiceButton: {
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row'
  },
  chatTypeText: {
    fontFamily: theme.semiBoldFont,
    color: theme.textColor
  },
  mainText: {
    fontFamily: theme.boldFont,
    fontSize: 18,
    color: theme.textColor
  },
})