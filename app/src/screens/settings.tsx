import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  ScrollView
} from 'react-native'
import { useContext } from 'react'
import { AppContext, ThemeContext } from '../context'
import {
  AnthropicIcon,
  OpenAIIcon,
  CohereIcon,
 } from '../components/index'
 import FontAwesome from '@expo/vector-icons/FontAwesome5'
 import { IIconProps } from '../../types'
 import { MODELS, IMAGE_MODELS } from '../../constants'
 import * as themes from '../theme'

const models = Object.values(MODELS)
const imageModels = Object.values(IMAGE_MODELS)

const _themes = Object.values(themes).map(v => {
  return {
    name: v.name,
    label: v.label
  }
})

export function Settings() {
  const { theme, setTheme, themeName } = useContext(ThemeContext)
  const {
    chatType,
    setChatType,
    setImageModel,
    imageModel
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
    if (type.includes('fastImage')) {
      return <FontAwesome name="images" {...props} />
    }
    if (type.includes('removeBg')) {
      return <FontAwesome name="x-ray" {...props} />
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
                      color: imageModel === model.label ? theme.secondaryTextColor : theme.textColor
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
      </View>
    </ScrollView>
  )
}

function getDynamicTextStyle(baseType:string, type:string, theme:any) {
  if (type === baseType) {
    return {
      color: theme.highlightedTextColor,
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
  buttonContainer: {
    marginBottom: 20
  },
  container: {
    padding: 14,
    flex: 1,
    backgroundColor: theme.backgroundColor,
    paddingTop: 20,
  },
  contentContainer: {
    paddingBottom: 40
  },
  titleContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  chatChoiceButton: {
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row'
  },
  chatTypeText: {
    fontFamily: 'Geist-SemiBold',
    color: theme.textColor
  },
  mainText: {
    fontFamily: 'Geist-Bold',
    fontSize: 18,
    color: theme.textColor
  },
})