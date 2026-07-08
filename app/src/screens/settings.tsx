import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  ScrollView,
  TextInput
} from 'react-native'
import { useContext } from 'react'
import { AppContext, ThemeContext } from '../context'
import { GeminiIcon } from '../components/index'
import { Ionicons } from '@expo/vector-icons'
import { IMAGE_MODELS } from '../../constants'
import { THEMES } from '../theme'
import { Theme } from '../../types'

const imageModels = Object.values(IMAGE_MODELS)

const themeOptions: { name: string, label: string, swatches?: string[] }[] = [
  { name: 'System', label: 'system' },
  ...Object.values(THEMES).map(v => ({
    name: v.name,
    label: v.label,
    swatches: [v.backgroundColor, v.tintColor, v.textColor]
  }))
]

export function Settings() {
  const { theme, setTheme, themeName } = useContext(ThemeContext)
  const {
    chatType,
    setChatType,
    setImageModel,
    imageModel,
    models,
    systemPrompt,
    setSystemPrompt,
  } = useContext(AppContext)

  const styles = getStyles(theme)

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.titleContainer}>
        <Text style={styles.mainText}>Theme</Text>
      </View>
      {
        themeOptions.map((value, index) => {
          const selected = themeName === value.label
          return (
            <TouchableHighlight
              key={index}
              underlayColor='transparent'
              accessibilityRole="button"
              accessibilityLabel={`Use ${value.name} theme`}
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
                {
                  value.swatches ? (
                    <View style={styles.swatchRow}>
                      {value.swatches.map((color, i) => (
                        <View
                          key={i}
                          style={[styles.swatch, { backgroundColor: color }]}
                        />
                      ))}
                    </View>
                  ) : (
                    <Ionicons
                      name="contrast-outline"
                      size={18}
                      style={styles.swatchRow}
                      color={selected ? theme.tintTextColor : theme.textColor}
                    />
                  )
                }
                <Text
                  style={{
                    ...styles.chatTypeText,
                    ...getDynamicTextStyle(themeName, value.label, theme)
                  }}
                >
                  {value.name}
                </Text>
                {
                  selected && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      style={styles.checkmark}
                      color={theme.tintTextColor}
                    />
                  )
                }
              </View>
            </TouchableHighlight>
          )
        })
      }
      <View style={styles.titleContainer}>
        <Text style={styles.mainText}>Chat Model</Text>
      </View>
      <View style={styles.buttonContainer}>
        {
          models.map((model, index) => {
            const ModelIcon = model.icon
            const selected = chatType.label === model.label
            return (
              <TouchableHighlight
                key={index}
                underlayColor='transparent'
                accessibilityRole="button"
                accessibilityLabel={`Use ${model.name} model`}
                onPress={() => {
                  setChatType(model)
                }}
              >
                <View
                  style={{...styles.chatChoiceButton, ...getDynamicViewStyle(chatType.label, model.label, theme)}}
                >
                  <ModelIcon
                    theme={theme}
                    size={18}
                    style={{ marginRight: 8 }}
                    selected={selected}
                  />
                  <Text
                    style={{...styles.chatTypeText, ...getDynamicTextStyle(chatType.label, model.label, theme)}}
                  >
                    { model.name }
                  </Text>
                  {
                    selected && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        style={styles.checkmark}
                        color={theme.tintTextColor}
                      />
                    )
                  }
                </View>
              </TouchableHighlight>
            )
          })
        }
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.mainText}>Image Model</Text>
      </View>
      <View style={styles.buttonContainer}>
        {
          imageModels.map((model, index) => {
            const selected = imageModel === model.label
            return (
              <TouchableHighlight
                key={index}
                underlayColor='transparent'
                accessibilityRole="button"
                accessibilityLabel={`Use ${model.name} image model`}
                onPress={() => {
                  setImageModel(model.label)
                }}
              >
                <View
                  style={{...styles.chatChoiceButton, ...getDynamicViewStyle(imageModel, model.label, theme)}}
                >
                  <GeminiIcon
                    theme={theme}
                    size={18}
                    style={{ marginRight: 8 }}
                    color={selected ? theme.tintTextColor : theme.textColor}
                  />
                  <Text
                    style={{...styles.chatTypeText, ...getDynamicTextStyle(imageModel, model.label, theme)}}
                  >
                    { model.name }
                  </Text>
                  {
                    selected && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        style={styles.checkmark}
                        color={theme.tintTextColor}
                      />
                    )
                  }
                </View>
              </TouchableHighlight>
            )
          })
        }
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.mainText}>Custom Instructions</Text>
        <Text style={styles.subText}>
          Sent to the model with every chat as a system prompt.
        </Text>
      </View>
      <TextInput
        style={styles.systemPromptInput}
        multiline
        value={systemPrompt}
        onChangeText={setSystemPrompt}
        placeholder="e.g. Respond concisely. I am a software developer."
        placeholderTextColor={theme.placeholderTextColor}
        accessibilityLabel="Custom instructions input"
      />
    </ScrollView>
  )
}

function getDynamicTextStyle(baseType: string, type: string, theme: Theme) {
  if (type === baseType) {
    return {
      color: theme.tintTextColor,
    }
  } else return {}
}

function getDynamicViewStyle(baseType: string, type: string, theme: Theme) {
  if (type === baseType) {
    return {
      backgroundColor: theme.tintColor
    }
  } else return {}
}

const getStyles = (theme: Theme) => StyleSheet.create({
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
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 4,
    borderWidth: 1,
    borderColor: theme.borderColor
  },
  checkmark: {
    marginLeft: 'auto'
  },
  chatChoiceButton: {
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44
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
  subText: {
    fontFamily: theme.regularFont,
    fontSize: 13,
    marginTop: 4,
    color: theme.mutedForegroundColor
  },
  systemPromptInput: {
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 12,
    marginHorizontal: 15,
    marginBottom: 24,
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
    color: theme.textColor,
    fontFamily: theme.regularFont
  },
})
