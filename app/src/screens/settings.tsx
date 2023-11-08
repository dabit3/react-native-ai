import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  Switch,
  Image,
  ScrollView
} from 'react-native'
import { useContext, useEffect } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppContext, ThemeContext } from '../context'
import FeatherIcon from '@expo/vector-icons/Feather'
import {
  AnthropicIcon,
  OpenAIIcon,
  CohereIcon,
 } from '../components'
 import { IIconProps } from '../../types'

 const models = [
  { name: 'GPT 4', icon: OpenAIIcon, label: 'gpt' },
  { name: 'GPT Turbo', icon: OpenAIIcon, label: 'gptTurbo' },
  { name: 'Claude', icon: AnthropicIcon, label: 'claude' },
  { name: 'Claude Instant', icon: AnthropicIcon, label: 'claudeInstant' },
  { name: 'Cohere', icon: CohereIcon, label: 'cohere' } 
 ]

export function Settings() {
  const { theme } = useContext(ThemeContext)
  const {
    chatType,
    setChatType,
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
    return <CohereIcon {...props} />
  }

  return (
    <View style={styles.container}>
      <View
        style={styles.titleContainer}
      >
        <Text
          style={styles.mainText}
        >Settings</Text>
      </View>
      <View>
        {
          models.map((model, index) => {
            return (
              <TouchableHighlight
                key={index}
                underlayColor='transparent'
                onPress={() => {
                  setChatType(model.label)
                }}
              >
                <View
                  style={{...styles.chatChoiceButton, ...getChatStyle(chatType, model.label, theme)}}
                >
                {
                  renderIcon({
                    type: model.label,
                    props: {
                      theme,
                      size: 18,
                      style: {marginRight: 8},
                      selected: chatType === model.label
                    }
                  })
                }
                <Text
                  style={{...styles.chatTypeText, ...getChatTextStyle(chatType, model.label, theme)}}
                >
                  { model.name }
                </Text>
              </View>
            </TouchableHighlight>
            )
          })
        }
      </View>
    </View>
  )
}

function getChatTextStyle(type:string, baseType:string, theme:any) {
  if (type === baseType) {
    return {
      color: theme.highlightedTextColor,
    }
  } else return {}
}


function getChatStyle(type:string, baseType:string, theme:any) {
  if (type === baseType) {
    return {
      backgroundColor: theme.tintColor
    }
  } else return {}
}

const getStyles = (theme:any) => StyleSheet.create({
  container: {
    padding: 14,
    flex: 1,
    backgroundColor: theme.backgroundColor,
    paddingTop: 0,
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
    fontFamily: 'Geist-SemiBold'
  },
  mainText: {
    fontFamily: 'Geist-Bold',
    fontSize: 18
  },
})